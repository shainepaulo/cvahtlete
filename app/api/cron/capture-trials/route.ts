import { NextResponse, type NextRequest } from 'next/server'
import { getStripe } from '@/utils/stripe'
import { createAdminClient } from '@/utils/supabase/admin'

export const runtime = 'nodejs'

/**
 * GET /api/cron/capture-trials — exécuté toutes les heures par Vercel Cron.
 *
 * Capture les PAIEMENTS UNIQUES différés (essai Pro 3 jours) arrivés à
 * échéance : PaymentIntent autorisé à J0 => capturé ici à J+3 si l'utilisateur
 * n'a pas annulé. L'activation du plan et l'e-mail « Done » sont déclenchés
 * par le webhook payment_intent.succeeded (source de vérité unique).
 *
 * Sécurité : Vercel Cron envoie `Authorization: Bearer ${CRON_SECRET}` —
 * toute autre requête est rejetée.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const admin = createAdminClient()
  const stripe = getStripe()

  const { data: due, error } = await admin
    .from('subscriptions')
    .select('user_id, stripe_payment_intent_id')
    .eq('status', 'trialing')
    .not('stripe_payment_intent_id', 'is', null)
    .lte('trial_ends_at', new Date().toISOString())
    .limit(50)

  if (error) {
    console.error('[cron-capture] Lecture des essais échus impossible :', error.message)
    return NextResponse.json({ error: 'Lecture impossible.' }, { status: 500 })
  }

  let captured = 0
  let failed = 0

  for (const sub of due ?? []) {
    try {
      const intent = await stripe.paymentIntents.retrieve(sub.stripe_payment_intent_id!)
      if (intent.status === 'requires_capture') {
        await stripe.paymentIntents.capture(intent.id)
        captured++
      } else if (intent.status === 'canceled') {
        // Annulé côté Stripe sans que le webhook soit passé : on resynchronise.
        await admin
          .from('subscriptions')
          .update({ status: 'canceled', plan: 'free', trial_ends_at: null, updated_at: new Date().toISOString() })
          .eq('user_id', sub.user_id)
        await admin.from('profiles').update({ plan: 'free' }).eq('id', sub.user_id)
        await admin.from('cvs').update({ visibility: 'private' }).eq('user_id', sub.user_id)
      }
    } catch (e) {
      // Carte expirée / autorisation tombée : on marque l'échec pour relance manuelle.
      failed++
      console.error('[cron-capture] Capture échouée pour', sub.user_id, e)
      await admin
        .from('subscriptions')
        .update({ status: 'past_due', updated_at: new Date().toISOString() })
        .eq('user_id', sub.user_id)
    }
  }

  return NextResponse.json({ processed: due?.length ?? 0, captured, failed })
}
