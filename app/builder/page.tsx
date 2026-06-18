'use client'

import { useEffect, useRef, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getMyProfile } from '@/app/actions/auth'

const PLAN_LABEL: Record<string, string> = {
  free: 'Aucune offre', starter: 'Starter', pro: 'Pro', club: 'Club',
}

const SPORTS: Record<string, { emoji: string; a: string; b: string }> = {
  Football:   { emoji: '⚽', a: '#c6f932', b: '#5cf0c0' },
  Basketball: { emoji: '🏀', a: '#ff7a45', b: '#ffb347' },
  Tennis:     { emoji: '🎾', a: '#ff9f45', b: '#ffd23f' },
  Volley:     { emoji: '🏐', a: '#38d8ff', b: '#7c5cff' },
  'Athlétisme': { emoji: '⚡', a: '#ffd23f', b: '#34d399' },
  Rugby:      { emoji: '🏉', a: '#8b5cff', b: '#38d8ff' },
  Autre:      { emoji: '🏅', a: '#b08d57', b: '#d8b87a' },
}

interface Row { [k: string]: string }
interface CvData {
  first?: string; last?: string; sport?: string; emoji?: string
  discipline?: string; tagline?: string; location?: string
  avatar?: string; photoPosX?: number; photoPosY?: number; cropZoomAvatar?: number
  cineBg?: string; cineBgPosX?: number; cineBgPosY?: number; cropZoomCineBg?: number
  colors?: { a: string; b: string }; verified?: boolean
  stats?: Row[]; palmares?: Row[]; career?: Row[]
  links?: { label: string; icon: string; url: string }[]
  visibility?: string; slug?: string
}
interface User {
  plan?: string | null; planName?: string; modificationsLeft?: number
  entitlements?: { cinematic?: boolean }; cv?: { slug?: string } | null
}

const ROWDEF: Record<string, [string, string][]> = {
  stats:    [['label', 'Libellé'], ['value', 'Valeur'], ['unit', 'Unité']],
  palmares: [['icon', '🏆'], ['name', 'Titre'], ['count', '×']],
  career:   [['year', 'Année'], ['club', 'Étape'], ['detail', 'Détail']],
}

function cropTf(x = 50, y = 50, z = 1.4) {
  const m = (z - 1) / 2 * 100
  return `translate(${(m * (1 - x / 50)).toFixed(2)}%,${(m * (1 - y / 50)).toFixed(2)}%) scale(${z})`
}

type RowSection = 'stats' | 'palmares' | 'career'

