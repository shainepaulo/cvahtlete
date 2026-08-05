import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LE CV — ATHLETE CV',
  description: 'Découvre des profils d\'athlètes sur ATHLETE CV en conditions réelles.',
}

export default function ExemplesPage() {
  return (
    <>
      <section className="section center" style={{ paddingTop: 'calc(var(--nav-h) + 90px)', paddingBottom: '90px' }}>
        <div className="container">
          <span className="tag reveal">LE CV · En conditions réelles</span>
          <h2 className="title reveal" data-delay="1">
            Un profil,<br />toute une carrière.
          </h2>
          <p className="lead-2 reveal" data-delay="2" style={{ marginBottom: '50px' }}>
            Voilà exactement ce qui s&apos;ouvre quand un club, un agent ou un sponsor clique
            sur ton lien. Pas une promesse : le rendu réel. Explore, clique, juge par toi-même —
            puis imagine ton nom à la place.
          </p>

          <div className="grid cols-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '35px', margin: '0 auto', maxWidth: '900px', textAlign: 'left' }}>
            {/* Card 1: Ousmane Dembélé */}
            <div className="showcase reveal" data-delay="2" style={{ width: '100%', margin: 0 }}>
              <a className="cine-ribbon" href="/cine?u=dembele">
                <span className="cine-ribbon-dot" />
                🎬 Mode cinématique
              </a>
              <Link className="showcase-link-wrap" href="/profil?a=dembele">
                <div className="showcase-media" style={{ position: 'relative' }}>
                  <Image src="/images/4.avif" alt="Profil d'Ousmane Dembélé sur ATHLETE CV" fill style={{ objectFit: 'cover' }} />
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

            {/* Card 2: Noa Muller */}
            <div className="showcase reveal" data-delay="3" style={{ width: '100%', margin: 0 }}>
              <a className="cine-ribbon" href="/cv/noa">
                <span className="cine-ribbon-dot" />
                🎬 Mode cinématique
              </a>
              <Link className="showcase-link-wrap" href="/cv/noa">
                <div className="showcase-media" style={{ position: 'relative' }}>
                  <Image src="/images/noa3.jpeg" alt="Profil de Noa Muller sur ATHLETE CV" fill style={{ objectFit: 'cover' }} />
                  <span className="showcase-emoji">🧤</span>
                </div>
                <div className="showcase-body">
                  <span className="showcase-badge">🇫🇷 France U20</span>
                  <div className="showcase-name">Noa Muller</div>
                  <div className="showcase-sport">⚽ Football · Gardien · Cavigal Nice</div>
                  <div className="showcase-stats">
                    <div><div className="v">49</div><div className="l">Arrêts CDM U20</div></div>
                    <div><div className="v">18</div><div className="l">ans</div></div>
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
