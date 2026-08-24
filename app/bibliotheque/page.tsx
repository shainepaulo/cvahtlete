import type { Metadata } from 'next'
import Link from 'next/link'
import { listPublicCvs } from '@/app/actions/cv'

export const metadata: Metadata = {
  title: 'La bibliothèque — ATHLETE CV',
  description: 'Un seul moteur, tous les sports. Tous les CV publics ATHLETE CV au même endroit.',
}

/**
 * Vitrines maison : vrais profils publics hors du modèle CV Supabase.
 */
const SHOWCASES = [
  { href: '/cv/noa', name: 'Noa Muller', sport: '⚽ Football · Gardien · France U20', tagline: 'Deux Coupes du Monde FIFA (U17 & U20) disputées.' },
]

export default async function BibliothequePage() {
  const cvs = await listPublicCvs()

  return (
    <>
      <section className="section" style={{ paddingTop: 'calc(var(--nav-h) + 90px)', paddingBottom: '60px' }}>
        <div className="container">
          <span className="tag reveal">Multi-sports</span>
          <h2 className="title reveal" data-delay="1">
            Tous les sports.<br />Un seul moteur.
          </h2>
          <p className="lead-2 reveal" data-delay="2" style={{ maxWidth: '720px' }}>
            Football, basketball, volley, tennis, athlétisme : la terminologie, les couleurs et les statistiques s&apos;adaptent 
            spécifiquement à ton sport et à ton univers. Un template d&apos;élite conçu pour te valoriser directement auprès des recruteurs.
          </p>

          <ul className="feature-list reveal" data-delay="3" style={{ marginTop: 34, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', listStyle: 'none', padding: 0 }}>
            <li style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <span className="fi" style={{ fontSize: '1.5rem', lineHeight: 1 }}>🏅</span>
              <span>
                <strong>Toutes les disciplines</strong>
                <span className="d" style={{ display: 'block', color: 'var(--muted)', fontSize: '0.85rem', marginTop: '4px' }}>Chaque sport a sa place. Les statistiques et le vocabulaire s&apos;adaptent à tes besoins.</span>
              </span>
            </li>
            <li style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <span className="fi" style={{ fontSize: '1.5rem', lineHeight: 1 }}>📊</span>
              <span>
                <strong>Tes stats clés</strong>
                <span className="d" style={{ display: 'block', color: 'var(--muted)', fontSize: '0.85rem', marginTop: '4px' }}>Buts, paniers, aces, records, médailles... tous tes indicateurs de performance réunis au bon endroit.</span>
              </span>
            </li>
            <li style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <span className="fi" style={{ fontSize: '1.5rem', lineHeight: 1 }}>✨</span>
              <span>
                <strong>Contrôle de ton image</strong>
                <span className="d" style={{ display: 'block', color: 'var(--muted)', fontSize: '0.85rem', marginTop: '4px' }}>Un design haut de gamme et immersif pour te vendre toi-même sans intermédiaire.</span>
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="section" style={{ padding: '0 0 100px' }}>
        <div className="container">
          <span className="tag reveal">La bibliothèque</span>
          <h3 className="title reveal" data-delay="1" style={{ fontSize: '1.8rem', marginBottom: '20px' }}>
            Découvrir nos athlètes
          </h3>
          <p className="lead-2 reveal" data-delay="2" style={{ marginBottom: '40px' }}>
            Explore les CV des athlètes qui ont choisi de rendre leur profil public. 
            Les profils en mode &laquo; Privé &raquo; n&apos;apparaissent pas ici et ne sont accessibles que par leur lien direct.
          </p>

          <div className="grid cols-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {SHOWCASES.map((s) => (
              <Link key={s.href} href={s.href} className="card reveal lib-card" style={{ textDecoration: 'none', display: 'block', padding: '24px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <span className="tag" style={{ marginBottom: 12, background: 'rgba(255,255,255,0.08)' }}>Vitrine</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '6px 0' }}>{s.name}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{s.sport} · {s.tagline}</p>
              </Link>
            ))}
            {cvs.map((cv) => (
              <Link key={cv.slug} href={`/${cv.slug}`} className="card reveal lib-card" style={{ textDecoration: 'none', display: 'block', padding: '24px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <span className="lib-card-emoji" style={{ fontSize: '1.5rem', marginBottom: 12, display: 'block' }}>{cv.emoji || '🏅'}</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '6px 0' }}>{cv.first} {cv.last}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                  {cv.emoji} {cv.sport}
                  {cv.discipline && ` · ${cv.discipline}`}
                  {cv.location && ` · ${cv.location}`}
                  {cv.tagline && ` · ${cv.tagline}`}
                </p>
              </Link>
            ))}
          </div>

          {cvs.length === 0 && (
            <p className="reveal" style={{ color: 'var(--muted-2)', marginTop: 34 }}>
              Aucun autre CV d&apos;utilisateur public pour l&apos;instant — les premiers arrivent bientôt.
            </p>
          )}
        </div>
      </section>
    </>
  )
}