function DynRows({ kind, rows, onChange }: { kind: RowSection; rows: Row[]; onChange: (rows: Row[]) => void }) {
  function update(i: number, k: string, v: string) {
    const next = rows.map((r, j) => j === i ? { ...r, [k]: v } : r)
    onChange(next)
  }
  function remove(i: number) { onChange(rows.filter((_, j) => j !== i)) }
  function add() { const empty: Row = {}; ROWDEF[kind].forEach(([k]) => empty[k] = ''); onChange([...rows, empty]) }

  return (
    <>
      <div className="stat-rows">
        {rows.map((row, i) => (
          <div key={i} className="stat-row">
            {ROWDEF[kind].map(([k, ph]) => (
              <input
                key={k}
                className="mini"
                placeholder={ph}
                value={row[k] || ''}
                onChange={(e) => update(i, k, e.target.value)}
                style={k === 'icon' || k === 'unit' || k === 'count' ? { maxWidth: 90 } : undefined}
              />
            ))}
            <button type="button" className="icon-btn" title="Supprimer" onClick={() => remove(i)}>✕</button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-ghost" onClick={add} style={{ padding: '8px 16px', marginTop: 8 }}>
        + Ajouter
      </button>
    </>
  )
}

function CropBox({
  id, label, hint, src, posX, posY, zoom, circle,
  onPosChange, onZoomChange, onFile,
}: {
  id: string; label: string; hint: string
  src: string; posX: number; posY: number; zoom: number; circle?: boolean
  onPosChange: (x: number, y: number) => void
  onZoomChange: (z: number) => void
  onFile: (url: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; sx: number; sy: number } | null>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('image', file)
      const r = await fetch('/api/upload', { method: 'POST', body: fd })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      onFile(j.url)
    } catch {}
    setUploading(false)
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
  function onPointerUp() {
    drag.current = null
    boxRef.current?.classList.remove('dragging')
  }

  function adjustZoom(d: number) {
    onZoomChange(Math.max(1.0, Math.min(2.0, parseFloat((zoom + d).toFixed(2)))))
  }

  return (
    <div className="field">
      <label>{label}</label>
      <input ref={fileRef} type="file" accept="image/*" className="file-input" onChange={handleFile} />
      <div
        ref={boxRef}
        className={`crop-box${circle ? ' circle' : ' wide'}`}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
      >
        {uploading && <div className="ph">Envoi…</div>}
        {!uploading && src && (
          <>
            <img src={src} style={{ transform: cropTf(posX, posY, zoom), transformOrigin: 'center' }} alt="" />
            <span className="grip">✛ glisse</span>
          </>
        )}
        {!uploading && !src && <div className="ph">{hint}</div>}
      </div>
      <div className="crop-zoom-ctrl">
        <button type="button" className="crop-zoom-btn" onClick={() => adjustZoom(-0.1)}>−</button>
        <span className="crop-zoom-val">{zoom.toFixed(2)}×</span>
        <button type="button" className="crop-zoom-btn" onClick={() => adjustZoom(0.1)}>+</button>
      </div>
      <div className="crop-hint">✛ Glisse l&apos;image pour viser le visage</div>
    </div>
  )
}

function BuilderContent() {
  const router = useRouter()
  const params = useSearchParams()
  const welcome = params.has('welcome')

  const [user, setUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [alertMsg, setAlertMsg] = useState<{ msg: string; ok: boolean; link?: string; slug?: string } | null>(null)
  const [previewReady, setPreviewReady] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Form state
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [sport, setSport] = useState('Football')
  const [discipline, setDiscipline] = useState('')
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
  const [stats, setStats] = useState<Row[]>([{ label: '', value: '', unit: '' }])
  const [palmares, setPalmares] = useState<Row[]>([{ icon: '🏆', name: '', count: '' }])
  const [career, setCareer] = useState<Row[]>([{ year: '', club: '', detail: '' }])

  function buildCv(): CvData {
    return {
      first, last, sport,
      emoji: SPORTS[sport]?.emoji || '🏅',
      discipline, tagline, location,
      avatar: avatar || undefined,
      photoPosX, photoPosY, cropZoomAvatar,
      cineBg: cineBg || undefined,
      cineBgPosX, cineBgPosY, cropZoomCineBg,
      colors: { a: colorA, b: colorB },
      verified: true,
      stats: stats.filter((r) => Object.values(r).some((v) => v?.trim())),
      palmares: palmares.filter((r) => Object.values(r).some((v) => v?.trim())),
      career: career.filter((r) => Object.values(r).some((v) => v?.trim())),
      links: [
        instagram && { label: 'Instagram', icon: 'instagram', url: instagram },
        xUrl && { label: 'X', icon: 'x', url: xUrl },
      ].filter(Boolean) as CvData['links'],
    }
  }

  const syncPreview = useCallback(() => {
    if (!previewReady || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({ type: 'acv-cv', cv: buildCv() }, '*')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewReady, first, last, sport, discipline, tagline, location, colorA, colorB, avatar, photoPosX, photoPosY, cropZoomAvatar, cineBg, cineBgPosX, cineBgPosY, cropZoomCineBg, stats, palmares, career])

  useEffect(() => { syncPreview() }, [syncPreview])

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data?.type === 'acv-preview-ready') setPreviewReady(true)
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  // Auth & droits : lus côté serveur (cookies httpOnly). Le middleware garantit
  // déjà qu'on est connecté ici ; un free sans offre est renvoyé vers /tarifs.
  useEffect(() => {
    getMyProfile().then((p) => {
      if (!p) { router.push('/login?next=/builder'); return }
      if (p.plan === 'free' && !p.isOwner) { router.push('/tarifs'); return }
      setUser({
        plan: p.plan,
        planName: PLAN_LABEL[p.plan],
        modificationsLeft: p.isOwner ? -1 : 0,
        entitlements: { cinematic: p.cinematic },
        cv: null,
      })
    })
    // Le pré-remplissage du CV existant sera branché sur la table `cvs`
    // à l'incrément suivant (CV CRUD + Supabase Storage pour les images).
  }, [router])

  async function save() {
    if (!first || !last) {
      setAlertMsg({ msg: 'Renseigne au moins ton prénom et ton nom.', ok: false })
      return
    }
    // CV CRUD branché à l'incrément suivant (Server Action sur la table `cvs`).
    setAlertMsg({
      msg: "Compte & accès opérationnels ✓ — l'enregistrement du CV (table cvs + upload d'images) arrive à l'incrément suivant.",
      ok: true,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!user) {
    return <div className="app-wrap"><div className="app-head"><h1>Chargement…</h1></div></div>
  }

  const modsTxt = user.modificationsLeft === -1 ? 'illimitées' : (user.modificationsLeft ?? 0) + ' modifications restantes'
  const hasCine = user.entitlements?.cinematic
  const cvSlug = user.cv?.slug

  function onSportChange(s: string) {
    setSport(s)
    const def = SPORTS[s] || SPORTS.Autre
    setColorA(def.a)
    setColorB(def.b)
  }

  return (
    <div className="app-wrap wide">
      <div className="app-head" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <span className="tag">Mon répertoire</span>
          <h1>Construis ta page.</h1>
          <p>{user.planName || ''} · <strong>{modsTxt}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', color: 'var(--text)', borderRadius: 4, padding: '12px 14px', fontFamily: 'var(--font-body)' }}
          >
            <option value="private">🔒 Privé (lien seulement)</option>
            <option value="public">🌐 Public (visible en recherche)</option>
          </select>
          {hasCine && cvSlug && (
            <Link className="btn btn-ghost" href={`/cine?u=${cvSlug}`} target="_blank">🎬 Cinématique</Link>
          )}
          <Link className="btn btn-ghost" href="/profil?me=1" target="_blank">Voir ma page ↗</Link>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {welcome && !alertMsg && (
        <div className="alert ok" style={{ marginBottom: 14 }}>
          Bienvenue ! Construis ton répertoire ci-dessous puis clique sur &laquo; Enregistrer &raquo;.
        </div>
      )}

      {alertMsg && (
        <div className={`alert ${alertMsg.ok ? 'ok' : 'err'}`} style={{ marginBottom: 14 }}>
          {alertMsg.msg}
          {alertMsg.link && (
            <>
              {' '}Ton lien :{' '}
              <a href={alertMsg.link} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                {alertMsg.link}
              </a>
              {' '}
              <button className="mini-btn" type="button" onClick={() => navigator.clipboard.writeText(alertMsg.link!)}>
                Copier
              </button>
              {hasCine && alertMsg.slug && (
                <>
                  {' · '}
                  <a href={`/cine?u=${alertMsg.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                    🎬 Mode cinématique
                  </a>
                </>
              )}
            </>
          )}
        </div>
      )}

      <div className="builder-grid">
        <div>
          {/* Identité */}
          <div className="app-card" style={{ padding: 30 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 16 }}>Identité</h3>
            <div className="row2">
              <div className="field"><label>Prénom</label><input value={first} onChange={(e) => setFirst(e.target.value)} /></div>
              <div className="field"><label>Nom</label><input value={last} onChange={(e) => setLast(e.target.value)} /></div>
            </div>
            <div className="row2">
              <div className="field">
                <label>Sport</label>
                <select value={sport} onChange={(e) => onSportChange(e.target.value)}>
                  {Object.keys(SPORTS).map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Discipline / poste</label>
                <input value={discipline} onChange={(e) => setDiscipline(e.target.value)} placeholder="Ailier, Sprint…" />
              </div>
            </div>
            <div className="field">
              <label>Accroche</label>
              <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Une phrase qui te définit" />
            </div>
            <div className="row2">
              <div className="field">
                <label>Localisation</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Paris, France" />
              </div>
              <CropBox
                id="avatar" label="Photo de profil" hint="Aucune photo" circle
                src={avatar} posX={photoPosX} posY={photoPosY} zoom={cropZoomAvatar}
                onPosChange={(x, y) => { setPhotoPosX(x); setPhotoPosY(y) }}
                onZoomChange={setCropZoomAvatar}
                onFile={setAvatar}
              />
            </div>
            <div className="row2">
              <div className="field">
                <label>Couleur 1</label>
                <input type="color" value={colorA} onChange={(e) => setColorA(e.target.value)} style={{ height: 46, padding: 4 }} />
              </div>
              <div className="field">
                <label>Couleur 2</label>
                <input type="color" value={colorB} onChange={(e) => setColorB(e.target.value)} style={{ height: 46, padding: 4 }} />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="app-card" style={{ padding: 30, marginTop: 18 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 14 }}>Statistiques</h3>
            <DynRows kind="stats" rows={stats} onChange={setStats} />
          </div>

          {/* Palmares */}
          <div className="app-card" style={{ padding: 30, marginTop: 18 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 14 }}>Palmarès</h3>
            <DynRows kind="palmares" rows={palmares} onChange={setPalmares} />
          </div>

          {/* Career */}
          <div className="app-card" style={{ padding: 30, marginTop: 18 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 14 }}>Parcours</h3>
            <DynRows kind="career" rows={career} onChange={setCareer} />
          </div>

          {/* Réseaux */}
          <div className="app-card" style={{ padding: 30, marginTop: 18 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 16 }}>Réseaux</h3>
            <div className="field">
              <label>Instagram (URL)</label>
              <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/…" />
            </div>
            <div className="field">
              <label>X (URL)</label>
              <input value={xUrl} onChange={(e) => setXUrl(e.target.value)} placeholder="https://x.com/…" />
            </div>
          </div>

          {/* Cinématique (Pro only) */}
          {hasCine && (
            <div className="app-card" style={{ padding: 30, marginTop: 18, borderColor: 'rgba(139,182,255,0.4)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 6 }}>
                🎬 Mode cinématique{' '}
                <span style={{ fontSize: '.65rem', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 3, padding: '2px 7px', verticalAlign: 'middle' }}>PRO</span>
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '.86rem', marginBottom: 16 }}>
                Personnalise ton écran immersif. Laisse vide pour réutiliser ta photo de profil.
              </p>
              <CropBox
                id="cineBg" label="Image de fond plein écran" hint="Réutilise la photo de profil si vide"
                src={cineBg} posX={cineBgPosX} posY={cineBgPosY} zoom={cropZoomCineBg}
                onPosChange={(x, y) => { setCineBgPosX(x); setCineBgPosY(y) }}
                onZoomChange={setCropZoomCineBg}
                onFile={setCineBg}
              />
              {cvSlug ? (
                <Link className="btn btn-ghost" href={`/cine?u=${cvSlug}`} target="_blank" style={{ marginTop: 4 }}>
                  Ouvrir mon cinématique ↗
                </Link>
              ) : (
                <p style={{ color: 'var(--muted-2)', fontSize: '.82rem' }}>
                  Enregistre une première fois pour obtenir ton lien cinématique.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Live preview */}
        <div className="preview-box">
          <div className="pb-head">
            <span>Aperçu en direct</span>
            <div className="pb-sizes">
              <button type="button" onClick={(e) => { if (iframeRef.current) iframeRef.current.style.width = '390px'; document.querySelectorAll('.pb-sizes button').forEach((b) => b.classList.toggle('active', b === e.currentTarget)) }} className="active" title="Vue mobile">📱</button>
              <button type="button" onClick={(e) => { if (iframeRef.current) iframeRef.current.style.width = '100%'; document.querySelectorAll('.pb-sizes button').forEach((b) => b.classList.toggle('active', b === e.currentTarget)) }} title="Vue large">🖥️</button>
            </div>
          </div>
          <div className="pb-frame">
            <iframe ref={iframeRef} id="preview" src="/profil?preview=1" style={{ width: 390 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BuilderPage() {
  return <Suspense fallback={null}><BuilderContent /></Suspense>
}
