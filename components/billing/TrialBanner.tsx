'use client'

import Link from 'next/link'

interface Props {
  /** Fin d'essai (ISO) — affichée à l'utilisateur. */
  trialEndsAt: string
  /** Indique si l'essai a expiré. */
  isExpired: boolean
}

/**
 * Bandeau affiché pendant l'essai gratuit de 3 jours.
 */
export function TrialBanner({ trialEndsAt, isExpired }: Props) {
  const endDate = new Date(trialEndsAt).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  if (isExpired) {
    return (
      <div className="trial-banner" style={{ background: 'linear-gradient(90deg, #ff4e50, #f9d423)', color: '#000', border: 'none', padding: '16px 20px', borderRadius: 10, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div className="trial-banner-txt" style={{ display: 'grid', gap: 4, color: '#000' }}>
          <strong style={{ fontSize: '1.05rem' }}>⚠️ Ta période d&apos;essai est terminée.</strong>
          <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            Ton CV est hors ligne et l&apos;accès aux modifications est bloqué. Choisis ton plan pour débloquer ton répertoire.
          </span>
        </div>
        <Link href="/tarifs" className="btn" style={{ background: '#000', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 6, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
          Débloquer mon CV
        </Link>
      </div>
    )
  }

  return (
    <div className="trial-banner" style={{ padding: '16px 20px', borderRadius: 10, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, border: '1px solid var(--border)' }}>
      <div className="trial-banner-txt" style={{ display: 'grid', gap: 4 }}>
        <strong style={{ fontSize: '1.05rem', color: 'var(--gold)' }}>⚡ Essai gratuit actif (sans engagement).</strong>
        <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
          Ton répertoire est en ligne. L&apos;essai se termine le <strong>{endDate}</strong>. Choisis ton plan pour le garder en ligne définitivement.
        </span>
      </div>
      <Link href="/tarifs" className="btn btn-ghost" style={{ padding: '10px 18px', borderRadius: 6, textDecoration: 'none', display: 'inline-block' }}>
        Activer mon offre
      </Link>
    </div>
  )
}
