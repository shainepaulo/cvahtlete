import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ATHLETE CV — Ton CV d\'athlète, en un lien',
  description:
    'Le profil qui te fait signer. Stats, palmarès et moments forts réunis sur une page que tu envoies aux clubs, agents et sponsors. Un seul lien.',
}

/* Catégories repositionnées : sorties du milieu de page, remontées juste sous
   le hero comme première preuve de valeur. Données pilotées par un tableau —
   layout cohérent, copy orientée résultat. */
const AUDIENCES = [
  {
    ic: '🤝',
    t: 'Aux sponsors',
    d: 'Ta valeur, chiffrée et prouvée : audience, stats, palmarès. Le sponsor voit son retour avant même le premier rendez-vous.',
  },
  {
    ic: '🏟️',
    t: 'Aux clubs & agents',
    d: 'Un recruteur décide en 90 secondes. Donne-lui tout : stats vérifiables, vidéos, parcours — zéro PDF à télécharger.',
  },
  {
    ic: '🔗',
    t: 'En bio Instagram',
    d: 'Chaque visite de ton profil peut devenir une opportunité. Un lien propre en bio, et ton talent travaille pour toi 24h/24.',
  },
]

const STEPS = [
  { n: '01', t: 'Crée ton profil', d: 'Stats, palmarès, parcours, vidéos. Le builder te guide section par section — rien à inventer, tout à montrer.' },
  { n: '02', t: 'Personnalise', d: 'Photo, couleurs, mode cinématique. Ton univers, ta discipline, ton identité — pas un template anonyme.' },
  { n: '03', t: 'Partage le lien', d: 'Un seul lien, partout : DM, bio, e-mail d’agent. Toujours à jour, jamais périmé, jamais ignoré.' },
]

