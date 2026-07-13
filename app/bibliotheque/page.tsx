import type { Metadata } from 'next'
import Link from 'next/link'
import { listPublicCvs } from '@/app/actions/cv'

export const metadata: Metadata = {
  title: 'Nos Athletes — ATHLETE CV',
  description: 'Tous les répertoires publics ATHLETE CV, en un seul endroit.',
}

/**
 * Vitrines maison : vrais profils publics hors du modèle CV Supabase (pas de
 * ligne `cvs`, pas de toggle admin dynamique). Le profil démo Ousmane Dembélé
 * n'apparaît pas ici — il reste accessible via l'accueil et la page exemple.
 */
const SHOWCASES = [
  { href: '/cv/noa', name: 'Noa Muller', sport: '🧤 Football', tagline: 'Gardien international · Coupes du Monde U17 & U20' },
]

/** Route publique /bibliotheque : liste les CV dont la visibilité est "public" (Tâche 4). */
export default async function BibliothequePage() {
  const cvs = await listPublicCvs()

  return (
    <section className="section" style={{ paddingTop: 'calc(var(--nav-h) + 90px)' }}>
      <div className="container">
        <span className="tag reveal">Nos Athletes</span>
        <h2 className="title reveal" data-delay="1">
          Tous les répertoires<br />publics.
        </h2>
        <p className="lead-2 reveal" data-delay="2">
          Les athlètes qui ont choisi de rendre leur répertoire public. Un CV en mode « Privé » n&apos;apparaît
          pas ici — il reste consultable uniquement via son lien direct.
        </p>

        <div className="grid cols-3" style={{ marginTop: 46 }}>
          {SHOWCASES.map((s) => (
            <Link key={s.href} href={s.href} className="card reveal lib-card">
              <span className="tag" style={{ marginBottom: 12 }}>Vitrine</span>
              <h3>{s.name}</h3>
              <p>{s.sport} · {s.tagline}</p>
            </Link>
          ))}
          {cvs.map((cv) => (
            <Link key={cv.slug} href={`/${cv.slug}`} className="card reveal lib-card">
              <span className="lib-card-emoji">{cv.emoji}</span>
              <h3>{cv.first} {cv.last}</h3>
              <p>
                {cv.sport}
                {cv.location && ` · ${cv.location}`}
              </p>
            </Link>
          ))}
        </div>

        {cvs.length === 0 && (
          <p className="reveal" style={{ color: 'var(--muted-2)', marginTop: 34 }}>
            Aucun répertoire d&apos;utilisateur public pour l&apos;instant — les premiers arrivent bientôt.
          </p>
        )}
      </div>
    </section>
  )
}
