'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface CvData {
  first: string; last: string; sport?: string; emoji?: string; discipline?: string
  location?: string; tagline?: string
  colors?: { a: string; b: string }
  cineBg?: string; avatar?: string
  cineBgPosX?: number; cineBgPosY?: number; cropZoomCineBg?: number
  photoPosX?: number; photoPosY?: number
  stats?: { value: string; unit?: string; label: string }[]
  career?: { year: string; club: string; detail?: string }[]
  palmares?: { icon: string; name: string; count: string }[]
  links?: { label: string; url: string }[]
  slug?: string
}

function CineContent() {
  const params = useSearchParams()
  const slug = params.get('u')
  const [cv, setCv] = useState<CvData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [locked, setLocked] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    document.body.classList.add('cine-mode')
    return () => document.body.classList.remove('cine-mode')
  }, [])

  useEffect(() => {
    if (!slug) { setError('Lien invalide'); return }
    fetch('/api/cv/' + encodeURIComponent(slug))
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(({ cv: cvData, cinematic }) => {
        if (!cinematic) {
          setLocked('notpro')
          return
        }
        setCv(cvData)
      })
      .catch(() => setError("CV introuvable"))
  }, [slug])

  if (!slug || error) {
    return (
      <div id="cineRoot" className="cine-wrap">
        <div className="ci-locked">
          <h1>Lien invalide</h1>
          <p>{error || 'Aucun CV indiqué.'}</p>
        </div>
      </div>
    )
  }

  if (locked === 'notpro') {
    return (
      <div id="cineRoot" className="cine-wrap">
        <div className="ci-locked">
          <h1>Mode cinématique 🎬</h1>
          <p>Ce CV n&apos;a pas l&apos;option cinématique — réservée à l&apos;offre Pro.</p>
          <Link className="btn btn-primary" href="/tarifs">Passer au Pro</Link>
        </div>
      </div>
    )
  }

  if (!cv) {
    return (
      <div id="cineRoot" className="cine-wrap">
        <div className="ci-locked"><p>Chargement…</p></div>
      </div>
    )
  }

  const colorA = cv.colors?.a || '#8bb6ff'
  const colorB = cv.colors?.b || '#79e0cf'
  const bg = cv.cineBg || cv.avatar
  const cx = cv.cineBgPosX ?? cv.photoPosX ?? 50
  const cy = cv.cineBgPosY ?? cv.photoPosY ?? 50
  const cz = cv.cropZoomCineBg ?? 1.25
  const m = (cz - 1) / 2 * 100
  const tf = `translate(${(m * (1 - cx / 50)).toFixed(2)}%,${(m * (1 - cy / 50)).toFixed(2)}%) scale(${cz})`

  const stats = (cv.stats || []).slice(0, 6)
  const social = (cv.links || []).filter((l) => l.url)

  return (
    <div
      id="cineRoot"
      className="cine-wrap"
      style={{ '--a': colorA, '--b': colorB } as React.CSSProperties}
    >
      <div className="ci-bg">
        {bg && <img src={bg} style={{ transform: tf, transformOrigin: 'center' }} alt="" />}
        <div className="ci-scrim" />
      </div>

      <div className="ci-name">
        <span>{cv.first}</span>
        <strong>{cv.last}</strong>
      </div>

      <div className="ci-chips">
        <span>{cv.emoji} {cv.sport}</span>
        {cv.discipline && <span>{cv.discipline}</span>}
        {cv.location && <span>📍 {cv.location}</span>}
      </div>

      <div className="ci-actions">
        <button className="ci-btn" onClick={() => setPanelOpen((o) => !o)}>
          📊 Stats &amp; palmarès
        </button>
        <Link className="ci-btn" href={`/profil?u=${encodeURIComponent(slug!)}`}>
          📄 CV complet
        </Link>
        {social.map((l) => (
          <a key={l.label} className="ci-btn ci-soc" href={l.url} target="_blank" rel="noopener noreferrer">
            {l.label}
          </a>
        ))}
      </div>

      <aside className={`ci-panel${panelOpen ? ' open' : ''}`}>
        <button className="ci-close" aria-label="Fermer" onClick={() => setPanelOpen(false)}>✕</button>

        {cv.tagline && <p className="ci-tag">{cv.tagline}</p>}

        {stats.length > 0 && (
          <div className="ci-statgrid">
            {stats.map((s, i) => (
              <div key={i} className="ci-stat">
                <div className="v">{s.value}{s.unit && <span>{s.unit}</span>}</div>
                <div className="l">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {(cv.career || []).length > 0 && (
          <>
            <h4>Parcours</h4>
            <div className="ci-list">
              {cv.career!.map((c, i) => (
                <div key={i} className="ci-row">
                  <span className="y">{c.year}</span>
                  <span className="t">{c.club}</span>
                  <span className="d">{c.detail}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {(cv.palmares || []).length > 0 && (
          <>
            <h4>Palmarès</h4>
            <div className="ci-list">
              {cv.palmares!.map((p, i) => (
                <div key={i} className="ci-row">
                  <span className="t">{p.icon} {p.name}</span>
                  <span className="c">{p.count}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {!stats.length && !cv.career?.length && !cv.palmares?.length && (
          <p className="ci-empty">
            Aucune stat pour l&apos;instant.<br />
            Ajoute tes statistiques depuis le{' '}
            <Link href="/builder" style={{ color: colorA }}>builder</Link>.
          </p>
        )}
      </aside>
    </div>
  )
}

export default function CinePage() {
  return <Suspense fallback={null}><CineContent /></Suspense>
}
