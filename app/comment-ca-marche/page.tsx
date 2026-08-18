import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Comment ça marche — ATHLETE CV',
  description: 'Crée ton CV d\'athlète professionnel en 4 étapes simples.',
}

export default function CommentCaMarchePage() {
  const steps = [
    {
      num: '1',
      title: 'Choisis ton plan',
      desc: 'Sélectionne l\'offre qui correspond à tes objectifs (Starter, Pro ou Club). Un paiement unique, aucun abonnement caché.',
      icon: '🎫',
    },
    {
      num: '2',
      title: 'Complète tes infos',
      desc: 'Renseigne ton sport, ton poste, tes statistiques clés (sélections, buts, arrêts), ton palmarès et ton parcours en club.',
      icon: '📝',
    },
    {
      num: '3',
      title: 'Personnalise le style',
      desc: 'Choisis tes couleurs de club et active le Mode Cinématique avec tes vidéos highlights pour capturer l\'attention dès les premières secondes.',
      icon: '🎬',
    },
    {
      num: '4',
      title: 'Partage ton lien unique',
      desc: 'Utilise ton adresse personnalisée (athletecv.com/ton-nom) en bio Instagram, TikTok, ou envoie-la directement aux agents et recruteurs.',
      icon: '🚀',
    },
  ]

  return (
    <>
      <section className="section center" style={{ paddingTop: 'calc(var(--nav-h) + 90px)', paddingBottom: '60px' }}>
        <div className="container">
          <span className="tag reveal">Étape par étape</span>
          <h2 className="title reveal" data-delay="1">
            Comment ça marche ?
          </h2>
          <p className="lead-2 reveal" data-delay="2" style={{ marginBottom: '50px' }}>
            Créer ta vitrine sportive n&apos;a jamais été aussi simple. Deviens visible auprès des recruteurs en 4 étapes.
          </p>

          <div 
            className="grid" 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '30px', 
              marginTop: '40px',
              textAlign: 'left'
            }}
          >
            {steps.map((s, idx) => (
              <div 
                key={s.num} 
                className="card reveal" 
                data-delay={idx + 1}
                style={{ 
                  position: 'relative', 
                  padding: '40px 30px 30px', 
                  background: 'var(--surface)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: '-20px', 
                    left: '30px', 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(120deg, var(--accent), var(--accent-2))', 
                    color: '#06121f', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 800, 
                    fontSize: '1.1rem',
                    boxShadow: '0 4px 14px rgba(139,182,255,0.4)'
                  }}
                >
                  {s.num}
                </div>
                <div style={{ fontSize: '2rem', marginBottom: '16px', marginTop: '10px' }}>{s.icon}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text)' }}>
                  {s.title}
                </h3>
                <p style={{ color: 'var(--muted-2)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section center" style={{ paddingBottom: '90px' }}>
        <div className="container reveal">
          <div 
            className="app-card" 
            style={{ 
              maxWidth: '700px', 
              margin: '0 auto', 
              padding: '50px 40px',
              background: 'radial-gradient(120% 120% at 50% -10%, rgba(139,182,255,0.1), transparent 50%), var(--surface)'
            }}
          >
            <h2 className="title" style={{ fontSize: '2rem', marginBottom: '16px' }}>
              Prêt à créer ton lien ?
            </h2>
            <p className="lead-2" style={{ marginBottom: '30px' }}>
              Rejoins des dizaines d&apos;athlètes qui propulsent leur carrière grâce à un profil d&apos;élite.
            </p>
            <div className="hero-actions" style={{ justifyContent: 'center' }}>
              <Link href="/tarifs" className="btn btn-primary btn-lg">Créer mon profil</Link>
              <Link href="/bibliotheque" className="btn btn-ghost btn-lg">Voir la bibliothèque</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
