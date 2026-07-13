import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Exemple de profil — ATHLETE CV',
  description: 'Découvre un profil d\'athlète ATHLETE CV en conditions réelles.',
}

export default function ExemplesPage() {
  return (
    <>
      <section className="section center" style={{ paddingTop: 'calc(var(--nav-h) + 90px)' }}>
        <div className="container">
          <span className="tag reveal">Exemple · En conditions réelles</span>
          <h2 className="title reveal" data-delay="1">
            Un profil,<br />toute une carrière.
          </h2>
          <p className="lead-2 reveal" data-delay="2">
            Voilà exactement ce qui s&apos;ouvre quand un club, un agent ou un sponsor clique
            sur ton lien. Pas une promesse : le rendu réel. Explore, clique, juge par toi-même —
            puis imagine ton nom à la place.
          </p>

          {/* Écrin cinématique : le spotlight met en scène la carte Dembélé,
              nichée À L'INTÉRIEUR du cadre lumineux (.cine-spotlight--stacked) —
              plus de marges négatives fragiles, superposition maîtrisée. */}
          <div className="cine-spotlight cine-spotlight--stacked reveal" data-delay="2">
            <span className="cine-spotlight-badge">🎬 Expérience signature</span>
            <h2 className="title">Envie de spectaculaire&nbsp;?</h2>
            <p className="lead-2">
              Le mode cinématique, c&apos;est la première impression qu&apos;on n&apos;oublie pas :
              photo plein écran, nom en lumière, stats à un clic. Le recruteur s&apos;en souvient —
              et c&apos;est exactement le but.
            </p>
            <div className="hero-actions" style={{ marginTop: 30 }}>
              <a href="/cine?u=dembele" className="btn btn-primary cine-cta-btn">
                <span className="cine-cta-dot" />
                Voir le mode cinématique ⚽
              </a>
            </div>

            <div className="showcase reveal" data-delay="3">
              {/* Sibling of the profile link, not nested inside it — keeps the anchor tags valid */}
              <a className="cine-ribbon" href="/cine?u=dembele">
                <span className="cine-ribbon-dot" />
                🎬 Mode cinématique
              </a>
              <Link className="showcase-link-wrap" href="/profil?a=dembele">
                <div className="showcase-media">
                  <img src="/images/4.avif" alt="Profil d'Ousmane Dembélé sur ATHLETE CV" loading="lazy" />
                  <span className="showcase-emoji">⚽</span>
                </div>
                <div className="showcase-body">
                  <span className="showcase-badge">🏅 Ballon d&apos;Or 2025</span>
                  <div className="showcase-name">Ousmane Dembélé</div>
                  <div className="showcase-sport">⚽ Football · Ailier · Paris SG</div>
                  <div className="showcase-stats">
                    <div><div className="v count" data-to="57">57</div><div className="l">Sélections 🇫🇷</div></div>
                    <div><div className="v">100M€</div><div className="l">Valeur</div></div>
                  </div>
                  <span className="showcase-link">Explorer le profil →</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
