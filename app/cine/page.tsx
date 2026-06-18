'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { CvData } from '@/app/actions/cv'

/* Le Canvas WebGL ne doit JAMAIS être rendu côté serveur. */
const CineView = dynamic(() => import('@/components/CineView'), {
  ssr: false,
  loading: () => (
    <div className="cine-wrap">
      <div className="ci-locked"><p>Chargement de la scène…</p></div>
    </div>
  ),
})

/* Exemples servis en démo depuis /public/data (aucun backend requis).
   En production, un athlète réel sera chargé via Supabase + son entitlement
   cinématique lu côté serveur (RLS) — jamais décidé par le client. */
const DEMO_SLUGS = new Set(['dembele'])

interface RawCv {
  first?: string; last?: string; sport?: string; location?: string; tagline?: string
  colors?: { a?: string; b?: string }
  stats?: unknown; palmares?: unknown; career?: unknown; links?: unknown
}

/* Mappe le JSON de démo vers la forme CvData (miroir du schéma SQL) attendue
   par CineView, qui re-valide ensuite chaque champ avant affichage. */
function toCvData(raw: RawCv, slug: string): CvData {
  return {
    id: '', user_id: '', slug,
    visibility: 'public',
    first: raw.first || '', last: raw.last || '',
    sport: raw.sport || '', location: raw.location || '',
    avatar_url: null, cine_bg_url: null,
    photo_pos_x: 50, photo_pos_y: 50, crop_zoom_avatar: 1.4,
    stats: (raw.stats as CvData['stats']) ?? [],
    palmares: (raw.palmares as CvData['palmares']) ?? [],
    career: (raw.career as CvData['career']) ?? [],
    links: (raw.links as CvData['links']) ?? [],
    colors: (raw.colors as CvData['colors']) ?? {},
    created_at: '', updated_at: '',
  }
}

function CineContent() {
  const slug = useSearchParams().get('u') || ''
  const [cv, setCv] = useState<CvData | null>(null)
  const [tagline, setTagline] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Immersion totale : on masque nav / footer / décor de fond.
  useEffect(() => {
    document.body.classList.add('cine-mode')
    return () => document.body.classList.remove('cine-mode')
  }, [])

  useEffect(() => {
    const id = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (!id || !DEMO_SLUGS.has(id)) { setError('Lien invalide'); return }
    let alive = true
    fetch(`/data/${id}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((raw: RawCv) => {
        if (!alive) return
        setTagline(raw.tagline || '')
        setCv(toCvData(raw, id))
      })
      .catch(() => alive && setError('CV introuvable'))
    return () => { alive = false }
  }, [slug])

  if (error) {
    return (
      <div className="cine-wrap">
        <div className="ci-locked">
          <h1>Lien invalide</h1>
          <p>{error}</p>
          <Link className="btn btn-ghost" href="/exemples" style={{ marginTop: 18 }}>← Voir l&apos;exemple</Link>
        </div>
      </div>
    )
  }

  if (!cv) {
    return (
      <div className="cine-wrap">
        <div className="ci-locked"><p>Chargement…</p></div>
      </div>
    )
  }

  // Démo : entitlement cinématique forcé pour l'exemple vitrine.
  return <CineView cv={cv} cinematic tagline={tagline} />
}

export default function CinePage() {
  return <Suspense fallback={null}><CineContent /></Suspense>
}