export default function HomePage() {
  return (
    <>
      {/* ============================ HERO ============================ */}
      <header className="hero">
        {/* Une seule image statique : le crossfade de 3 calques plein écran
            en mix-blend-mode coûtait une recomposition GPU permanente */}
        <div className="hero-montage" aria-hidden="true" style={{ position: 'relative' }}>
          <Image src="/images/4.avif" alt="" fill style={{ objectFit: 'cover' }} />
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
            Le profil qui<br />
            <span className="grad">te fait signer.</span>
          </h1>
          <p className="lead reveal" data-delay="2">
            Reprends le contrôle de ton image. Mets en valeur ton parcours et tes compétences sur une page web d&apos;élite unique pour te vendre toi-même auprès des clubs, agents et sponsors.
          </p>
          <div className="hero-actions reveal" data-delay="3">
            <Link href="/tarifs" className="btn btn-primary btn-lg">Créer mon profil</Link>
            <Link href="/bibliotheque" className="btn btn-ghost btn-lg">Voir la bibliothèque</Link>
          </div>
        </div>
        <div className="scroll-cue">
          Découvrir
          <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </header>

      {/* ===================== BANDE DE MÉTRIQUES =====================
          Preuve de valeur immédiate sous le hero. Compteurs animés (.count)
          déclenchés par l'IntersectionObserver de SiteEffects. */}
      <section className="metrics-band">
        <div className="container">
          <div className="metrics reveal">
            <div className="metric">
              <div className="v"><span className="count" data-to="1">1</span> lien</div>
              <div className="l">Tout ton dossier sportif, zéro pièce jointe</div>
            </div>
            <div className="metric">
              <div className="v"><span className="count" data-to="40">40</span> sec</div>
              <div className="l">Pour le mettre entre les bonnes mains</div>
            </div>
            <div className="metric">
              <div className="v"><span className="count" data-to="100">100</span>% à jour</div>
              <div className="l">Un but marqué, une ligne ajoutée — partout</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CATÉGORIES (repositionnées) ===================== */}
      <section className="section center" style={{ paddingTop: '90px' }}>
        <div className="container">
          <span className="tag reveal">Fait pour être partagé</span>
          <h2 className="title reveal" data-delay="1">Là où ça change tout.</h2>
          <p className="lead-2 reveal" data-delay="2">
            Un même profil, trois portes d&apos;entrée vers ta carrière.
          </p>
          <div className="grid cols-3">
            {AUDIENCES.map((a, i) => (
              <div className="card audience-card reveal" data-delay={i + 1} key={a.t}>
                <span className="audience-idx">{String(i + 1).padStart(2, '0')}</span>
                <div className="ic">{a.ic}</div>
                <h3>{a.t}</h3>
                <p>{a.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== PROBLÈME → SOLUTION ===================== */}
      <section className="section center">
        <div className="container">
          <span className="tag reveal">Reprends le contrôle</span>
          <h2 className="title reveal" data-delay="1">
            Sois le maître de<br />ton image et de ton talent.
          </h2>
          <p className="lead-2 reveal" data-delay="2" style={{ maxWidth: '680px', margin: '0 auto' }}>
            Nous ne prétendons pas te trouver un club à ta place, mais nous te donnons les armes pour te vendre toi-même et valoriser tes compétences. 
            Notre mission est de t&apos;accompagner dans la valorisation de ton image et de te rendre visible aux yeux de tous afin de maximiser tes chances d&apos;atteindre tes objectifs de carrière.
          </p>
        </div>
      </section>

      {/* ===================== COMMENT ÇA MARCHE ===================== */}
      <section className="section center">
        <div className="container">
          <span className="tag reveal">En 3 étapes</span>
          <h2 className="title reveal" data-delay="1">Prêt en quelques minutes.</h2>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div className="step reveal" data-delay={i + 1} key={s.n}>
                <span className="step-n">{s.n}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== SHOWCASE (exemple réel) ===================== */}
      <section className="section center">
        <div className="container">
          <span className="tag reveal">Vu en vrai</span>
          <h2 className="title reveal" data-delay="1">À quoi ça ressemble.</h2>
          <div className="showcase reveal" data-delay="2">
            {/* Ruban frère du lien profil, jamais imbriqué — pas de <a> dans <a> (même pattern que /exemples) */}
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
        </div>
      </section>

      {/* ===================== CLUBS · AGENTS · SPONSORS ===================== */}
      <section className="section center">
        <div className="container">
          <span className="tag reveal">Vous recrutez ou sponsorisez ?</span>
          <h2 className="title reveal" data-delay="1">
            Clubs, agents, sponsors :<br />décidez sur des faits.
          </h2>
          <p className="lead-2 reveal" data-delay="2">
            Un lien s&apos;ouvre, tout est là : stats vérifiables, vidéos, parcours, contact direct.
            Évaluez un profil en 90 secondes au lieu de courir après des PDF.
            Vous gérez une flotte de talents&nbsp;? On construit votre espace dédié.
          </p>
          <div className="hero-actions reveal" data-delay="3" style={{ marginTop: 30 }}>
            <Link href="/offre-sur-mesure" className="btn btn-primary btn-lg">Parler à l&apos;équipe</Link>
            <Link href="/bibliotheque" className="btn btn-ghost btn-lg">Parcourir les profils publics</Link>
          </div>
        </div>
      </section>

      {/* ===================== CTA FINAL ===================== */}
      <section className="section center">
        <div className="container reveal">
          <h2 className="title">Ton prochain contrat<br />commence par un lien.</h2>
          <p className="lead-2">
            Pendant que tu hésites, un autre profil circule déjà dans les DM des recruteurs.
            Crée le tien aujourd&apos;hui — partage-le avant ton prochain match.
          </p>
          <div className="hero-actions" style={{ marginTop: 36 }}>
            <Link href="/tarifs" className="btn btn-primary btn-lg">Créer mon profil</Link>
            <Link href="/bibliotheque" className="btn btn-ghost btn-lg">Voir la bibliothèque</Link>
          </div>
        </div>
      </section>
    </>
  )
}
