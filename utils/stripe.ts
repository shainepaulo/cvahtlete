import 'server-only'
import Stripe from 'stripe'

/**
 * Client Stripe — SERVEUR UNIQUEMENT (import 'server-only' le garantit au build).
 *
 * Modèle économique : PAIEMENT UNIQUE, jamais d'abonnement récurrent.
 *  · Starter (29 €) : capture immédiate.
 *  · Pro (79 €)     : essai 3 jours — la carte est AUTORISÉE à J0
 *    (capture_method: 'manual', 0 € débité), puis le paiement unique est
 *    CAPTURÉ à J+3 par le cron /api/cron/capture-trials si l'utilisateur
 *    n'a pas annulé. Annulation avant J+3 : PaymentIntent annulé, 0 € débité.
 *  · Sur-mesure (149 €+) : hors Stripe — formulaire /offre-sur-mesure.
 */

let stripeSingleton: Stripe | null = null

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY manquant : configure les variables Stripe.')
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, {
      typescript: true,
      appInfo: { name: 'ATHLETE CV', url: 'https://cvathlete.com' },
    })
  }
  return stripeSingleton
}

export interface PaidPlan {
  /** Identifiant interne (colonne subscriptions.plan). */
  id: 'starter' | 'pro'
  label: string
  /** Montant en centimes d'euro — source de vérité SERVEUR, jamais le client. */
  amountCents: number
  /** Jours d'essai avant capture du paiement unique (0 = capture immédiate). */
  trialDays: number
}

/** Catalogue serveur : le client n'envoie qu'un identifiant, jamais un montant. */
export const PAID_PLANS: Record<PaidPlan['id'], PaidPlan> = {
  starter: { id: 'starter', label: 'Starter CV — paiement unique', amountCents: 2_900, trialDays: 0 },
  pro:     { id: 'pro',     label: 'Pro Athlète — paiement unique (essai 3 jours)', amountCents: 7_900, trialDays: 3 },
}

export function isPaidPlanId(v: unknown): v is PaidPlan['id'] {
  return v === 'starter' || v === 'pro'
}

export const TRIAL_DAYS_MS = 3 * 24 * 60 * 60 * 1000
