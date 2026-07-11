'use client'

import { useState } from 'react'
import type { NoaProfile } from '@/types/noa'
import { useReveal } from '@/components/noa/shared/useReveal'
import { ClassicDossier } from '@/components/noa/classic/ClassicDossier'

interface Props {
  profile: NoaProfile
  adminForceMask: boolean
  isAdminViewer: boolean
}

/**
 * Mode Classique — portage de ProfileView (ATHLETE CV) :
 * hero à cover dégradée, avatar rond, chips, stats animées,
 * palmarès, parcours, puis dossier complet (formation, expériences…).
 */
export function ClassicView({ profile, adminForceMask, isAdminViewer }: Props) {
  const { identity, classic } = profile
  const [toastVisible, setToastVisible] = useState(false)
  const revealRef = useReveal([profile])

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        setToastVisible(true)
        setTimeout(() => setToastVisible(false), 1800)
      }
    } catch {}
  }

  return (
    <>
      <div
        id="profileRoot"
        className="profile-wrap"
        style={{ '--a': identity.colors.a, '--b': identity.colors.b } as React.CSSProperties}
        ref={revealRef}
      >
        <article className="p-hero reveal">
          <div className="p-cover">
            <span className="sport-emoji">{identity.emoji}</span>
          </div>
          <div className="p-avatar">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={identity.avatar} alt={`${identity.first} ${identity.last}`} />
          </div>
          <h1 className="p-name">
            {identity.first} {identity.last}
            {identity.verified && (
              <svg className="p-verified" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.4 1.8 3 .1 1 2.8 2.4 1.8-.9 2.9.9 2.9-2.4 1.8-1 2.8-3 .1L12 22l-2.4-1.8-3-.1-1-2.8L3.2 15.5l.9-2.9-.9-2.9 2.4-1.8 1-2.8 3-.1L12 2z" />
                <path d="M10.5 14.6l-2.1-2.1-1.1 1.1 3.2 3.2 5.3-5.3-1.1-1.1z" fill="#08090c" />
              </svg>
            )}
          </h1>
          <p className="p-tagline">{identity.tagline}</p>
          <div className="p-chips">
            <span className="p-chip">{identity.emoji} {identity.sport}</span>
            <span className="p-chip">{identity.discipline}</span>
            <span className="p-chip">📍 {identity.location}</span>
          </div>
          <div className="p-actions">
            <button className="btn btn-share" onClick={share}>🔗 Partager mon répertoire</button>
          </div>
        </article>

        <section className="p-block">
          <h2 className="p-block-title">À propos</h2>
          <p className="p-bio reveal">{identity.bio}</p>
        </section>

        <section className="p-block">
          <h2 className="p-block-title">Statistiques clés</h2>
          <div className="p-stats">
            {classic.stats.map((s, i) => (
              <div key={s.label} className="p-stat reveal" data-delay={String(i % 4)}>
                <div className="v">
                  <span className="count">{s.value}</span>
                  {s.unit && <span className="u">{s.unit}</span>}
                </div>
                <div className="l">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="p-block">
          <h2 className="p-block-title">Palmarès</h2>
          <div className="p-palmares">
            {classic.palmares.map((t) => (
              <div key={t.name} className="p-trophy reveal">
                <span className="ti">{t.icon}</span>
                <span className="tn">{t.name}</span>
                <span className="tc">{t.count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="p-block">
          <h2 className="p-block-title">Parcours</h2>
          <div className="p-timeline">
            {classic.career.map((c) => (
              <div key={`${c.year}-${c.club}`} className="p-event reveal">
                <div className="y">{c.year}</div>
                <div className="t">{c.club}</div>
                {c.detail && <div className="d">{c.detail}</div>}
              </div>
            ))}
          </div>
        </section>

        <ClassicDossier profile={profile} adminForceMask={adminForceMask} isAdminViewer={isAdminViewer} />
      </div>

      <div id="toast" className={`toast${toastVisible ? ' show' : ''}`}>
        Lien copié dans le presse-papiers&nbsp;!
      </div>
    </>
  )
}
