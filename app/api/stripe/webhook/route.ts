import { NextResponse, type NextRequest } from 'next/server'
import type Stripe from 'stripe'
import { getStripe, PAID_PLANS, isPaidPlanId } from '@/utils/stripe'
import { createAdminClient } from '@/utils/supabase/admin'
import { sendEmail, paymentConfirmationHtml } from '@/utils/email'
import { siteOriginFromConfig } from '@/utils/site-origin'

export const runtime = 'nodejs'

/**
 * POST /api/stripe/webhook — SEULE source de vérité des entitlements payants.
 *
 * Sécurité :
 *  · Signature vérifiée via stripe.webhooks.constructEvent (STRIPE_WEBHOOK_SECRET) :
 *    toute requête forgée côté client est rejetée en 400 avant tout traitement.
 *  · Écritures en base via service_role uniquement (RLS intouchée côté client :
 *    le trigger guard_profile_privileges bloque toute auto-promotion de plan).
 *  · Le client ne peut RIEN débloquer lui-même : ni /api/checkout ni le front
 *    n'écrivent les plans — uniquement ce webhook et le cron de capture.
 *
 * Cycle de vie (PAIEMENT UNIQUE, jamais récurrent) :
 *  · checkout.session.completed
 *      – starter : payé immédiatement => plan actif + e-mail « Done ».
 *      – pro     : carte autorisée   => statut 'trialing', capture à J+3.
 *  · payment_intent.succeeded (capture différée du Pro) => plan actif + e-mail.
 *  · payment_intent.canceled  (annulation avant J+3)    => retour à 'free',
 *      CV rendu instantanément indisponible (visibility = private).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET manquant.')
    return NextResponse.json({ error: 'Webhook non configuré.' }, { status: 500 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante.' }, { status: 400 })
  }

  // constructEvent exige le corps BRUT (pas de JSON.parse préalable).
  const payload = await request.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret)
  } catch {
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 })
  }

  const admin = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.metadata?.supabase_user_id
      const planId = session.metadata?.plan
      if (!userId || !isPaidPlanId(planId)) break
      const plan = PAID_PLANS[planId]
      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id ?? null

      const { data: sub } = await admin
        .from('subscriptions')
        .select('status')
        .eq('user_id', userId)
        .maybeSingle()

      if (sub?.status !== 'active') {
        await activatePaidPlan(admin, userId, plan.id, paymentIntentId)
        await sendDoneEmail(admin, userId, plan.id, plan.amountCents)
      }
      break
    }

    case 'payment_intent.succeeded': {
      const intent = event.data.object
      const userId = intent.metadata?.supabase_user_id
      const planId = intent.metadata?.plan
      if (!userId || !isPaidPlanId(planId)) break
      const { data: sub } = await admin
        .from('subscriptions')
        .select('status')
        .eq('user_id', userId)
        .maybeSingle()
      
      if (sub?.status !== 'active') {
        await activatePaidPlan(admin, userId, planId, intent.id)
        await sendDoneEmail(admin, userId, planId, PAID_PLANS[planId].amountCents)
      }
      break
    }

    case 'payment_intent.canceled': {
      // Annulation avant J+3 : aucun débit, avantages coupés, CV hors ligne.
      const intent = event.data.object
      const userId = intent.metadata?.supabase_user_id
      if (!userId) break
      await revokeTrial(admin, userId)
      break
    }

    default:
      // Événements non gérés : acquittés pour éviter les retries Stripe.
      break
  }

  return NextResponse.json({ received: true })
}

type AdminClient = ReturnType<typeof createAdminClient>

async function activatePaidPlan(
  admin: AdminClient,
  userId: string,
  planId: 'starter' | 'pro',
  paymentIntentId: string | null,
) {
  const now = new Date().toISOString()
  await admin
    .from('subscriptions')
    .update({
      status: 'active',
      plan: planId,
      stripe_payment_intent_id: paymentIntentId,
      trial_ends_at: null,
      updated_at: now,
    })
    .eq('user_id', userId)
  await admin.from('profiles').update({ plan: planId }).eq('id', userId)
}

/** Retire les avantages et rend le CV instantanément indisponible en ligne. */
async function revokeTrial(admin: AdminClient, userId: string) {
  const now = new Date().toISOString()
  await admin
    .from('subscriptions')
    .update({
      status: 'canceled',
      plan: 'free',
      trial_ends_at: null,
      updated_at: now,
    })
    .eq('user_id', userId)
  await admin.from('profiles').update({ plan: 'free' }).eq('id', userId)
  await admin.from('cvs').update({ visibility: 'private' }).eq('user_id', userId)
}

async function sendDoneEmail(
  admin: AdminClient,
  userId: string,
  planId: 'starter' | 'pro',
  amountCents: number,
) {
  const { data: profile } = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .maybeSingle()
  if (!profile?.email) return
  await sendEmail({
    to: [profile.email],
    subject: '✅ Paiement confirmé — ton ATHLETE CV est actif',
    html: paymentConfirmationHtml({
      fullName: profile.full_name ?? '',
      planLabel: PAID_PLANS[planId].label,
      amountCents,
      cvUrl: `${siteOriginFromConfig()}/dashboard`,
    }),
  })
}
