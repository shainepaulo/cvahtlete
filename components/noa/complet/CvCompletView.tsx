'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { CvCompletProfile } from '@/types/noa'
import { BlurValue } from '@/components/privacy/BlurValue'
import './cv-complet.css'

interface Props {
  profile: CvCompletProfile
  /** Cible du lien Retour, ex. '/cv/noa' ou '/profil?a=dembele'. */
  backHref: string
  /** Slug transmis à BlurValue (journalisation des demandes d'accès). */
  cvSlug: string
  adminForceMask: boolean
  isAdminViewer: boolean
}

/**
 * CV complet — portage React de l'interface info.html d'ATHLETE CV
 * (https://athlete-cv.vercel.app/info.html?a=bolt), partagé par tous les
 * joueurs. « Imprimer » ouvre le PDF officiel si `complet.pdfUrl` est fourni
 * (exception Noa) ; sinon impression navigateur thémée (@media print).
 */
export function CvCompletView({ profile, backHref, cvSlug, adminForceMask, isAdminViewer }: Props) {
  const { identity, complet } = profile
  const [activePhoto, setActivePhoto] = useState<1 | 2>(1)
  const [toast, setToast] = useState(false)
  const skillsRef = useRef<HTMLDivElement>(null)
  const forceVisible = isAdminViewer && !adminForceMask

  // Masque nav/footer du site pour l'affichage plein écran, comme /cine et /profil.
  useEffect(() => {
    document.body.classList.add('preview-mode')
    return () => document.body.classList.remove('preview-mode')
  }, [])

  // Animation des barres de compétences à l'entrée dans le viewport (comme info.js)
  useEffect(() => {
    const rootEl = skillsRef.current
    if (!rootEl) return
    // On observe les conteneurs .skill-item (les .skill-fill partent à largeur 0,
    // un observer sur eux ne déclencherait jamais un threshold > 0).
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
  }, [])

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: `CV ${identity.first} ${identity.last}`, url: window.location.href })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        setToast(true)
        setTimeout(() => setToast(false), 1800)
      }
    } catch {}
  }

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
      </nav>

      <main className="cv-container">
        <header className="cv-header">
          <div className="photo-section">
            <div
              className="photo-wrapper"
              onClick={() => setActivePhoto((p) => (p === 1 ? 2 : 1))}
              role="button"
              aria-label="Changer de photo"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={complet.photo1}
                alt={`${identity.first} ${identity.last}`}
                className={`player-photo${activePhoto === 1 ? ' active' : ''}`}
                style={{ objectPosition: complet.photoPos }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={complet.photo2}
                alt={`${identity.first} ${identity.last}`}
                className={`player-photo${activePhoto === 2 ? ' active' : ''}`}
                style={{ objectPosition: complet.photoPos }}
              />
              <div className="photo-hint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 15l6 6m-11-4a7 7 0 110-14 7 7 0 010 14z" />
                </svg>
                Cliquez pour changer
              </div>
            </div>
            <div className="jersey-number">{complet.number}</div>
          </div>

          <div className="header-info">
            <div className="name-section">
              <h1 className="player-name">
                <span className="first-name">{identity.first}</span>
                <span className="last-name">{identity.last}</span>
              </h1>
              <div className="team-badge">
                <span>{complet.team.name}</span>
              </div>
            </div>
            <div className="contact-grid">
              {identity.contact.map((c) => {
                const sensitive = c.href?.startsWith('tel:') || c.href?.startsWith('mailto:')
                return (
                  <div key={c.label} className="contact-item">
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
            <section className="cv-section">
              <h2 className="section-title">
                <span className="title-icon">{complet.titleIcon}</span> Profil du joueur
              </h2>
              <p className="profile-text">{complet.profileText}</p>
            </section>

            <section className="cv-section">
              <h2 className="section-title">
                <span className="title-icon">📏</span> {complet.physicalTitle}
              </h2>
              <div className="stats-list">
                {complet.physical.map((p) => (
                  <div key={p.name} className="stat-row">
                    <span className="stat-name">{p.name}</span>
                    <span className="stat-dots" />
                    <span className={`stat-value${p.highlight ? ' highlight' : ''}`}>{p.value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="cv-section">
              <h2 className="section-title">
                <span className="title-icon">{complet.positionsIcon}</span> {complet.positionsTitle}
              </h2>
              <div className="positions-grid">
                {complet.positions.map((p, i) => (
                  <div key={p.name} className={`position-card ${i === 0 ? 'primary' : 'secondary'}`}>
                    <span className="position-label">{p.label}</span>
                    <span className="position-name">{p.name}</span>
                    <span className="position-detail">{p.detail}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="cv-column right" ref={skillsRef}>
            <section className="cv-section">
              <h2 className="section-title">
                <span className="title-icon">⭐</span> Compétences clés
              </h2>
              <div className="skills-grid">
                {complet.skills.map((s) => (
                  <div key={s.name} className="skill-item">
                    <span className="skill-name">{s.name}</span>
                    <div className="skill-bar">
                      <div className="skill-fill" style={{ '--width': `${s.value}%` } as React.CSSProperties} />
                    </div>
                    <span className="skill-value">{s.value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="cv-section">
              <h2 className="section-title">
                <span className="title-icon">📜</span> Parcours
              </h2>
              <div className="timeline">
                {complet.timeline.map((t) => (
                  <div key={t.title} className="timeline-item">
                    <div className="timeline-date">{t.date}</div>
                    <div className="timeline-content">
                      <h3>{t.title}</h3>
                      <p>{t.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="cv-section">
              <h2 className="section-title">
                <span className="title-icon">🏆</span> Palmarès
              </h2>
              <div className="trophies-list">
                {complet.palmares.map((t) => (
                  <div key={t.name} className="trophy-row">
                    <span className="trophy-icon">{t.icon}</span>
                    <span className="trophy-name">{t.name}</span>
                    <span className="trophy-year">{t.year}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <footer className="cv-footer">
          <div className="footer-content">
            <p className="footer-text">CV Joueur Professionnel</p>
            <p className="footer-date">Dernière mise à jour : {complet.lastUpdate}</p>
          </div>
          <div className="footer-actions">
            {complet.pdfUrl ? (
              /* PDF officiel importé (exception Noa) : on l'ouvre tel quel */
              <a className="action-btn print" href={complet.pdfUrl} target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
                </svg>
                Imprimer
              </a>
            ) : (
              /* Pas de PDF importé (Dembélé et tous les futurs joueurs) :
                 impression navigateur → PDF thémé ATHLETE CV via @media print */
              <button type="button" className="action-btn print" onClick={() => window.print()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
                </svg>
                Imprimer
              </button>
            )}
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
