import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getStripe, PAID_PLANS, isPaidPlanId, isLaunchOfferActive } from '@/utils/stripe'
import { siteOriginFromConfig } from '@/utils/site-origin'

export const runtime = 'nodejs'

/**
 * POST /api/checkout — crée une Stripe Checkout Session (PAIEMENT UNIQUE).
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

  // Un seul paiement actif par compte : on refuse si le plan est déjà payé pour cette saison.
  const { data: sub } = await admin
    .from('subscriptions')
    .select('status, plan, stripe_customer_id, season_expires_at')
    .eq('user_id', user.id)
    .maybeSingle()
  
  const isSeasonExpired = !!(sub?.season_expires_at && new Date(sub.season_expires_at) < new Date())
  if (sub && sub.status === 'active' && sub.plan === 'season' && !isSeasonExpired) {
    return NextResponse.json(
      { error: 'Tu as déjà une offre active sur ce compte pour cette saison.' },
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

  const hasCoupon = isLaunchOfferActive() && !!process.env.STRIPE_LAUNCH_COUPON_ID

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
            description: 'Paiement unique pour toute la saison — aucun abonnement.',
          },
        },
      },
    ],
    discounts: hasCoupon
      ? [{ coupon: process.env.STRIPE_LAUNCH_COUPON_ID! }]
      : undefined,
    payment_intent_data: {
      capture_method: 'automatic',
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

