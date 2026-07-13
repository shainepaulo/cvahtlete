import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getStripe, PAID_PLANS, isPaidPlanId } from '@/utils/stripe'
import { siteOriginFromConfig } from '@/utils/site-origin'

export const runtime = 'nodejs'

/**
 * POST /api/checkout — crée une Stripe Checkout Session (PAIEMENT UNIQUE).
 *
 * Sécurité :
 *  · Session Supabase obligatoire (cookies httpOnly) — le middleware bloque
 *    déjà /checkout, cette route re-vérifie côté serveur.
 *  · Le client n'envoie qu'un identifiant de plan : les montants viennent du
 *    catalogue serveur (PAID_PLANS). Aucune donnée carte ne touche ce serveur —
 *    la saisie se fait sur la page hébergée Stripe.
 *  · Pro : capture_method 'manual' => la carte est autorisée, 0 € débité à J0 ;
 *    la capture du paiement unique a lieu à J+3 (cron) sauf annulation.
 *    Les entitlements ne sont JAMAIS accordés ici : uniquement par le webhook signé.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Connecte-toi pour finaliser ton achat.' }, { status: 401 })
  }

  let planId: unknown
  try {
    const body = await request.json()
    planId = body?.plan
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }
  if (!isPaidPlanId(planId)) {
    return NextResponse.json({ error: 'Offre inconnue.' }, { status: 400 })
  }
  const plan = PAID_PLANS[planId]

  const admin = createAdminClient()

  // Un seul paiement actif par compte : on refuse si le plan est déjà payé/en essai.
  const { data: sub } = await admin
    .from('subscriptions')
    .select('status, plan, stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (sub && (sub.status === 'active' || sub.status === 'trialing') && sub.plan !== 'free') {
    return NextResponse.json(
      { error: 'Tu as déjà une offre active sur ce compte.' },
      { status: 409 },
    )
  }

  const stripe = getStripe()

  // Customer Stripe réutilisé entre tentatives (idempotence côté client Stripe).
  let customerId = sub?.stripe_customer_id ?? null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await admin
      .from('subscriptions')
      .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
  }

  const origin = siteOriginFromConfig()
  const isTrial = plan.trialDays > 0

  const session = await stripe.checkout.sessions.create({
    mode: 'payment', // PAIEMENT UNIQUE — jamais mode 'subscription'
    customer: customerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: plan.amountCents,
          product_data: {
            name: plan.label,
            description: isTrial
              ? `0 € aujourd'hui — carte autorisée, paiement unique de ${(plan.amountCents / 100).toFixed(0)} € capturé dans ${plan.trialDays} jours sauf annulation. Aucun abonnement.`
              : 'Paiement unique — aucun abonnement.',
          },
        },
      },
    ],
    payment_intent_data: {
      // Pro : autorisation seule à J0, capture différée à J+3 par le cron.
      capture_method: isTrial ? 'manual' : 'automatic',
      metadata: { supabase_user_id: user.id, plan: plan.id },
    },
    metadata: { supabase_user_id: user.id, plan: plan.id },
    success_url: `${origin}/checkout/merci?plan=${plan.id}`,
    cancel_url: `${origin}/checkout?pack=${plan.id}`,
    locale: 'fr',
  })

  if (!session.url) {
    return NextResponse.json({ error: 'Création du paiement impossible. Réessaie.' }, { status: 502 })
  }
  return NextResponse.json({ url: session.url })
}
