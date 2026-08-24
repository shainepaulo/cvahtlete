'use client'

/**
 * Socle partagé des deux builders (/builder/classique et /builder/cinematique) :
 * constantes métier, composants de formulaire (lignes dynamiques, recadrage
 * photo) et hook d'état unique `useCvBuilder` (chargement du profil + CV,
 * enregistrement, message postMessage pour l'aperçu en direct).
 *
 * CONTRAINTES STRICTES : chaque champ borné (maxLength), aucun élément ne doit
 * déborder de son conteneur (voir « Builder v2 » dans globals.css).
 */

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getMyProfile } from '@/app/actions/auth'
import { getMyCv, upsertCv } from '@/app/actions/cv'
import { uploadImage, uploadVideo } from '@/app/actions/upload'

export const PLAN_LABEL: Record<string, string> = {
  free: 'Gratuit', starter: 'Starter (Legacy)', pro: 'Pro (Legacy)', season: 'Pass Saison Pro', club: 'Club',
}

export const SPORTS: Record<string, { emoji: string; a: string; b: string }> = {
  Football:     { emoji: '⚽', a: '#c6f932', b: '#5cf0c0' },
  Basket:       { emoji: '🏀', a: '#ff7a45', b: '#ffb347' },
  Handball:     { emoji: '🤾', a: '#7c5cff', b: '#ff7a45' },
  Escrime:      { emoji: '🤺', a: '#8bb6ff', b: '#ffd23f' },
  Tennis:       { emoji: '🎾', a: '#ff9f45', b: '#ffd23f' },
  Volley:       { emoji: '🏐', a: '#38d8ff', b: '#7c5cff' },
  'Athlétisme': { emoji: '⚡', a: '#ffd23f', b: '#34d399' },
  Rugby:        { emoji: '🏉', a: '#8b5cff', b: '#38d8ff' },
  Autre:        { emoji: '🏅', a: '#b08d57', b: '#d8b87a' },
}

/** Duos de couleurs prêts à l'emploi — personnalisation rapide et maîtrisée. */
export const COLOR_PRESETS: Array<{ name: string; a: string; b: string }> = [
  { name: 'Électrique', a: '#c6f932', b: '#5cf0c0' },
  { name: 'Océan',      a: '#38d8ff', b: '#7c5cff' },
  { name: 'Feu',        a: '#ff7a45', b: '#ffd23f' },
  { name: 'Royal',      a: '#8bb6ff', b: '#79e0cf' },
  { name: 'Or',         a: '#ffd98a', b: '#b08d57' },
  { name: 'Rose néon',  a: '#ff6bcb', b: '#8b5cff' },
]

/** Bornes strictes des champs : rien ne déborde, ni visuellement ni en donnée. */
export const LIMITS = {
  name: 40, discipline: 40, tagline: 120, bio: 600, location: 60, url: 200,
  rowText: 250, rowShort: 14,
} as const

export interface Row { [k: string]: string }

export interface BuilderUser {
  plan?: string | null
  planName?: string
  isOwner?: boolean
  modificationsLeft?: number
  entitlements?: { cinematic?: boolean }
  cv?: { slug?: string } | null
}

export const ROWDEF: Record<string, [string, string][]> = {
  characteristics: [['name', 'Libellé'], ['value', 'Valeur']],
  stats:    [['label', 'Libellé'], ['value', 'Valeur'], ['unit', 'Unité']],
  palmares: [['icon', '🏆'], ['name', 'Titre'], ['count', 'Année/×'], ['detail', 'Détail']],
  career:   [['year', 'Année'], ['club', 'Étape'], ['detail', 'Détail']],
  videos:   [['title', 'Titre de la vidéo'], ['url', 'Lien vidéo (URL / MP4)']],
}

const MAX_ROWS = 12

export function cropTf(x = 50, y = 50, z = 1.4) {
  const m = (z - 1) / 2 * 100
  return `translate(${(m * (1 - x / 50)).toFixed(2)}%,${(m * (1 - y / 50)).toFixed(2)}%) scale(${z})`
}

export type RowSection = 'characteristics' | 'stats' | 'palmares' | 'career' | 'videos'

