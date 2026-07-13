'use client'

/**
 * /checkout — Tunnel de paiement Stripe (PAIEMENT UNIQUE, jamais d'abonnement).
 *  · Session obligatoire : le middleware redirige les visiteurs vers /signup.
 *  · Starter (29 €) : débit immédiat sur la page hébergée Stripe.
 *  · Pro (79 €) : carte OBLIGATOIRE, 0 € débité aujourd'hui — autorisation
 *    3 jours, paiement unique capturé à J+3 sauf annulation depuis le dashboard.
 *  · Sur-mesure (149 €+) : hors Stripe → formulaire /offre-sur-mesure.
 * Les montants affichés ici sont purement informatifs : la source de vérité
 * est le catalogue serveur (utils/stripe.ts) + la page hébergée Stripe.
 */

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getMyProfile } from '@/app/actions/auth'

interface PackView {
  name: string
  price: number
  perks: string[]
  trial?: boolean
}

const PACKS: Record<string, PackView> = {
  starter: {
    name: 'Starter CV',
    price: 29,
    perks: [
      'Répertoire complet, un lien à partager',
      '3 modifications incluses',
      'Mises à jour par contact équipe (formulaire / email)',
    ],
  },
  pro: {
    name: 'Pro Athlète',
    price: 79,
    trial: true,
    perks: [
      'Tout le Starter, sans la limite',
      'Mode cinématique immersif 🎬',
      'Mises à jour illimitées pendant 1 an',
      'Support prioritaire + onboarding vidéo',
    ],
  },
}

function CheckoutContent() {
  const router = useRouter()
  const params = useSearchParams()
  const packId = params.get('pack') || 'starter'

  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  const pack = PACKS[packId]

  useEffect(() => {
    // L'offre sur-mesure ne passe pas par Stripe : tunnel dédié.
    if (packId === 'club' || packId === 'surmesure') {
      router.replace('/offre-sur-mesure')
      return
    }
    // Défense en profondeur : le middleware protège déjà /checkout.
    getMyProfile().then((p) => {
      if (!p) {
        router.replace('/signup?next=' + encodeURIComponent('/checkout?pack=' + packId))
        return
      }
      setLoading(false)
    })
  }, [packId, router])

  async function pay() {
    setPaying(true)
    setError('')
    try {
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: packId }),
      })
      const j = await r.json()
      if (!r.ok || !j.url) {
        setError(j.error || 'Paiement impossible pour le moment.')
        setPaying(false)
        return
      }
      // Redirection vers la page de paiement hébergée Stripe (carte requise).
      window.location.assign(j.url)
    } catch {
      setError('Paiement impossible pour le moment.')
      setPaying(false)
    }
  }

  if (loading) {
    return <div className="app-wrap"><div className="app-head"><h1>Chargement…</h1></div></div>
  }

  if (!pack) {
    return (
      <div className="app-wrap">
        <div className="app-card">
          <div className="app-head">
            <h1>Offre inconnue</h1>
          </div>
          <Link className="btn btn-ghost btn-block" href="/tarifs">← Retour aux offres</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="app-wrap">
      <div className="app-card">
        <div className="app-head" style={{ textAlign: 'left' }}>
          <span className="tag">Paiement</span>
          <h1>{pack.name}</h1>
          <p>Paiement unique, sans abonnement.</p>
        </div>

        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, margin: '0 0 22px' }}>
          {pack.perks.map((p, i) => (
            <li key={i} style={{ color: 'var(--muted)', display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--gold)' }}>—</span>{p}
            </li>
          ))}
        </ul>

        {pack.trial && (
          <div className="trial-note">
            <strong>🛡️ Essai 3 jours, sans engagement.</strong>
            <span>
              Carte requise, <strong>0 € débité aujourd&apos;hui</strong>. Sans annulation de ta part,
              le paiement unique de {pack.price} € est capturé au bout de 3 jours — puis tes
              avantages restent actifs à vie. Annule avant : aucun débit, ton CV repasse hors ligne.
            </span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 22 }}>
          <span style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.12em', fontSize: '.78rem' }}>
            {pack.trial ? 'Aujourd’hui / à J+3' : 'Total'}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '2rem' }}>
            {pack.trial ? `0 € / ${pack.price} €` : `${pack.price} €`}
          </span>
        </div>

        {error && <div className="alert err" style={{ marginBottom: 14 }}>{error}</div>}

        <button className="btn btn-primary btn-block btn-lg" onClick={pay} disabled={paying}>
          {paying ? 'Redirection vers Stripe…' : pack.trial ? 'Démarrer mon essai 3 jours' : `Payer ${pack.price} €`}
        </button>

        <p className="app-alt" style={{ marginTop: 16 }}>
          🔒 Paiement sécurisé par Stripe — ta carte ne transite jamais par nos serveurs.
        </p>
        <p className="app-alt">
          <Link href="/tarifs">← Changer d&apos;offre</Link>
        </p>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return <Suspense fallback={null}><CheckoutContent /></Suspense>
}
