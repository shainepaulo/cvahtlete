'use client'

/**
 * /checkout — Tunnel de paiement Stripe (PAIEMENT UNIQUE par saison, sans abonnement).
 *  · Session obligatoire : le middleware redirige les visiteurs vers /signup.
 *  · Pass Saison Pro (29 € ou 49 €) : débit immédiat sur la page hébergée Stripe.
 */

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getMyProfile } from '@/app/actions/auth'

interface PackView {
  name: string
  price: number
  perks: string[]
}

const PACKS: Record<string, PackView> = {
  season: {
    name: 'Pass Saison Pro',
    price: 49,
    perks: [
      'Tout Starter, plus :',
      'Vidéos highlights (jusqu’à 20, 60 s / 100 Mo max)',
      'Personnalisation complète : couleurs, bannière, mise en page, police',
      'QR code téléchargeable',
      'Sans watermark',
      'Valable toute la saison (jusqu’au 30 juin)',
    ],
  },
}

function isClientLaunchOfferActive(): boolean {
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

function CheckoutContent() {
  const router = useRouter()
  const params = useSearchParams()
  const packId = params.get('pack') || 'season'

  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Redirections legacy
    if (packId === 'pro' || packId === 'starter') {
      router.replace('/checkout?pack=season')
      return
    }
    // L'offre sur-mesure ne passe pas par Stripe : tunnel dédié.
    if (packId === 'club' || packId === 'surmesure') {
      router.replace('/offre-sur-mesure')
      return
    }
    
    getMyProfile().then((p) => {
      if (!p) {
        router.replace('/signup?next=' + encodeURIComponent('/checkout?pack=' + packId))
        return
      }
      setLoading(false)
    })
  }, [packId, router])

  const isPromo = isClientLaunchOfferActive()
  const pack = PACKS[packId]
  const currentPrice = packId === 'season' && isPromo ? 29 : (pack?.price ?? 49)
  const originalPrice = packId === 'season' && isPromo ? 49 : null

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
          <p>Un seul paiement par saison, aucun abonnement mensuel.</p>
        </div>

        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, margin: '0 0 22px' }}>
          {pack.perks.map((p, i) => (
            <li key={i} style={{ color: 'var(--muted)', display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--gold)' }}>—</span>{p}
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 22 }}>
          <span style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.12em', fontSize: '.78rem' }}>
            Total pour la saison
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            {originalPrice && (
              <span style={{ textDecoration: 'line-through', color: 'var(--muted-2)', fontSize: '1.1rem' }}>
                {originalPrice} €
              </span>
            )}
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '2rem' }}>
              {currentPrice} €
            </span>
          </div>
        </div>

        {error && <div className="alert err" style={{ marginBottom: 14 }}>{error}</div>}

        <button className="btn btn-primary btn-block btn-lg" onClick={pay} disabled={paying}>
          {paying ? 'Redirection vers Stripe…' : `Payer ${currentPrice} €`}
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
