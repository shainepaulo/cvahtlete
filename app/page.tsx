import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ATHLETE CV — Ton CV d\'athlète, en un lien',
}

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <header className="hero">
        {/* Une seule image statique : le crossfade de 3 calques plein écran
            en mix-blend-mode coûtait une recomposition GPU permanente */}
        <div className="hero-montage" aria-hidden="true">
          <img src="/images/nadal1.jpg" alt="" />
        </div>
        <div className="hero-glyphs" aria-hidden="true">
          <span style={{ left: '8%', top: '24%', animationDuration: '13s' }}>⚽</span>
          <span style={{ left: '84%', top: '18%', animationDuration: '15s', animationDelay: '1s' }}>🎾</span>
          <span style={{ left: '16%', top: '70%', animationDuration: '14s', animationDelay: '.6s' }}>🏀</span>
          <span style={{ left: '78%', top: '66%', animationDuration: '16s', animationDelay: '1.4s' }}>⚡</span>
          <span style={{ left: '90%', top: '44%', animationDuration: '15.5s', animationDelay: '.9s' }}>🏆</span>
        </div>
        <div className="container">
          <div className="eyebrow reveal">
            <span className="dot" />
            Le CV des athlètes
          </div>
          <h1 className="display reveal" data-delay="1">
            Ton CV d&apos;athlète,<br />
            <span className="grad">en un lien.</span>
          </h1>
          <p className="lead reveal" data-delay="2">
            Rassemble ton parcours, tes stats et tes moments forts sur une page unique. À mettre en
            bio, à envoyer aux clubs et aux sponsors.
          </p>
          <div className="hero-actions reveal" data-delay="3">
            <Link href="/exemples" className="btn btn-primary btn-lg">Voir des exemples</Link>
            <Link href="/tarifs" className="btn btn-ghost btn-lg">Créer le mien</Link>
          </div>
        </div>
        <div className="scroll-cue">
          Découvrir
          <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </header>

      {/* UNE PAGE, TOUT TOI */}
      <section className="section tall center">
        <div className="container">
          <span className="tag reveal">Une page. Tout toi.</span>
          <h2 className="title reveal" data-delay="1">
            Tout ton univers sportif,<br />réuni au même endroit.
          </h2>
          <p className="lead-2 reveal" data-delay="2">
            Stats, palmarès, vidéos, parcours, contact. Fini les PDF dépassés et les DM brouillons.
            Un CV vivant que tu partages d&apos;un seul lien.
          </p>
        </div>
      </section>

      {/* POUR QUI */}
      <section className="section center">
        <div className="container">
          <span className="tag reveal">Fait pour être partagé</span>
          <h2 className="title reveal" data-delay="1">Là où ça compte.</h2>
          <div className="grid cols-3">
            <div className="card reveal" data-delay="1">
              <div className="ic">🔗</div>
              <h3>En bio Instagram</h3>
              <p>Un lien propre dans ta bio. Les recruteurs et fans accèdent à tout ton profil en un tap.</p>
            </div>
            <div className="card reveal" data-delay="2">
              <div className="ic">🤝</div>
              <h3>Aux sponsors</h3>
              <p>Une vitrine qui inspire confiance. Présente ta valeur avant même le premier rendez-vous.</p>
            </div>
            <div className="card reveal" data-delay="3">
              <div className="ic">🏟️</div>
              <h3>Aux clubs &amp; agents</h3>
              <p>Toutes tes infos essentielles, à jour, prêtes à convaincre. Sans dossier interminable.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section center">
        <div className="container reveal">
          <h2 className="title">Prêt à te mettre<br />en valeur&nbsp;?</h2>
          <p className="lead-2">Regarde ce que ça donne pour de vrais profils, puis crée le tien.</p>
          <div className="hero-actions" style={{ marginTop: 36 }}>
            <Link href="/exemples" className="btn btn-primary btn-lg">Voir les exemples</Link>
            <Link href="/tarifs" className="btn btn-ghost btn-lg">Les offres</Link>
          </div>
        </div>
      </section>
    </>
  )
}
