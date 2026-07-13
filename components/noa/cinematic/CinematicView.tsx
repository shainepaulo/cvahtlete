'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { NoaProfile } from '@/types/noa'
import { CineVideosModal } from '@/components/noa/cinematic/CineVideosModal'

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zm0 3.68A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4zm6.4-11.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z" />
    </svg>
  ),
}

interface Props {
  profile: NoaProfile
}

/**
 * Mode Cinématique du CV de Noa — mise en scène plein écran (.noa-cine-wrap) :
 * galerie photo cliquable (fondu noir entre les photos) avec flèches de
 * navigation, texte ancré en bas, actions (stats, CV complet, vidéos,
 * Instagram) et panneau latéral stats & palmarès.
 * Namespace CSS "noa-ci-*" dédié : évite toute collision avec le mode
 * cinématique générique d'ATHLETE CV (/cine, classes "ci-*").
 */
export function CinematicView({ profile }: Props) {
  const { identity, cinematic } = profile
  const [panelOpen, setPanelOpen] = useState(false)
  const [videosOpen, setVideosOpen] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [fading, setFading] = useState(false)
  const fadeTimers = useRef<Array<ReturnType<typeof setTimeout>>>([])

  const photoCount = cinematic.gallery.length
  const photo = cinematic.gallery[photoIndex] ?? cinematic.gallery[0]!

  // Préchargement des photos pour un fondu sans flash blanc.
  useEffect(() => {
    cinematic.gallery.forEach((p) => {
      const img = new Image()
      img.src = p.src
    })
  }, [cinematic.gallery])

  useEffect(
    () => () => {
      fadeTimers.current.forEach(clearTimeout)
    },
    [],
  )

  /** Fondu noir : voile opaque → changement de photo → voile levé. */
  function changePhoto(dir: 1 | -1) {
    if (fading) return
    setFading(true)
    fadeTimers.current.push(
      setTimeout(() => {
        setPhotoIndex((i) => (i + dir + photoCount) % photoCount)
        fadeTimers.current.push(setTimeout(() => setFading(false), 80))
      }, 380),
    )
  }

  return (
    <div
      className="noa-cine-wrap"
      style={{ '--a': identity.colors.a, '--b': identity.colors.b } as React.CSSProperties}
    >
      <button
        type="button"
        className="noa-ci-bg"
        onClick={() => changePhoto(1)}
        aria-label="Photo suivante"
        style={{ border: 'none', padding: 0, cursor: 'pointer' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt={photo.alt} style={{ objectPosition: photo.position }} />
        <div className="noa-ci-scrim" />
        <div className={`noa-ci-fade${fading ? ' on' : ''}`} />
        <span className="noa-ci-photo-hint">
          {photoIndex + 1}/{photoCount}
        </span>
      </button>

      {/* Flèches de navigation visibles — complètent le clic sur la photo */}
      {photoCount > 1 && (
        <>
          <button type="button" className="noa-ci-gal-nav prev" onClick={() => changePhoto(-1)} aria-label="Photo précédente">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
          <button type="button" className="noa-ci-gal-nav next" onClick={() => changePhoto(1)} aria-label="Photo suivante">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </>
      )}

      <div className="noa-ci-content">
        <div className="noa-ci-heading">
          <span className="noa-ci-first">{identity.first}</span>
          <strong
            className="noa-ci-last"
            style={{
              background: `linear-gradient(100deg, var(--a), var(--b))`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {identity.last}
          </strong>
        </div>

        <div className="noa-ci-chips">
          {cinematic.chips.map((chip) => (
            <span key={chip}>{chip}</span>
          ))}
        </div>

        <div className="noa-ci-actions">
          {/* Ordre et DA calqués sur les boutons d'Ousmane (/cine) : plein, outline,
              outline, puis le rond Instagram discret (Noa n'a pas de compte X). */}
          <button type="button" className="noa-ci-btn noa-ci-btn--solid" onClick={() => setPanelOpen(true)}>
            📊 Stats &amp; palmarès
          </button>
          <Link className="noa-ci-btn" href="/cv/noa/complet">
            📄 CV complet
          </Link>
          <button type="button" className="noa-ci-btn" onClick={() => setVideosOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="noa-ci-btn-ic" aria-hidden>
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
            </svg>
            Vidéos
          </button>
          {cinematic.socials.map((s) => (
            <a
              key={s.icon}
              className="noa-ci-social-round"
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              title={s.label}
            >
              {SOCIAL_ICONS[s.icon]}
            </a>
          ))}
        </div>
      </div>

      <aside
        className={`noa-ci-panel${panelOpen ? ' open' : ''}`}
        role="dialog"
        aria-label="Statistiques et palmarès"
      >
        <button type="button" className="noa-ci-close" aria-label="Fermer" onClick={() => setPanelOpen(false)}>
          ✕
        </button>

        <p className="noa-ci-tag">{identity.tagline}</p>

        <div className="noa-ci-statgrid">
          {cinematic.stats.map((s) => (
            <div key={s.label} className="noa-ci-stat">
              <div className="v">
                {s.value}
                {s.unit && <span>{s.unit}</span>}
              </div>
              <div className="l">{s.label}</div>
            </div>
          ))}
        </div>

        <h4>{cinematic.worldCupTitle}</h4>
        <div className="noa-ci-list">
          {cinematic.worldCupMatches.map((m) => (
            <div key={m.opponent} className="noa-ci-row">
              <span className="y">vs {m.opponent}</span>
              <span className="t">
                {m.stage} • {m.minutes} min • {m.score}
              </span>
              <span className="c">{m.saves} arrêts</span>
            </div>
          ))}
        </div>

        <h4>Parcours</h4>
        <div className="noa-ci-list">
          {cinematic.career.map((c) => (
            <div key={`${c.year}-${c.club}`} className="noa-ci-row">
              <span className="y">{c.year}</span>
              <span className="t">{c.club}</span>
              {c.detail && <span className="d">{c.detail}</span>}
            </div>
          ))}
        </div>

        <h4>Palmarès</h4>
        <div className="noa-ci-list">
          {cinematic.palmares.map((t) => (
            <div key={t.name} className="noa-ci-row">
              <span className="t">
                {t.icon} {t.name}
              </span>
              <span className="c">{t.count}</span>
            </div>
          ))}
        </div>
      </aside>

      {videosOpen && <CineVideosModal videos={cinematic.videos} onClose={() => setVideosOpen(false)} />}
    </div>
  )
}
