'use client'

/**
 * /builder/classique — Éditeur dédié du CV classique (page publique).
 * Formulaire par sections numérotées + aperçu en direct (iframe postMessage).
 * Le mode cinématique a son propre espace : /builder/cinematique.
 */

import { useCallback, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import {
  useCvBuilder, DynRows, CropBox, CharCount,
  SPORTS, COLOR_PRESETS, LIMITS,
} from '@/components/builder/shared'

function ClassiqueContent() {
  const b = useCvBuilder('/builder/classique')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const previewReady = useRef(false)

  // `b` est un objet neuf à chaque rendu ; seul `buildPayload` (mémoïsé dans
  // useCvBuilder) doit déclencher la resynchronisation de l'aperçu.
  const syncPreview = useCallback(() => {
    if (!previewReady.current || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({ type: 'acv-cv', cv: b.buildPayload() }, '*')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b.buildPayload])

  useEffect(() => { syncPreview() }, [syncPreview])

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data?.type === 'acv-preview-ready') { previewReady.current = true; syncPreview() }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!b.user) {
    return <div className="app-wrap"><div className="app-head"><h1>Chargement…</h1></div></div>
  }

  const cvSlug = b.user.cv?.slug

  function onSportChange(s: string) {
    b.setSport(s)
    const def = SPORTS[s] || SPORTS.Autre
    b.setColorA(def.a); b.setColorB(def.b)
  }

  return (
    <div className="app-wrap wide b-page">
      <div className="b-topbar">
        <div style={{ minWidth: 0 }}>
          <Link href="/builder" className="b-back">← Espaces de création</Link>
          <h1>📄 CV Classique</h1>
          <p>{b.user.planName || ''}</p>
        </div>
        <div className="b-actions">
          <select value={b.visibility} onChange={(e) => b.setVisibility(e.target.value)} aria-label="Visibilité">
            <option value="private">🔒 Privé (lien seulement)</option>
            <option value="public">🌐 Public (visible en recherche)</option>
          </select>
          <Link className="btn btn-ghost" href={cvSlug ? `/${cvSlug}` : '/profil?me=1'} target="_blank">Voir ma page ↗</Link>
          <button className="btn btn-primary" onClick={b.save} disabled={b.saving}>
            {b.saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {b.alertMsg && (
        <div className={`alert ${b.alertMsg.ok ? 'ok' : 'err'}`} style={{ marginBottom: 14 }}>
          {b.alertMsg.msg}
          {b.alertMsg.link && (
            <>
              {' '}Ton lien :{' '}
              <a href={b.alertMsg.link} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', overflowWrap: 'anywhere' }}>
                {b.alertMsg.link}
              </a>
              {' '}
              <button className="mini-btn" type="button" onClick={() => navigator.clipboard.writeText(b.alertMsg!.link!)}>
                Copier
              </button>
            </>
          )}
        </div>
      )}

      <div className="builder-grid">
        <div style={{ minWidth: 0 }}>
          {/* 1 — Identité */}
          <div className="app-card b-card">
            <div className="b-sec-head"><span className="b-sec-num">1</span><h3>Identité</h3></div>
            <div className="row2">
              <div className="field">
                <label>Prénom</label>
                <input value={b.first} maxLength={LIMITS.name} onChange={(e) => b.setFirst(e.target.value)} />
              </div>
              <div className="field">
                <label>Nom</label>
                <input value={b.last} maxLength={LIMITS.name} onChange={(e) => b.setLast(e.target.value)} />
              </div>
            </div>
            <div className="row2">
              <div className="field">
                <label>Sport</label>
                <select value={b.sport} onChange={(e) => onSportChange(e.target.value)}>
                  {Object.keys(SPORTS).map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Discipline / poste</label>
                <input value={b.discipline} maxLength={LIMITS.discipline} onChange={(e) => b.setDiscipline(e.target.value)} placeholder="Ailier, Sprint…" />
              </div>
            </div>
            <div className="field">
              <label>Accroche</label>
              <input value={b.tagline} maxLength={LIMITS.tagline} onChange={(e) => b.setTagline(e.target.value)} placeholder="Une phrase qui te définit" />
              <CharCount value={b.tagline} max={LIMITS.tagline} />
            </div>
            <div className="field">
              <label>Biographie</label>
              <textarea value={b.bio} maxLength={LIMITS.bio} onChange={(e) => b.setBio(e.target.value)}
                placeholder="Quelques lignes sur ton parcours, ta vision…" rows={4} />
              <CharCount value={b.bio} max={LIMITS.bio} />
            </div>
            <div className="row2">
              <div className="field">
                <label>Localisation</label>
                <input value={b.location} maxLength={LIMITS.location} onChange={(e) => b.setLocation(e.target.value)} placeholder="Paris, France" />
              </div>
              <CropBox label="Photo de profil" hint="Aucune photo" circle
                src={b.avatar} posX={b.photoPosX} posY={b.photoPosY} zoom={b.cropZoomAvatar}
                onPosChange={(x, y) => { b.setPhotoPosX(x); b.setPhotoPosY(y) }}
                onZoomChange={b.setCropZoomAvatar} onFile={b.setAvatar}
              />
            </div>
          </div>

          {/* 2 — Couleurs */}
          <div className="app-card b-card">
            <div className="b-sec-head"><span className="b-sec-num">2</span><h3>Couleurs</h3></div>
            <div className="field">
              <label>Duos prêts à l&apos;emploi</label>
              <div className="swatch-row">
                {COLOR_PRESETS.map((p) => (
                  <button key={p.name} type="button" title={p.name}
                    className={`swatch${b.colorA === p.a && b.colorB === p.b ? ' on' : ''}`}
                    style={{ background: `linear-gradient(120deg, ${p.a}, ${p.b})` }}
                    onClick={() => { b.setColorA(p.a); b.setColorB(p.b) }}
                  />
                ))}
              </div>
            </div>
            <div className="row2">
              <div className="field">
                <label>Couleur 1 (précise)</label>
                <input type="color" value={b.colorA} onChange={(e) => b.setColorA(e.target.value)} style={{ height: 46, padding: 4 }} />
              </div>
              <div className="field">
                <label>Couleur 2 (précise)</label>
                <input type="color" value={b.colorB} onChange={(e) => b.setColorB(e.target.value)} style={{ height: 46, padding: 4 }} />
              </div>
            </div>
          </div>

          {/* 3 — Statistiques */}
          <div className="app-card b-card">
            <div className="b-sec-head"><span className="b-sec-num">3</span><h3>Statistiques</h3></div>
            <DynRows kind="stats" rows={b.stats} onChange={b.setStats} />
          </div>

          {/* 4 — Palmarès */}
          <div className="app-card b-card">
            <div className="b-sec-head"><span className="b-sec-num">4</span><h3>Palmarès</h3></div>
            <DynRows kind="palmares" rows={b.palmares} onChange={b.setPalmares} />
          </div>

          {/* 5 — Parcours */}
          <div className="app-card b-card">
            <div className="b-sec-head"><span className="b-sec-num">5</span><h3>Parcours</h3></div>
            <DynRows kind="career" rows={b.career} onChange={b.setCareer} />
          </div>

          {/* 6 — Réseaux */}
          <div className="app-card b-card">
            <div className="b-sec-head"><span className="b-sec-num">6</span><h3>Réseaux</h3></div>
            <div className="field">
              <label>Instagram (URL)</label>
              <input value={b.instagram} maxLength={LIMITS.url} onChange={(e) => b.setInstagram(e.target.value)} placeholder="https://instagram.com/…" />
            </div>
            <div className="field">
              <label>X (URL)</label>
              <input value={b.xUrl} maxLength={LIMITS.url} onChange={(e) => b.setXUrl(e.target.value)} placeholder="https://x.com/…" />
            </div>
          </div>
        </div>

        {/* Aperçu en direct */}
        <div className="preview-box">
          <div className="pb-head">
            <span>Aperçu en direct</span>
            <div className="pb-sizes">
              <button type="button" className="active" title="Vue mobile"
                onClick={(e) => { if (iframeRef.current) iframeRef.current.style.width = '390px'; document.querySelectorAll('.pb-sizes button').forEach((btn) => btn.classList.toggle('active', btn === e.currentTarget)) }}>📱</button>
              <button type="button" title="Vue large"
                onClick={(e) => { if (iframeRef.current) iframeRef.current.style.width = '100%'; document.querySelectorAll('.pb-sizes button').forEach((btn) => btn.classList.toggle('active', btn === e.currentTarget)) }}>🖥️</button>
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

export default function BuilderClassiquePage() {
  return <Suspense fallback={null}><ClassiqueContent /></Suspense>
}
