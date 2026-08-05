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
  id: 'season'
  label: string
  /** Montant en centimes d'euro — source de vérité SERVEUR, jamais le client. */
  amountCents: number
}

/** Catalogue serveur : le client n'envoie qu'un identifiant, jamais un montant. */
export const PAID_PLANS: Record<PaidPlan['id'], PaidPlan> = {
  season: { id: 'season', label: 'Pass Saison Pro', amountCents: 4900 },
}

export function isPaidPlanId(v: unknown): v is PaidPlan['id'] {
  return v === 'season'
}

export function isLaunchOfferActive(): boolean {
  const endDateStr = process.env.NEXT_PUBLIC_LAUNCH_OFFER_END
  if (!endDateStr) return false

  let end: Date
  if (endDateStr.includes('/')) {
    const [day, month, year] = endDateStr.split('/')
    end = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999)
  } else {
    end = new Date(endDateStr)
  }

  return new Date() <= end
}