/** Lignes dynamiques bornées (12 max) — libellés et valeurs à longueur limitée. */
export function DynRows({ kind, rows, onChange }: { kind: RowSection; rows: Row[]; onChange: (rows: Row[]) => void }) {
  function update(i: number, k: string, v: string) {
    onChange(rows.map((r, j) => j === i ? { ...r, [k]: v } : r))
  }
  function remove(i: number) { onChange(rows.filter((_, j) => j !== i)) }
  function add() {
    if (rows.length >= MAX_ROWS) return
    const e: Row = {}; ROWDEF[kind].forEach(([k]) => e[k] = ''); onChange([...rows, e])
  }

  if (kind === 'videos') {
    return (
      <>
        <div className="stat-rows" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((row, i) => {
            const rawUrl = (row.url || '').trim();
            const rawTitle = (row.title || '').trim();
            const isUrlValid = Boolean(rawUrl || rawTitle.startsWith('http') || rawTitle.includes('youtu') || rawTitle.includes('vimeo'));

            return (
              <div key={i} className="stat-row videos-row" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.03)',
                border: isUrlValid ? '1px solid rgba(121, 224, 207, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'border-color 0.2s ease'
              }}>
                {/* Ligne 1 : URL / Lien vidéo + Uploader MP4 + Supprimer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', flexWrap: 'wrap' }}>
                  <input
                    className="mini"
                    type="url"
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="Coller le lien (YouTube, Vimeo, MP4...)"
                    value={row.url || ''}
                    maxLength={LIMITS.url}
                    onChange={(e) => {
                      const val = e.target.value;
                      update(i, 'url', val);
                    }}
                    style={{ flex: 1, minWidth: '200px' }}
                  />
                  <VideoUploadButton onUploadSuccess={(url) => update(i, 'url', url)} />
                  <button type="button" className="icon-btn" title="Supprimer la vidéo" onClick={() => remove(i)}>✕</button>
                </div>

                {/* Ligne 2 : Titre de la vidéo (Optionnel) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  <input
                    className="mini"
                    placeholder="Titre de la vidéo (ex: Highlights 2025/2026)"
                    value={row.title || ''}
                    maxLength={LIMITS.rowText}
                    onChange={(e) => update(i, 'title', e.target.value)}
                    style={{ flex: 1, width: '100%' }}
                  />
                </div>

                {/* Badge visuel de validation */}
                {isUrlValid && (
                  <div style={{ fontSize: '0.75rem', color: '#79e0cf', display: 'flex', alignItems: 'center', gap: 4, marginTop: -2 }}>
                    <span>✓ Lien vidéo prêt et valide</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button type="button" className="btn btn-ghost" onClick={add}
          disabled={rows.length >= MAX_ROWS}
          style={{ padding: '8px 16px', marginTop: 8, opacity: rows.length >= MAX_ROWS ? 0.5 : 1 }}>
          + Ajouter une vidéo {rows.length >= MAX_ROWS && `(max ${MAX_ROWS})`}
        </button>
      </>
    );
  }

  return (
    <>
      <div className="stat-rows">
        {rows.map((row, i) => (
          <div key={i} className={`stat-row ${kind}-row`}>
            {ROWDEF[kind].map(([k, ph]) => {
              const short = k === 'icon' || k === 'unit' || k === 'count'
              return (
                <input key={k} className="mini" placeholder={ph} value={row[k] || ''}
                  maxLength={short ? LIMITS.rowShort : LIMITS.rowText}
                  onChange={(e) => update(i, k, e.target.value)}
                  style={short ? { maxWidth: 90 } : undefined}
                />
              )
            })}
            <button type="button" className="icon-btn" title="Supprimer" onClick={() => remove(i)}>✕</button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-ghost" onClick={add}
        disabled={rows.length >= MAX_ROWS}
        style={{ padding: '8px 16px', marginTop: 8, opacity: rows.length >= MAX_ROWS ? 0.5 : 1 }}>
        + Ajouter {rows.length >= MAX_ROWS && `(max ${MAX_ROWS})`}
      </button>
    </>
  )
}

function VideoUploadButton({ onUploadSuccess }: { onUploadSuccess: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 150 * 1024 * 1024) {
      alert("La vidéo dépasse la limite de 150 Mo. Pour des séquences plus longues, privilégie un lien YouTube ou Vimeo.")
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('video', file)
      const res = await uploadVideo(fd)
      if ('error' in res) {
        alert(res.error)
      } else if (res.url) {
        onUploadSuccess(res.url)
      }
    } catch {
      alert("Erreur lors de l'envoi de la vidéo.")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        style={{ padding: '6px 10px', fontSize: '0.75rem', whiteSpace: 'nowrap', borderRadius: 6, border: '1px solid var(--border)' }}
      >
        {uploading ? '⏳ Envoi...' : '📁 Importer MP4 (150 Mo max)'}
      </button>
    </>
  )
}

/** Upload + recadrage par glisser (position) et zoom borné [1 ; 2]. */
/** Upload + recadrage par glisser (position) et zoom borné [1 ; 2]. */
export function CropBox({
  label, hint, src, posX, posY, zoom, circle, targetUserId,
  onPosChange, onZoomChange, onFile,
}: {
  label: string; hint: string
  src: string; posX: number; posY: number; zoom: number; circle?: boolean; targetUserId?: string
  onPosChange: (x: number, y: number) => void
  onZoomChange: (z: number) => void
  onFile: (url: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; sx: number; sy: number } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setUploadErr("Taille max : 2 Mo.")
      return
    }
    setUploading(true); setUploadErr('')
    const fd = new FormData()
    fd.append('image', file)
    if (targetUserId) {
      fd.append('targetUserId', targetUserId)
    }
    const result = await uploadImage(fd)
    setUploading(false)
    if ('error' in result) { setUploadErr(result.error); return }
    onFile(result.url)
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!src) return
    drag.current = { x: e.clientX, y: e.clientY, sx: posX, sy: posY }
    boxRef.current?.setPointerCapture(e.pointerId)
    boxRef.current?.classList.add('dragging')
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current || !boxRef.current) return
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y
    const vx = Math.max(0, Math.min(100, Math.round(drag.current.sx - dx / boxRef.current.offsetWidth * 250)))
    const vy = Math.max(0, Math.min(100, Math.round(drag.current.sy - dy / boxRef.current.offsetHeight * 250)))
    onPosChange(vx, vy)
  }
  function onPointerUp() { drag.current = null; boxRef.current?.classList.remove('dragging') }
  function adjustZoom(d: number) {
    onZoomChange(Math.max(1.0, Math.min(2.0, parseFloat((zoom + d).toFixed(2)))))
  }

  return (
    <div className="field">
      <label>{label}</label>
      <input ref={fileRef} type="file" accept="image/*" className="file-input" onChange={handleFile} />
      <div ref={boxRef} className={`crop-box${circle ? ' circle' : ' wide'}`} style={{ position: 'relative' }}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
      >
        {uploading && <div className="ph">Envoi…</div>}
        {!uploading && src && (
          <>
            <Image src={src} alt="" fill unoptimized style={{ objectFit: 'cover', transform: cropTf(posX, posY, zoom), transformOrigin: 'center' }} />
            <span className="grip">✛ glisse</span>
          </>
        )}
        {!uploading && !src && <div className="ph">{hint}</div>}
      </div>
      {uploadErr && <p style={{ color: 'var(--error, #ff6b6b)', fontSize: '.8rem', marginTop: 4 }}>{uploadErr}</p>}
      <div className="crop-zoom-ctrl">
        <button type="button" className="crop-zoom-btn" onClick={() => adjustZoom(-0.1)}>−</button>
        <span className="crop-zoom-val">{zoom.toFixed(2)}×</span>
        <button type="button" className="crop-zoom-btn" onClick={() => adjustZoom(0.1)}>+</button>
      </div>
      {src && (
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 10, marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--muted)' }}>
            <span>Axe X :</span>
            <input 
              type="number" 
              min="0" 
              max="100" 
              value={posX} 
              onChange={(e) => onPosChange(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)), posY)}
              style={{ width: 55, background: 'var(--bg-2, #0d1527)', border: '1px solid var(--border, rgba(255, 255, 255, 0.08))', color: '#fff', borderRadius: 6, padding: '4px 6px', textAlign: 'center', outline: 'none' }}
            />
            <span>%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--muted)' }}>
            <span>Axe Y :</span>
            <input 
              type="number" 
              min="0" 
              max="100" 
              value={posY} 
              onChange={(e) => onPosChange(posX, Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
              style={{ width: 55, background: 'var(--bg-2, #0d1527)', border: '1px solid var(--border, rgba(255, 255, 255, 0.08))', color: '#fff', borderRadius: 6, padding: '4px 6px', textAlign: 'center', outline: 'none' }}
            />
            <span>%</span>
          </div>
        </div>
      )}
      <div className="crop-hint">✛ Glisse l&apos;image pour cadrer</div>
    </div>
  )
}

