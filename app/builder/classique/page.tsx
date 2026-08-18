'use client'

/**
 * /builder/classique — Éditeur dédié du CV classique (page publique).
 * Formulaire par sections numérotées + aperçu en direct (iframe postMessage).
 * Le mode cinématique a son propre espace : /builder/cinematique.
 */

import { useCallback, useEffect, useRef, useState, Suspense } from 'react'
import Link from 'next/link'
import {
  useCvBuilder, DynRows, CropBox, CharCount,
  SPORTS, COLOR_PRESETS, LIMITS,
} from '@/components/builder/shared'

const DISCIPLINES_BY_SPORT: Record<string, string[]> = {
  Football: [
    'Gardien de but',
    'Défenseur central',
    'Latéral gauche',
    'Latéral droit',
    'Milieu défensif',
    'Milieu relayeur',
    'Milieu offensif',
    'Ailier gauche',
    'Ailier droit',
    'Avant-centre'
  ],
  Basket: [
    'Meneur (1)',
    'Arrière (2)',
    'Ailier (3)',
    'Ailier fort (4)',
    'Pivot (5)'
  ],
  Handball: [
    'Gardien de but',
    'Ailier gauche',
    'Arrière gauche',
    'Demi-centre',
    'Pivot',
    'Arrière droit',
    'Ailier droit'
  ],
  Escrime: [
    'Fleuret',
    'Épée',
    'Sabre'
  ]
}

