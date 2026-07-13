import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Merci — ATHLETE CV',
  description: 'Ton offre ATHLETE CV est en route.',
}

/**
 * /checkout/merci — retour de la page de paiement hébergée Stripe.
 * Page purement informative : les entitlements sont accordés par le webhook
 * signé, jamais par cette page (aucune confiance dans les paramètres d'URL).
 */
export default function CheckoutMerciPage({
  searchParams,
}: {
  searchParams: { plan?: string }
}) {
  const isTrial = searchParams.plan === 'pro'
  return (
    <div className="app-wrap">
      <div className="app-card" style={{ textAlign: 'center' }}>
        <div className="app-head">
          <span className="tag">C&apos;est parti 🎉</span>
          <h1>{isTrial ? 'Ton essai Pro est lancé.' : 'Paiement confirmé.'}</h1>
          <p>
            {isTrial
              ? "Carte validée, 0 € débité aujourd'hui. Tu as 3 jours pour tout tester — sans annulation, le paiement unique de 79 € sera capturé et tes avantages resteront actifs. Tu peux annuler à tout moment depuis ton dashboard."
              : 'Ton paiement unique est validé — tu reçois un e-mail de confirmation. Ton répertoire est prêt à être construit.'}
          </p>
        </div>
        <Link href="/builder?welcome=1" className="btn btn-primary btn-block btn-lg">
          Construire mon CV →
        </Link>
        <p className="app-alt" style={{ marginTop: 14 }}>
          <Link href="/dashboard">Aller à mon dashboard</Link>
        </p>
      </div>
    </div>
  )
}
