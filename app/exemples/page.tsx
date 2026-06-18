import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Exemples de répertoires — ATHLETE CV',
  description: 'Découvre des répertoires d\'athlètes : football, tennis, athlétisme.',
}

export default function ExemplesPage() {
  return (
    <>
      <section className="section center" style={{ paddingTop: 'calc(var(--nav-h) + 90px)' }}>
        <div className="container">
          <span className="tag reveal">Exemples · Multi-sports</span>
          <h2 className="title reveal" data-delay="1">
            Un seul moteur,<br />tous les sports.
          </h2>
          <p className="lead-2 reveal" data-delay="2">
            Football, tennis, athlétisme… chaque répertoire s&apos;adapte à la discipline, ses
            stats et son univers. Clique pour explorer.
          </p>

          <div className="gallery">
            <Link className="athlete-card reveal" data-delay="1" href="/profil?a=dembele">
              <div className="ac-cover" style={{ background: 'linear-gradient(120deg,#c6f932,#5cf0c0)' }}>
                <img src="/images/4.avif" alt="" />
                <span className="emoji">⚽</span>
              </div>
              <div className="ac-avatar">
                <img src="/images/3.webp" alt="Ousmane Dembélé" />
              </div>
              <div className="ac-body">
                <div className="ac-name">Ousmane Dembélé</div>
                <div className="ac-sport">⚽ Football · Ailier</div>
                <div className="ac-stats">
                  <div className="ac-stat"><div className="v count">57</div><div className="l">Sélections</div></div>
                  <div className="ac-stat"><div className="v count">100M€</div><div className="l">Valeur</div></div>
                </div>
                <span className="ac-link">Voir le profil →</span>
              </div>
            </Link>

            <Link className="athlete-card reveal" data-delay="2" href="/profil?a=nadal">
              <div className="ac-cover" style={{ background: 'linear-gradient(120deg,#ff9f45,#ffd23f)' }}>
                <img src="/images/nadal-m1.jpg" alt="" />
                <span className="emoji">🎾</span>
              </div>
              <div className="ac-avatar">
                <img src="/images/nadal2.jpg" alt="Rafael Nadal" />
              </div>
              <div className="ac-body">
                <div className="ac-name">Rafael Nadal</div>
                <div className="ac-sport">🎾 Tennis · Simple</div>
                <div className="ac-stats">
                  <div className="ac-stat"><div className="v count">22</div><div className="l">Grand Chelem</div></div>
                  <div className="ac-stat"><div className="v count">14×</div><div className="l">Roland-Garros</div></div>
                </div>
                <span className="ac-link">Voir le profil →</span>
              </div>
            </Link>

            <Link className="athlete-card reveal" data-delay="3" href="/profil?a=bolt">
              <div className="ac-cover" style={{ background: 'linear-gradient(120deg,#ffd23f,#34d399)' }}>
                <img src="/images/bolt-race.jpg" alt="" />
                <span className="emoji">⚡</span>
              </div>
              <div className="ac-avatar">
                <img src="/images/bolt1.jpg" alt="Usain Bolt" />
              </div>
              <div className="ac-body">
                <div className="ac-name">Usain Bolt</div>
                <div className="ac-sport">⚡ Athlétisme · Sprint</div>
                <div className="ac-stats">
                  <div className="ac-stat"><div className="v count">9.58</div><div className="l">100m (s)</div></div>
                  <div className="ac-stat"><div className="v count">8×</div><div className="l">Or olymp.</div></div>
                </div>
                <span className="ac-link">Voir le profil →</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="section center">
        <div className="container reveal">
          <span className="tag">Version premium</span>
          <h2 className="title">Envie de spectaculaire&nbsp;?</h2>
          <p className="lead-2">
            La version cinématique interactive — image plein écran, curseur sur-mesure et révélation
            au survol. Une expérience par athlète.
          </p>
          <div className="hero-actions" style={{ marginTop: 34 }}>
            <a href="/cine?u=dembele" className="btn btn-primary">Dembélé ⚽</a>
            <a href="/cine?u=nadal" className="btn btn-ghost">Nadal 🎾</a>
            <a href="/cine?u=bolt" className="btn btn-ghost">Bolt ⚡</a>
          </div>
        </div>
      </section>
    </>
  )
}
