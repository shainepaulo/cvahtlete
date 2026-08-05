import Link from 'next/link'
import type { Metadata } from 'next'
import { isLaunchOfferActive } from '@/utils/stripe'

export const metadata: Metadata = {
  title: 'Tarifs — ATHLETE CV',
  description: 'Un seul paiement par saison. Pas de prélèvement mensuel. Crée ton CV d\'athlète.',
}

function getFormattedEndDate(): string {
  const dateStr = process.env.NEXT_PUBLIC_LAUNCH_OFFER_END
  if (!dateStr) return ''
  
  let date: Date
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/')
    date = new Date(Number(year), Number(month) - 1, Number(day))
  } else {
    date = new Date(dateStr)
  }
  
  if (isNaN(date.getTime())) return ''
  
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export default function TarifsPage() {
  const isPromo = isLaunchOfferActive()
  const promoEndDate = getFormattedEndDate()
  
  const proPrice = isPromo ? 29 : 49
  const proPriceOld = isPromo ? 49 : null

  return (
    <section className="section center" style={{ paddingTop: 'calc(var(--nav-h) + 90px)', paddingBottom: '90px' }}>
      <div className="container">
        <span className="tag reveal">Tarifs</span>
        <h2 className="title reveal" data-delay="1" style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
          Un seul paiement par saison.<br />Pas de prélèvement mensuel.
        </h2>
        <p className="lead-2 reveal" data-delay="2" style={{ marginBottom: '50px' }}>
          Ton CV de sportif, à toi pour toute la saison. Choisis l&apos;offre qui te ressemble.
        </p>

        <div className="grid cols-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', margin: '0 auto 40px', maxWidth: '1100px', textAlign: 'left' }}>
          {/* Carte 1 — Starter */}
          <div className="price-card reveal" data-delay="1" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="plan" style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>Starter</div>
            <div className="badge-wrapper" style={{ minHeight: '24px', marginBottom: '14px' }}>
              <span className="offer-tag" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.72rem', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>GRATUIT</span>
            </div>
            <div className="amount" style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: '24px' }}>0 €</div>
            <ul className="feat" style={{ listStyle: 'none', padding: 0, margin: '0 0 30px', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={{ display: 'flex', gap: '8px', color: 'var(--muted)', fontSize: '0.92rem' }}>
                <span style={{ color: 'var(--gold)' }}>✓</span> Ton CV en ligne, un lien à partager
              </li>
              <li style={{ display: 'flex', gap: '8px', color: 'var(--muted)', fontSize: '0.92rem' }}>
                <span style={{ color: 'var(--gold)' }}>✓</span> Photos illimitées
              </li>
              <li style={{ display: 'flex', gap: '8px', color: 'var(--muted)', fontSize: '0.92rem' }}>
                <span style={{ color: 'var(--gold)' }}>✓</span> Thème CVathlete par défaut
              </li>
              <li style={{ display: 'flex', gap: '8px', color: 'var(--muted)', fontSize: '0.92rem' }}>
                <span style={{ color: 'var(--gold)' }}>✓</span> Modifications illimitées, en autonomie
              </li>
              <li style={{ display: 'flex', gap: '8px', color: 'var(--muted)', fontSize: '0.92rem' }}>
                <span style={{ color: 'var(--gold)' }}>✓</span> Watermark « Créé avec CVathlete »
              </li>
            </ul>
            <Link href="/builder" className="btn btn-ghost" style={{ width: '100%', textAlign: 'center' }}>Créer mon CV</Link>
          </div>

          {/* Carte 2 — Pro Athlète */}
          <div className="price-card featured reveal" data-delay="2" style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '2px solid var(--accent, #8bb6ff)', position: 'relative' }}>
            <span className="price-badge" style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent, #8bb6ff)', color: '#002451', padding: '4px 14px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              POPULAIRE
            </span>
            <div className="plan" style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px', marginTop: '10px' }}>Pro Athlète</div>
            <div className="badge-wrapper" style={{ minHeight: '24px', marginBottom: '14px' }}>
              {isPromo && promoEndDate && (
                <span className="offer-tag" style={{ background: 'rgba(139, 182, 255, 0.15)', color: 'var(--accent, #8bb6ff)', fontSize: '0.72rem', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  Offre de lancement jusqu&apos;au {promoEndDate}
                </span>
              )}
            </div>
            <div className="amount-wrapper" style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '24px' }}>
              <span className="amount" style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>{proPrice} €</span>
              {proPriceOld && (
                <span className="old-price" style={{ textDecoration: 'line-through', color: 'var(--muted-2)', fontSize: '1.3rem' }}>{proPriceOld} €</span>
              )}
              <span style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>/ saison</span>
            </div>
            <ul className="feat" style={{ listStyle: 'none', padding: 0, margin: '0 0 30px', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={{ display: 'flex', gap: '8px', color: 'var(--text)', fontSize: '0.92rem', fontWeight: 600 }}>
                <span style={{ color: 'var(--accent)' }}>✓</span> Tout ce qui est dans Starter, plus :
              </li>
              <li style={{ display: 'flex', gap: '8px', color: 'var(--muted)', fontSize: '0.92rem' }}>
                <span style={{ color: 'var(--accent)' }}>✓</span> Vidéos highlights (jusqu&apos;à 20, 60 s / 100 Mo max)
              </li>
              <li style={{ display: 'flex', gap: '8px', color: 'var(--muted)', fontSize: '0.92rem' }}>
                <span style={{ color: 'var(--accent)' }}>✓</span> Personnalisation complète : couleurs, bannière, mise en page, police
              </li>
              <li style={{ display: 'flex', gap: '8px', color: 'var(--muted)', fontSize: '0.92rem' }}>
                <span style={{ color: 'var(--accent)' }}>✓</span> QR code téléchargeable
              </li>
              <li style={{ display: 'flex', gap: '8px', color: 'var(--muted)', fontSize: '0.92rem' }}>
                <span style={{ color: 'var(--accent)' }}>✓</span> Sans watermark
              </li>
              <li style={{ display: 'flex', gap: '8px', color: 'var(--muted)', fontSize: '0.92rem' }}>
                <span style={{ color: 'var(--accent)' }}>✓</span> Valable toute la saison (jusqu&apos;au 30 juin)
              </li>
            </ul>
            <Link href="/checkout?pack=season" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>Passer Pro</Link>
          </div>

          {/* Carte 3 — Sur-mesure */}
          <div className="price-card reveal" data-delay="3" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="plan" style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>Sur-mesure</div>
            <div className="badge-wrapper" style={{ minHeight: '24px', marginBottom: '14px' }}>
              <span className="offer-tag" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.72rem', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>SUR DEVIS</span>
            </div>
            <div className="amount" style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: '24px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--muted)', verticalAlign: 'middle', marginRight: '4px' }}>à partir de</span>
              249 €
            </div>
            <ul className="feat" style={{ listStyle: 'none', padding: 0, margin: '0 0 30px', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={{ display: 'flex', gap: '8px', color: 'var(--text)', fontSize: '0.92rem', fontWeight: 600 }}>
                <span style={{ color: 'var(--gold)' }}>✓</span> Tout Pro Athlète (Pass Saison inclus), plus :
              </li>
              <li style={{ display: 'flex', gap: '8px', color: 'var(--muted)', fontSize: '0.92rem' }}>
                <span style={{ color: 'var(--gold)' }}>✓</span> Shooting photo sur 1 match par un photographe professionnel du réseau
              </li>
              <li style={{ display: 'flex', gap: '8px', color: 'var(--muted)', fontSize: '0.92rem' }}>
                <span style={{ color: 'var(--gold)' }}>✓</span> CV monté sur mesure avec direction artistique dédiée
              </li>
              <li style={{ display: 'flex', gap: '8px', color: 'var(--muted)', fontSize: '0.92rem' }}>
                <span style={{ color: 'var(--gold)' }}>✓</span> Accompagnement personnalisé pendant la saison
              </li>
              <li style={{ display: 'flex', gap: '8px', color: 'var(--muted-2)', fontSize: '0.85rem', fontStyle: 'italic', marginTop: '4px' }}>
                Options sur devis : match supplémentaire, montage vidéo highlights
              </li>
            </ul>
            <Link href="/offre-sur-mesure" className="btn btn-ghost" style={{ width: '100%', textAlign: 'center' }}>
              Construire mon offre →
            </Link>
          </div>
        </div>

        <p className="price-note reveal" style={{ fontSize: '0.9rem', color: 'var(--muted-2)', marginTop: '20px' }}>
          Le Pass Saison est valable jusqu&apos;au 30 juin. Ton CV reste en ligne ensuite, quoi qu&apos;il arrive.
        </p>
      </div>
    </section>
  )
}