/** Compteur de caractères — la contrainte rendue visible. */
export function CharCount({ value, max }: { value: string; max: number }) {
  return (
    <div className={`char-count${value.length >= max ? ' limit' : ''}`}>
      {value.length}/{max}
    </div>
  )
}

export interface BuilderAlertState { msg: string; ok: boolean; link?: string; slug?: string }

/**
 * État unique du CV en cours d'édition, partagé par les deux builders.
 * `nextPath` : page renvoyée au login si la session manque.
 */
export function useCvBuilder(nextPath: string) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const targetUserId = searchParams.get('u') || undefined
  const cvId = searchParams.get('cv') || undefined
  const [user, setUser] = useState<BuilderUser | null>(null)
  const [saving, setSaving] = useState(false)
  const [alertMsg, setAlertMsg] = useState<BuilderAlertState | null>(null)

  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [sport, setSport] = useState('Football')
  const [discipline, setDiscipline] = useState('')
  const [bio, setBio] = useState('')
  const [tagline, setTagline] = useState('')
  const [location, setLocation] = useState('')
  const [colorA, setColorA] = useState('#c6f932')
  const [colorB, setColorB] = useState('#5cf0c0')
  const [instagram, setInstagram] = useState('')
  const [xUrl, setXUrl] = useState('')
  const [visibility, setVisibility] = useState('private')
  const [avatar, setAvatar] = useState('')
  const [photoPosX, setPhotoPosX] = useState(50)
  const [photoPosY, setPhotoPosY] = useState(50)
  const [cropZoomAvatar, setCropZoomAvatar] = useState(1.4)
  const [cineBg, setCineBg] = useState('')
  const [cineBgPosX, setCineBgPosX] = useState(50)
  const [cineBgPosY, setCineBgPosY] = useState(50)
  const [cropZoomCineBg, setCropZoomCineBg] = useState(1.25)
  const [cineImages, setCineImages] = useState<Array<{ url: string; posX: number; posY: number; zoom: number }>>([])
  const [stats, setStats] = useState<Row[]>([{ label: '', value: '', unit: '' }])
  const [palmares, setPalmares] = useState<Row[]>([{ icon: '🏆', name: '', count: '', detail: '' }])
  const [career, setCareer] = useState<Row[]>([{ year: '', club: '', detail: '' }])
  const [videos, setVideos] = useState<Row[]>([{ title: '', url: '' }])
  const [characteristics, setCharacteristics] = useState<Row[]>([
    { name: 'Nationalité', value: '' },
    { name: 'Né le', value: '' },
    { name: 'Taille', value: '' },
    { name: 'Poids', value: '' },
    { name: 'Club actuel', value: '' },
    { name: 'Numéro', value: '' }
  ])
  const [showCharacteristics, setShowCharacteristics] = useState(false)
  const [showSections, setShowSections] = useState<Record<string, boolean>>({
    stats: true,
    palmares: true,
    career: true,
    bio: true
  })
  const [birthDate, setBirthDate] = useState('')
  const [nationality, setNationality] = useState('')
  const [eligibility, setEligibility] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  // Auth + pré-remplissage depuis la DB
  useEffect(() => {
    getMyProfile(targetUserId).then((p) => {
      if (!p) { router.push(`/login?next=${encodeURIComponent(nextPath)}`); return }
      setUser({
        plan: p.plan, planName: PLAN_LABEL[p.plan] ?? p.plan,
        isOwner: p.isOwner,
        modificationsLeft: -1,
        entitlements: { cinematic: p.cinematic },
        cv: null,
      })
    })
    getMyCv(targetUserId, cvId).then((cv) => {
      if (!cv) return
      setUser((u) => u ? { ...u, cv: { slug: cv.slug } } : u)
      setFirst(cv.first || '')
      setLast(cv.last || '')
      let s = cv.sport || 'Football'
      if (s === 'Basketball') s = 'Basket'
      setSport(s)
      setDiscipline(cv.discipline || '')
      setBio(cv.bio || '')
      setTagline(cv.tagline || '')
      setLocation(cv.location || '')
      setColorA(cv.colors?.a || SPORTS[s]?.a || '#c6f932')
      setColorB(cv.colors?.b || SPORTS[s]?.b || '#5cf0c0')
      setAvatar(cv.avatar || '')
      setPhotoPosX(cv.photoPosX ?? 50)
      setPhotoPosY(cv.photoPosY ?? 50)
      setCropZoomAvatar(cv.cropZoomAvatar ?? 1.4)
      setCineBg(cv.cineBg || '')
      setCineBgPosX(cv.cineBgPosX ?? 50)
      setCineBgPosY(cv.cineBgPosY ?? 50)
      setCropZoomCineBg(cv.cropZoomCineBg ?? 1.25)

      let initialImages = cv.cineImages ?? []
      if (initialImages.length === 0 && cv.cineBg) {
        initialImages = [{
          url: cv.cineBg,
          posX: cv.cineBgPosX ?? 50,
          posY: cv.cineBgPosY ?? 50,
          zoom: cv.cropZoomCineBg ?? 1.25
        }]
      }
      setCineImages(initialImages)
      if ((cv.stats as Row[])?.length) setStats(cv.stats as Row[])
      if ((cv.palmares as Row[])?.length) setPalmares(cv.palmares as Row[])
      const loadedVideos = (Array.isArray(cv.videos) && (cv.videos as Row[]).length > 0)
        ? (cv.videos as Row[])
        : (cv.showSections && typeof cv.showSections === 'object' && Array.isArray((cv.showSections as Record<string, unknown>)._videos) && ((cv.showSections as Record<string, unknown>)._videos as Row[]).length > 0
            ? ((cv.showSections as Record<string, unknown>)._videos as Row[])
            : []);
      if (loadedVideos.length > 0) setVideos(loadedVideos);
      const lks = (cv.links as Array<{ label: string; icon: string; url: string }> | undefined) ?? []
      setInstagram(lks.find((l) => l.icon === 'instagram')?.url || '')
      setXUrl(lks.find((l) => l.icon === 'x')?.url || '')
      setVisibility(cv.visibility || 'private')
      const charData = (cv.characteristics as Row[]) ?? []
      setCharacteristics(charData.length ? charData : [
        { name: 'Nationalité', value: '' },
        { name: 'Né le', value: '' },
        { name: 'Taille', value: '' },
        { name: 'Poids', value: '' },
        { name: 'Club actuel', value: '' },
        { name: 'Numéro', value: '' }
      ])
      setShowCharacteristics(!!cv.showCharacteristics)
      if (cv.showSections) {
        setShowSections({
          stats: cv.showSections.stats !== false,
          palmares: cv.showSections.palmares !== false,
          career: cv.showSections.career !== false,
          bio: cv.showSections.bio !== false
        })
      }
      setBirthDate(cv.birthDate || '')
      setNationality(cv.nationality || '')
      setEligibility(cv.eligibility || '')
      setContactPhone(cv.contactPhone || '')
      setContactEmail(cv.contactEmail || '')
    })
  }, [router, nextPath, targetUserId, cvId])

  /** Payload complet du CV (aperçu postMessage ET enregistrement). */
  const buildPayload = useCallback(() => ({
    first, last, sport,
    emoji: SPORTS[sport]?.emoji || '🏅',
    discipline, tagline, bio, location,
    avatar: avatar || undefined,
    photoPosX, photoPosY, cropZoomAvatar,
    cineBg: cineBg || undefined,
    cineBgPosX, cineBgPosY, cropZoomCineBg,
    colors: { a: colorA, b: colorB },
    verified: true,
    stats: stats.filter((r) => Object.values(r).some((v) => v?.trim())),
    palmares: palmares.filter((r) => Object.values(r).some((v) => v?.trim())),
    career: career.filter((r) => Object.values(r).some((v) => v?.trim())),
    videos: videos.filter((r) => Object.values(r).some((v) => v?.trim())),
    links: [
      instagram && { label: 'Instagram', icon: 'instagram', url: instagram },
      xUrl && { label: 'X', icon: 'x', url: xUrl },
    ].filter(Boolean),
    visibility, slug: user?.cv?.slug,
    characteristics: characteristics.filter((r) => r.name?.trim() && r.value?.trim()),
    showCharacteristics,
    showSections,
    birthDate: birthDate || undefined,
    nationality: nationality || undefined,
    eligibility: eligibility || undefined,
    contactPhone: contactPhone || undefined,
    contactEmail: contactEmail || undefined,
  }), [first, last, sport, discipline, tagline, bio, location, avatar,
       photoPosX, photoPosY, cropZoomAvatar, cineBg, cineBgPosX, cineBgPosY, cropZoomCineBg,
       cineImages,
       colorA, colorB, stats, palmares, career, videos, instagram, xUrl, visibility, user?.cv?.slug,
       characteristics, showCharacteristics, showSections,
       birthDate, nationality, eligibility, contactPhone, contactEmail])

  async function save() {
    if (!first || !last) {
      setAlertMsg({ msg: 'Renseigne au moins ton prénom et ton nom.', ok: false })
      return
    }
    setSaving(true)
    const result = await upsertCv({
      first, last, sport, discipline: discipline || undefined,
      tagline: tagline || undefined, bio: bio || undefined, location: location || undefined,
      colors: { a: colorA, b: colorB },
      avatar: avatar || undefined, photoPosX, photoPosY, cropZoomAvatar,
      cineBg: cineBg || undefined, cineBgPosX, cineBgPosY, cropZoomCineBg,
      cineImages,
      stats: stats.filter((r) => Object.values(r).some((v) => v?.trim())),
      palmares: palmares.filter((r) => Object.values(r).some((v) => v?.trim())),
      career: career.filter((r) => Object.values(r).some((v) => v?.trim())),
      videos: videos.filter((r) => Object.values(r).some((v) => v?.trim())) as Array<{ title: string; url: string }>,
      links: [
        instagram && { label: 'Instagram', icon: 'instagram', url: instagram },
        xUrl && { label: 'X', icon: 'x', url: xUrl },
      ].filter(Boolean) as unknown[],
      visibility: visibility as 'private' | 'public',
      characteristics: characteristics.filter((r) => r.name?.trim() && r.value?.trim()) as Array<{ name: string; value: string }>,
      showCharacteristics,
      targetUserId,
      cvId,
      showSections,
      birthDate: birthDate || undefined,
      nationality: nationality || undefined,
      eligibility: eligibility || undefined,
      contactPhone: contactPhone || undefined,
      contactEmail: contactEmail || undefined,
    })
    setSaving(false)
    if (result.error) { setAlertMsg({ msg: result.error, ok: false }); return }
    const slug = result.slug!
    const link = `${window.location.origin}/${slug}`
    setUser((u) => u ? { ...u, cv: { slug } } : u)
    setAlertMsg({ msg: 'Répertoire enregistré !', ok: true, link, slug })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return {
    user, saving, alertMsg, setAlertMsg, save, buildPayload,
    first, setFirst, last, setLast, sport, setSport, discipline, setDiscipline,
    bio, setBio, tagline, setTagline, location, setLocation,
    colorA, setColorA, colorB, setColorB,
    instagram, setInstagram, xUrl, setXUrl,
    visibility, setVisibility,
    avatar, setAvatar, photoPosX, setPhotoPosX, photoPosY, setPhotoPosY,
    cropZoomAvatar, setCropZoomAvatar,
    cineBg, setCineBg, cineBgPosX, setCineBgPosX, cineBgPosY, setCineBgPosY,
    cropZoomCineBg, setCropZoomCineBg,
    cineImages, setCineImages,
    stats, setStats, palmares, setPalmares, career, setCareer, videos, setVideos,
    characteristics, setCharacteristics, showCharacteristics, setShowCharacteristics,
    targetUserId, cvId, showSections, setShowSections,
    birthDate, setBirthDate, nationality, setNationality, eligibility, setEligibility,
    contactPhone, setContactPhone, contactEmail, setContactEmail,
  }
}
