'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { CvData } from '@/app/actions/cv'
import { BlurValue } from '@/components/privacy/BlurValue'
import './noa/complet/cv-complet.css'

interface Props {
  cv: CvData
  backHref: string
  cvSlug: string
  adminForceMask: boolean
  isAdminViewer: boolean
}

export function AthleteCvCompletView({ cv, backHref, cvSlug, adminForceMask, isAdminViewer }: Props) {
  const [activePhoto, setActivePhoto] = useState<1 | 2>(1)
  const [toast, setToast] = useState(false)
  const skillsRef = useRef<HTMLDivElement>(null)
  const forceVisible = isAdminViewer && !adminForceMask

  // Masque nav/footer du site pour l'affichage plein écran
  useEffect(() => {
    document.body.classList.add('preview-mode')
    return () => document.body.classList.remove('preview-mode')
  }, [])

  // Animation des barres de compétences à l'entrée dans le viewport
  useEffect(() => {
    const rootEl = skillsRef.current
    if (!rootEl) return
    const items = rootEl.querySelectorAll<HTMLElement>('.skill-item')
    const animate = (item: Element) => item.querySelector('.skill-fill')?.classList.add('animate')
    if (typeof IntersectionObserver === 'undefined') {
      items.forEach(animate)
      return
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animate(e.target)
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.5 },
    )
    items.forEach((item) => io.observe(item))
    return () => io.disconnect()
  }, [cv])

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: `CV ${cv.first} ${cv.last}`, url: window.location.href })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        setToast(true)
        setTimeout(() => setToast(false), 1800)
      }
    } catch {}
  }

  // --- MAPPAGE DYNAMIQUE DU PROFIL DE L'ATHLÈTE ---
  const photo1 = cv.avatar || '/images/default-avatar.png'
  const photo2 = cv.cineBg || cv.avatar || '/images/default-avatar.png'
  const hasMultiplePhotos = !!cv.cineBg

  // Recherche des caractéristiques spécifiques
  const getCharValue = (names: string[], fallback = '') => {
    const char = cv.characteristics?.find((c) => names.some((n) => c.name?.toLowerCase().includes(n.toLowerCase())))
    return char?.value || fallback
  }

  const jerseyNumber = getCharValue(['numéro', 'maillot', 'jersey'], '10')
  const clubActuel = getCharValue(['club', 'équipe', 'team'], cv.discipline || cv.sport)

  // Caractéristiques physiques filtrées
  const physicalFields = cv.characteristics?.filter((c) => 
    !['club', 'équipe', 'team', 'numéro', 'maillot', 'jersey'].some((ex) => c.name?.toLowerCase().includes(ex))
  ) || []

  // Poste de jeu
  const positions = [
    { label: 'Principal', name: cv.discipline || cv.sport, detail: `${cv.sport} — N°${jerseyNumber}` },
    ...(cv.nationality ? [{ label: 'Sélection', name: cv.nationality, detail: cv.eligibility || 'International' }] : [])
  ]

  const rawStats = (cv.stats || []) as Array<{ label: string; value: string; unit?: string }>
  const rawCareer = (cv.career || []) as Array<{ year: string; club: string; detail?: string }>
  const rawPalmares = (cv.palmares || []) as Array<{ icon: string; name: string; count: string; detail?: string }>

  // Statistiques
  const stats = rawStats.map((s) => ({
    name: s.label || 'Statistique',
    display: s.value + (s.unit || '')
  }))

  // Parcours (timeline)
  const timeline = rawCareer.map((c) => ({
    date: c.year || 'Année',
    title: c.club || 'Étape',
    sub: c.detail || ''
  }))

  // Palmarès
  const palmares = rawPalmares.map((p) => ({
    icon: p.icon || '🏆',
    name: p.name || 'Titre',
    year: p.count || '',
    detail: p.detail || ''
  }))

  // Coordonnées de contact
  const contacts = [
    ...(cv.birthDate ? [{ icon: '📅', label: 'Né le', value: cv.birthDate, href: undefined }] : []),
    ...(cv.nationality ? [{ icon: '🌍', label: 'Nationalité', value: cv.nationality, href: undefined }] : []),
    ...(cv.eligibility ? [{ icon: '⭐', label: 'Éligibilité', value: cv.eligibility, href: undefined }] : []),
    ...(cv.contactPhone ? [{ icon: '📞', label: 'Téléphone', value: cv.contactPhone, href: `tel:${cv.contactPhone.replace(/[^+\d]/g, '')}` }] : []),
    ...(cv.contactEmail ? [{ icon: '✉️', label: 'Courriel', value: cv.contactEmail, href: `mailto:${cv.contactEmail}` }] : [])
  ]

  return (
    <div className="cvc-page">
      <nav className="nav-bar">
        <Link href={backHref} className="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Retour
        </Link>
        <span className="nav-title">CV Joueur</span>
        <div className="nav-actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className="action-btn print"
            onClick={() => window.print()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: '20px',
              border: '1px solid var(--psg-blue, #001f54)',
              background: 'var(--psg-blue, #001f54)',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
              <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
            </svg>
            <span>Imprimer</span>
          </button>
          <button
            type="button"
            className="action-btn share"
            onClick={share}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: '20px',
              border: '1px solid rgba(0,0,0,0.15)',
              background: '#fff',
              color: 'var(--psg-blue, #001f54)',
              cursor: 'pointer',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span className="hide-mobile-text">Partager</span>
          </button>
        </div>
      </nav>

      {cv.cinematic && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0 -10px' }}>
          <Link className="cine-ribbon" href={`/${cv.slug}`} style={{ position: 'relative', top: 'auto', left: 'auto', transform: 'none', margin: '0 auto', zIndex: 100 }}>
            <span className="cine-ribbon-dot" />
            🎬 Mode cinématique
          </Link>
        </div>
      )}

      <main className="cv-container">
        <header className="cv-header">
          <div className="photo-section">
            <div
              className="photo-wrapper"
              onClick={() => hasMultiplePhotos && setActivePhoto((p) => (p === 1 ? 2 : 1))}
              role="button"
              aria-label="Changer de photo"
              style={{ cursor: hasMultiplePhotos ? 'pointer' : 'default' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo1}
                alt={`${cv.first} ${cv.last}`}
                className={`player-photo${activePhoto === 1 ? ' active' : ''}`}
                style={{ objectPosition: 'center 15%' }}
              />
              {hasMultiplePhotos && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo2}
                    alt={`${cv.first} ${cv.last}`}
                    className={`player-photo${activePhoto === 2 ? ' active' : ''}`}
                    style={{ objectPosition: 'center 15%' }}
                  />
                  <div className="photo-hint">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 15l6 6m-11-4a7 7 0 110-14 7 7 0 010 14z" />
                    </svg>
                    Cliquez pour changer
                  </div>
                </>
              )}
            </div>
            <div className="jersey-number">{jerseyNumber}</div>
          </div>

          <div className="header-info">
            <div className="name-section">
              <h1 className="player-name">
                <span className="first-name">{cv.first}</span>
                <span className="last-name">{cv.last}</span>
              </h1>
              <div className="team-badge">
                <span>{clubActuel}</span>
              </div>
            </div>
            <div className="contact-grid">
              {contacts.map((c, idx) => {
                const sensitive = c.href?.startsWith('tel:') || c.href?.startsWith('mailto:')
                return (
                  <div key={idx} className="contact-item">
                    <span className="contact-icon">{c.icon}</span>
                    <div className="contact-content">
                      <span className="contact-label">{c.label}</span>
                      <BlurValue
                        className="contact-value"
                        value={c.value}
                        href={c.href}
                        sensitive={!!sensitive}
                        forceVisible={forceVisible}
                        fieldLabel={c.label}
                        cvSlug={cvSlug}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </header>

        <div className="cv-content">
          <div className="cv-column left">
            {cv.bio && (
              <section className="cv-section">
                <h2 className="section-title">
                  <span className="title-icon">⚽</span> Profil du joueur
                </h2>
                <p className="profile-text" style={{ whiteSpace: 'pre-line' }}>{cv.bio}</p>
              </section>
            )}

            {physicalFields.length > 0 && (
              <section className="cv-section">
                <h2 className="section-title">
                  <span className="title-icon">📏</span> Caractéristiques physiques
                </h2>
                <div className="stats-list">
                  {physicalFields.map((p, idx) => (
                    <div key={idx} className="stat-row">
                      <span className="stat-name">{p.name}</span>
                      <span className="stat-dots" />
                      <span className="stat-value">{p.value}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="cv-section">
              <h2 className="section-title">
                <span className="title-icon">🧤</span> Poste de jeu
              </h2>
              <div className="positions-grid">
                {positions.map((p, i) => (
                  <div key={i} className={`position-card ${i === 0 ? 'primary' : 'secondary'}`}>
                    <span className="position-label">{p.label}</span>
                    <span className="position-name">{p.name}</span>
                    <span className="position-detail">{p.detail}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="cv-column right" ref={skillsRef}>
            {stats.length > 0 && (
              <section className="cv-section">
                <h2 className="section-title">
                  <span className="title-icon">📊</span> Statistiques
                </h2>
                <div className="skills-grid">
                  {stats.map((s, idx) => (
                    <div key={idx} className="skill-item">
                      <span className="skill-name">{s.name}</span>
                      <div style={{ flex: 1, borderBottom: '1px dotted var(--gray-light, #ddd)', margin: '0 4px', height: '1px', alignSelf: 'center' }} />
                      <span className="skill-value">{s.display}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {timeline.length > 0 && (
              <section className="cv-section">
                <h2 className="section-title">
                  <span className="title-icon">📜</span> Parcours
                </h2>
                <div className="timeline">
                  {timeline.map((t, idx) => (
                    <div key={idx} className="timeline-item">
                      <div className="timeline-date">{t.date}</div>
                      <div className="timeline-content">
                        <h3>{t.title}</h3>
                        <p>{t.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {palmares.length > 0 && (
              <section className="cv-section">
                <h2 className="section-title">
                  <span className="title-icon">🏆</span> Palmarès
                </h2>
                <div className="trophies-list">
                  {palmares.map((t, idx) => (
                    <div key={idx} className="trophy-row">
                      <span className="trophy-icon">{t.icon}</span>
                      <div className="trophy-info" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span className="trophy-name">{t.name}</span>
                        {t.detail && <span className="trophy-detail" style={{ fontSize: '0.75rem', opacity: 0.75, marginTop: 2 }}>{t.detail}</span>}
                      </div>
                      <span className="trophy-year">{t.year}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>

        <footer className="cv-footer">
          <div className="footer-content">
            <p className="footer-text">CV Athlete Professionnel</p>
            <p className="footer-date">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="footer-actions">
            <button type="button" className="action-btn print" onClick={() => window.print()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
              </svg>
              Imprimer
            </button>
            <button className="action-btn share" onClick={share}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Partager
            </button>
          </div>
        </footer>
      </main>

      <div className={`toast${toast ? ' show' : ''}`}>Lien copié dans le presse-papier&nbsp;!</div>
    </div>
  )
}
