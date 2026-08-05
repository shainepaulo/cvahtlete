import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Merci — ATHLETE CV',
  description: 'Ton offre Pass Saison Pro est active.',
}

/**
 * /checkout/merci — retour de la page de paiement hébergée Stripe.
 */
export default function CheckoutMerciPage() {
  return (
    <div className="app-wrap">
      <div className="app-card" style={{ textAlign: 'center' }}>
        <div className="app-head">
          <span className="tag">C&apos;est parti 🎉</span>
          <h1>Paiement confirmé !</h1>
          <p style={{ marginTop: '12px', lineHeight: '1.6' }}>
            Ton Pass Saison Pro est validé — tu recevras un e-mail de confirmation sous peu. 
            Tes fonctionnalités Pro sont désormais actives pour toute la saison.
          </p>
        </div>
        <Link href="/builder?welcome=1" className="btn btn-primary btn-block btn-lg" style={{ marginTop: '10px' }}>
          Construire mon CV →
        </Link>
        <p className="app-alt" style={{ marginTop: 18 }}>
          <Link href="/dashboard">Aller à mon dashboard</Link>
        </p>
      </div>
    </div>
  )
}
