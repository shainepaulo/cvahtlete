'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { CvData } from '@/app/actions/cv'
import { normalizePublicLinks } from '@/utils/public-links'

const ICONS: Record<string, React.ReactNode> = {
  x: (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15, height: 15 }}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15, height: 15 }}>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zm0 3.68A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4zm6.4-11.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z" />
    </svg>
  ),
}


function cropTf(x = 50, y = 50, z = 1.4) {
  const m = (z - 1) / 2 * 100
  return `translate(${(m * (1 - x / 50)).toFixed(2)}%,${(m * (1 - y / 50)).toFixed(2)}%) scale(${z})`
}

interface AnimatableElement extends HTMLElement {
  _intervalId?: NodeJS.Timeout;
}

function animateCount(el: HTMLElement) {
  const targetVal = el.dataset.val || el.textContent || ''
  const num = parseFloat(targetVal.replace(/[^\d.]/g, ''))
  if (isNaN(num) || num === 0) return

  const element = el as AnimatableElement
  if (element._intervalId) {
    clearInterval(element._intervalId)
  }

  const suffix = targetVal.replace(/[\d.]/g, '')
  const dur = 1200, steps = 40
  let i = 0
  element._intervalId = setInterval(() => {
    i++
    const v = Math.round((num / steps) * i * 10) / 10
    el.textContent = (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + suffix
    if (i >= steps) {
      el.textContent = targetVal
      clearInterval(element._intervalId)
      delete element._intervalId
    }
  }, dur / steps)
}

interface Props {
  cv: CvData
  isPreview?: boolean
  isOwn?: boolean
  hasPro?: boolean
}

export default function ProfileView({ cv, isPreview, isOwn, hasPro }: Props) {
  const [toastVisible, setToastVisible] = useState(false)
  const revealRef = useRef<HTMLDivElement>(null)

  // Reveal + count animation
  useEffect(() => {
    const root = revealRef.current
    if (!root) return
    const revealEl = (el: Element) => {
      el.classList.add('in')
      el.querySelectorAll<HTMLElement>('.count').forEach(animateCount)
    }

    const io = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver((entries) => {
          entries.forEach((e) => { if (e.isIntersecting) { revealEl(e.target); io!.unobserve(e.target) } })
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
      : null

    let onScroll: (() => void) | null = null
    let rafId = 0

    if (io) {
      root.querySelectorAll<HTMLElement>('.reveal').forEach((el) => io.observe(el))
    } else {
      const revealVisible = () => {
        const vh = window.innerHeight * 0.92
        root.querySelectorAll<HTMLElement>('.reveal:not(.in)').forEach((el) => {
          if (el.getBoundingClientRect().top < vh) revealEl(el)
        })
      }
      onScroll = () => { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(revealVisible) }
      window.addEventListener('scroll', onScroll, { passive: true })
      revealVisible()
    }

    return () => {
      if (io) io.disconnect()
      if (onScroll) {
        window.removeEventListener('scroll', onScroll)
        cancelAnimationFrame(rafId)
      }
    }
  }, [cv])

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

  function ctaSection() {
    if (isPreview) return null
    if (isOwn) {
      if (hasPro) return null
      return (
        <section className="p-cta reveal">
          <h3>Passe au Pro</h3>
          <p>Mises à jour illimitées + mode cinématique pour ton CV.</p>
          <Link className="btn btn-primary" href="/tarifs">Passer au Pro</Link>
        </section>
      )
    }
    return (
      <section className="p-cta reveal">
        <h3>Tu veux le même pour toi&nbsp;?</h3>
        <p>Crée ton CV d&apos;athlète et partage-le en un lien.</p>
        <Link className="btn btn-primary" href="/tarifs">Créer mon CV</Link>
      </section>
    )
  }

  const ownerHasPro = cv.hasPro ?? hasPro ?? false
  const colorA = ownerHasPro ? (cv.colors?.a ?? '#8bb6ff') : '#8bb6ff'
  const colorB = ownerHasPro ? (cv.colors?.b ?? '#79e0cf') : '#79e0cf'

  const cx = cv.photoPosX ?? 50
  const cy = cv.photoPosY ?? 50
  const cz = cv.cropZoomAvatar ?? 1.4
  const initials = ((cv.first || ' ')[0] + (cv.last || ' ')[0]).toUpperCase()
  const links = normalizePublicLinks(cv.links)
  const stats = (cv.stats ?? []) as Array<{ value: string; unit?: string; label: string }>
  const palmares = (cv.palmares ?? []) as Array<{ icon: string; name: string; count: string }>
  const career = (cv.career ?? []) as Array<{ year: string; club: string; detail?: string }>

  return (
    <>
      {cv.blocked && isOwn && (
        <div style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(90deg, #ff4e50, #f9d423)',
          color: '#000',
          padding: '12px 20px',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: '0.88rem',
          zIndex: 9999,
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 15,
          flexWrap: 'wrap'
        }}>
          <span>⚠️ Période d&apos;essai terminée. Ton CV est actuellement masqué pour le public.</span>
          <Link href="/tarifs" className="btn btn-primary" style={{
            background: '#000',
            color: '#fff',
            border: 'none',
            padding: '6px 14px',
            fontSize: '0.78rem',
            borderRadius: 6,
            textDecoration: 'none',
            boxShadow: 'none',
            fontWeight: 600
          }}>Débloquer mon CV</Link>
        </div>
      )}
      <div
        id="profileRoot"
        className="profile-wrap"
        style={{ '--a': colorA, '--b': colorB } as React.CSSProperties}
        ref={revealRef}
      >
        <article className="p-hero reveal">
          <div className="p-cover">
            <span className="sport-emoji">{cv.emoji || '🏅'}</span>
          </div>
          <div className="p-avatar" style={{ position: 'relative' }}>
            {cv.avatar ? (
              <Image
                src={cv.avatar}
                alt={`${cv.first} ${cv.last}`}
                fill
                unoptimized
                priority
                style={{ objectFit: 'cover', transform: cropTf(cx, cy, cz), transformOrigin: 'center' }}
              />
            ) : (
              <span className="initials">{initials}</span>
            )}
          </div>
          <h1 className="p-name">
            {cv.first} {cv.last}
            {cv.verified && (
              <svg className="p-verified" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.4 1.8 3 .1 1 2.8 2.4 1.8-.9 2.9.9 2.9-2.4 1.8-1 2.8-3 .1L12 22l-2.4-1.8-3-.1-1-2.8L3.2 15.5l.9-2.9-.9-2.9 2.4-1.8 1-2.8 3-.1L12 2z" />
                <path d="M10.5 14.6l-2.1-2.1-1.1 1.1 3.2 3.2 5.3-5.3-1.1-1.1z" fill="#08090c" />
              </svg>
            )}
          </h1>
          {cv.tagline && <p className="p-tagline">{cv.tagline}</p>}
          <div className="p-chips">
            <span className="p-chip">{cv.emoji} {cv.sport}</span>
            {cv.discipline && <span className="p-chip">{cv.discipline}</span>}
            {cv.location && <span className="p-chip">📍 {cv.location}</span>}
          </div>
          <div className="p-actions">
            {!isPreview && (
              <button className="btn btn-share" onClick={share}>🔗 Partager mon répertoire</button>
            )}
            {links.filter((l) => l.url).map((l) => (
              <a key={l.icon} className="p-chip" href={l.url} target="_blank" rel="noopener noreferrer" aria-label={l.label}>
                {ICONS[l.icon] && <span style={{ display: 'inline-flex', verticalAlign: 'middle' }}>{ICONS[l.icon]}</span>}
                {' '}{l.label}
              </a>
            ))}
          </div>
        </article>

        {((cv.bio) || (cv.showCharacteristics && cv.characteristics && cv.characteristics.length > 0 && cv.characteristics.some((c) => c.name?.trim() && c.value?.trim()))) && (
          <section className="p-block">
            <h2 className="p-block-title">
              {cv.showCharacteristics ? 'Caractéristiques' : 'À propos'}
            </h2>
            {cv.bio && <p className="p-bio reveal" style={{ marginBottom: cv.showCharacteristics && cv.characteristics && cv.characteristics.some((c) => c.name?.trim() && c.value?.trim()) ? '20px' : '0' }}>{cv.bio}</p>}
            {cv.showCharacteristics && cv.characteristics && cv.characteristics.length > 0 && (
              <div className="p-characteristics reveal">
                <table className="char-table" style={{ marginTop: cv.bio ? '0' : '12px' }}>
                  <tbody>
                    {cv.characteristics.map((c, idx) => {
                      if (!c.name?.trim() || !c.value?.trim()) return null
                      return (
                        <tr key={idx}>
                          <td className="char-label">{c.name}</td>
                          <td className="char-val">{c.value}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {stats.length > 0 && (
          <section className="p-block">
            <h2 className="p-block-title">Statistiques clés</h2>
            <div className="p-stats">
              {stats.map((s, i) => (
                <div key={i} className="p-stat reveal" data-delay={String(i % 4)}>
                  <div className="v">
                    <span className="count" data-val={s.value}>{s.value}</span>
                    {s.unit && <span className="u">{s.unit}</span>}
                  </div>
                  <div className="l">{s.label}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {palmares.length > 0 && (
          <section className="p-block">
            <h2 className="p-block-title">Palmarès</h2>
            <div className="p-palmares">
              {palmares.map((t, i) => (
                <div key={i} className="p-trophy reveal">
                  <span className="ti">{t.icon}</span>
                  <span className="tn">{t.name}</span>
                  <span className="tc">{t.count}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {career.length > 0 && (
          <section className="p-block">
            <h2 className="p-block-title">Parcours</h2>
            <div className="p-timeline">
              {career.map((c, i) => (
                <div key={i} className="p-event reveal">
                  <div className="y">{c.year}</div>
                  <div className="t">{c.club}</div>
                  {c.detail && <div className="d">{c.detail}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {ctaSection()}

        {!ownerHasPro && (
          <div className="watermark" style={{
            textAlign: 'center',
            padding: '24px 0 10px',
            fontSize: '0.85rem',
            color: 'var(--muted-2, #888)',
            opacity: 0.8,
            borderTop: '1px solid var(--border)'
          }}>
            Créé avec <a href="https://cvathlete.com" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: 'var(--a, #8bb6ff)', textDecoration: 'underline' }}>CVathlete</a>
          </div>
        )}
      </div>

      <div id="toast" className={`toast${toastVisible ? ' show' : ''}`}>
        Lien copié dans le presse-papiers&nbsp;!
      </div>
    </>
  )
}