function ClassiqueContent() {
  const b = useCvBuilder('/builder/classique')
  const hasPro = !!(b.user?.plan === 'season' || b.user?.plan === 'pro' || b.user?.plan === 'club' || b.user?.isOwner)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const previewReady = useRef(false)

  const presetOptions = DISCIPLINES_BY_SPORT[b.sport]
  const isPresetDiscipline = presetOptions && presetOptions.includes(b.discipline)
  const disciplineSelectValue = isPresetDiscipline ? b.discipline : 'Autre'

  const [showImportModal, setShowImportModal] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')

  async function handleImport() {
    if (!importUrl) return
    setImporting(true)
    setImportError('')
    try {
      const res = await fetch('/api/import-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl })
      })
      const data = await res.json()
      if (!res.ok) {
        setImportError(data.error || 'Erreur lors de l\'importation.')
        setImporting(false)
        return
      }

      // Remplir les données dans le builder
      if (data.first) b.setFirst(data.first)
      if (data.last) b.setLast(data.last)
      if (data.sport) b.setSport(data.sport)
      if (data.discipline) b.setDiscipline(data.discipline)
      if (data.location) b.setLocation(data.location)
      if (data.avatar) b.setAvatar(data.avatar)
      if (data.stats && data.stats.length) b.setStats(data.stats)
      if (data.palmares && data.palmares.length) b.setPalmares(data.palmares)
      if (data.career && data.career.length) b.setCareer(data.career)
      if (data.characteristics) {
        b.setCharacteristics(data.characteristics)
        b.setShowCharacteristics(true)
      }

      setShowImportModal(false)
      setImportUrl('')
      b.setAlertMsg({ msg: 'Données importées avec succès ! Vérifie les informations et enregistre.', ok: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue.'
      setImportError(msg)
    } finally {
      setImporting(false)
    }
  }

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

  const isPresetSport = Object.keys(SPORTS).filter(k => k !== 'Autre').includes(b.sport)
  const selectValue = isPresetSport ? b.sport : 'Autre'

  function onSportChange(s: string) {
    if (s === 'Autre') {
      b.setSport('Autre')
      b.setColorA(SPORTS.Autre.a); b.setColorB(SPORTS.Autre.b)
    } else {
      b.setSport(s)
      const def = SPORTS[s]
      b.setColorA(def.a); b.setColorB(def.b)
    }
  }

  return (
    <div className="app-wrap wide b-page">
      <div className="b-topbar">
        <div style={{ minWidth: 0 }}>
          <Link href={b.targetUserId ? "/admin" : "/builder"} className="b-back">
            ← {b.targetUserId ? 'Retour console admin' : 'Espaces de création'}
          </Link>
          <h1>📄 CV Classique</h1>
          <p>{b.user.planName || ''}</p>
        </div>
        <div className="b-actions">
          <select value={b.visibility} onChange={(e) => b.setVisibility(e.target.value)} aria-label="Visibilité">
            <option value="private">🔒 Privé (lien seulement)</option>
            <option value="public">🌐 Public (visible en recherche)</option>
          </select>
          <Link className="btn btn-ghost" href={cvSlug ? `/${cvSlug}` : (b.targetUserId ? '/admin' : '/profil?me=1')} target="_blank">
            {b.targetUserId ? 'Voir le CV ↗' : 'Voir ma page ↗'}
          </Link>
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
            <div className="b-sec-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="b-sec-num">1</span>
                <h3>Identité</h3>
              </div>
              <button type="button" className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.7rem', height: 'auto', letterSpacing: '0.05em' }} onClick={() => setShowImportModal(true)}>
                ⚡ Importer (Transfermarkt / LNH)
              </button>
            </div>
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
                <select value={selectValue} onChange={(e) => onSportChange(e.target.value)}>
                  {Object.keys(SPORTS).map((s) => <option key={s}>{s}</option>)}
                </select>
                {selectValue === 'Autre' && (
                  <input 
                    style={{ marginTop: 8 }}
                    value={b.sport === 'Autre' ? '' : b.sport} 
                    onChange={(e) => b.setSport(e.target.value || 'Autre')} 
                    placeholder="Saisis ton sport (ex: Handball)" 
                    maxLength={LIMITS.discipline}
                  />
                )}
              </div>
              {presetOptions ? (
                <div className="field">
                  <label>Discipline / poste</label>
                  <select 
                    value={disciplineSelectValue} 
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === 'Autre') {
                        if (isPresetDiscipline) b.setDiscipline('')
                      } else {
                        b.setDiscipline(val)
                      }
                    }}
                  >
                    {presetOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    <option value="Autre">Autre (personnalisé)...</option>
                  </select>
                  {disciplineSelectValue === 'Autre' && (
                    <input
                      style={{ marginTop: 8 }}
                      value={b.discipline}
                      maxLength={LIMITS.discipline}
                      onChange={(e) => b.setDiscipline(e.target.value)}
                      placeholder="Saisis ton poste (ex: Ailier gauche)"
                    />
                  )}
                </div>
              ) : (
                <div className="field">
                  <label>Discipline / poste</label>
                  <input value={b.discipline} maxLength={LIMITS.discipline} onChange={(e) => b.setDiscipline(e.target.value)} placeholder="Ailier, Sprint…" />
                </div>
              )}
            </div>
            <div className="field">
              <label>Accroche</label>
              <input value={b.tagline} maxLength={LIMITS.tagline} onChange={(e) => b.setTagline(e.target.value)} placeholder="Une phrase qui te définit" />
              <CharCount value={b.tagline} max={LIMITS.tagline} />
            </div>
            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Biographie</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', cursor: 'pointer', fontWeight: 'normal', color: 'var(--muted-2)' }}>
                  <input 
                    type="checkbox" 
                    checked={b.showSections.bio !== false} 
                    onChange={(e) => b.setShowSections({ ...b.showSections, bio: e.target.checked })} 
                  />
                  Afficher la bio sur le profil
                </label>
              </div>
              <textarea 
                value={b.bio} 
                maxLength={LIMITS.bio} 
                onChange={(e) => b.setBio(e.target.value)}
                placeholder="Quelques lignes sur ton parcours, ta vision…" 
                rows={4} 
                style={{ opacity: b.showSections.bio !== false ? 1 : 0.5 }}
              />
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

          {/* 2 — Caractéristiques */}
          <div className="app-card b-card">
            <div className="b-sec-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="b-sec-num">2</span>
                <h3>Caractéristiques</h3>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                <input 
                  type="checkbox" 
                  checked={b.showCharacteristics} 
                  onChange={(e) => b.setShowCharacteristics(e.target.checked)} 
                  style={{ width: 'auto' }}
                />
                <span>Afficher</span>
              </label>
            </div>
            
            {b.showCharacteristics && (
              <div style={{ marginTop: 15 }}>
                <DynRows kind="characteristics" rows={b.characteristics} onChange={b.setCharacteristics} />
              </div>
            )}
          </div>

          {/* 3 — Couleurs */}
          <div className="app-card b-card" style={{ position: 'relative' }}>
            <div className="b-sec-head" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="b-sec-num">3</span>
              <h3>Couleurs</h3>
              {!hasPro && (
                <span className="hub-badge" style={{ background: 'var(--accent, #8bb6ff)', color: '#002451', fontSize: '0.68rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>PRO</span>
              )}
            </div>
            {hasPro ? (
              <>
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
              </>
            ) : (
              <div style={{ padding: '20px 10px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.01)', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                <span style={{ fontSize: '1.5rem' }}>🔒</span>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '8px 0 12px', lineHeight: '1.4' }}>
                  La personnalisation des couleurs est réservée aux membres Pro. Ton CV utilisera le thème par défaut de CVathlete.
                </p>
                <Link href="/tarifs" className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem', height: 'auto' }}>
                  Débloquer les couleurs Pro
                </Link>
              </div>
            )}
          </div>

          {/* 4 — Statistiques */}
          <div className="app-card b-card">
            <div className="b-sec-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="b-sec-num">4</span>
                <h3>Statistiques</h3>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--muted-2)' }}>
                <input 
                  type="checkbox" 
                  checked={b.showSections.stats !== false} 
                  onChange={(e) => b.setShowSections({ ...b.showSections, stats: e.target.checked })} 
                />
                Activer
              </label>
            </div>
            <div style={{ opacity: b.showSections.stats !== false ? 1 : 0.4, pointerEvents: b.showSections.stats !== false ? 'auto' : 'none' }}>
              <DynRows kind="stats" rows={b.stats} onChange={b.setStats} />
            </div>
            {b.showSections.stats === false && (
              <p style={{ fontSize: '0.78rem', color: 'var(--gold)', marginTop: 8, margin: 0 }}>
                ⚠️ Cette rubrique sera masquée sur ton profil.
              </p>
            )}
          </div>

          {/* 5 — Palmarès */}
          <div className="app-card b-card">
            <div className="b-sec-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="b-sec-num">5</span>
                <h3>Palmarès</h3>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--muted-2)' }}>
                <input 
                  type="checkbox" 
                  checked={b.showSections.palmares !== false} 
                  onChange={(e) => b.setShowSections({ ...b.showSections, palmares: e.target.checked })} 
                />
                Activer
              </label>
            </div>
            <div style={{ opacity: b.showSections.palmares !== false ? 1 : 0.4, pointerEvents: b.showSections.palmares !== false ? 'auto' : 'none' }}>
              <DynRows kind="palmares" rows={b.palmares} onChange={b.setPalmares} />
            </div>
            {b.showSections.palmares === false && (
              <p style={{ fontSize: '0.78rem', color: 'var(--gold)', marginTop: 8, margin: 0 }}>
                ⚠️ Cette rubrique sera masquée sur ton profil.
              </p>
            )}
          </div>

          {/* 6 — Parcours */}
          <div className="app-card b-card">
            <div className="b-sec-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="b-sec-num">6</span>
                <h3>Parcours</h3>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--muted-2)' }}>
                <input 
                  type="checkbox" 
                  checked={b.showSections.career !== false} 
                  onChange={(e) => b.setShowSections({ ...b.showSections, career: e.target.checked })} 
                />
                Activer
              </label>
            </div>
            <div style={{ opacity: b.showSections.career !== false ? 1 : 0.4, pointerEvents: b.showSections.career !== false ? 'auto' : 'none' }}>
              <DynRows kind="career" rows={b.career} onChange={b.setCareer} />
            </div>
            {b.showSections.career === false && (
              <p style={{ fontSize: '0.78rem', color: 'var(--gold)', marginTop: 8, margin: 0 }}>
                ⚠️ Cette rubrique sera masquée sur ton profil.
              </p>
            )}
          </div>

          {/* 7 — Réseaux */}
          <div className="app-card b-card">
            <div className="b-sec-head"><span className="b-sec-num">7</span><h3>Réseaux</h3></div>
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

      {showImportModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>⚡ Importer depuis Transfermarkt / LNH</h3>
              <button type="button" className="close-btn" onClick={() => setShowImportModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>
                Colle le lien de ton profil <strong>Transfermarkt</strong> (Football) ou <strong>LNH</strong> (Handball) ci-dessous pour pré-remplir ton profil et tes statistiques en un clic.
              </p>
              <div className="field">
                <label>URL du profil joueur</label>
                <input 
                  type="url" 
                  placeholder="https://www.transfermarkt.fr/lowen-nsonga/profil/spieler/..." 
                  value={importUrl} 
                  onChange={(e) => setImportUrl(e.target.value)} 
                  disabled={importing}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 4, background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>
              {importError && <p className="alert err" style={{ marginTop: 10 }}>{importError}</p>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.7rem', height: 'auto' }} onClick={() => setShowImportModal(false)} disabled={importing}>
                Annuler
              </button>
              <button type="button" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.7rem', height: 'auto' }} onClick={handleImport} disabled={importing || !importUrl}>
                {importing ? 'Importation...' : 'Importer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BuilderClassiquePage() {
  return <Suspense fallback={null}><ClassiqueContent /></Suspense>
}
