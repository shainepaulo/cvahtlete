'use client'

/**
 * /builder/classique — Éditeur dédié du CV classique (page publique).
 * Formulaire par sections numérotées + aperçu en direct (iframe postMessage).
 * Le mode cinématique a son propre espace : /builder/cinematique.
 */

import { useCallback, useEffect, useRef, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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

  const searchParams = useSearchParams()
  const initialMode = searchParams.get('mode') === 'cine' ? 'cine' : 'classic'
  const [previewMode, setPreviewMode] = useState<'classic' | 'cine'>(initialMode)
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
                targetUserId={b.targetUserId}
                onPosChange={(x, y) => { b.setPhotoPosX(x); b.setPhotoPosY(y) }}
                onZoomChange={b.setCropZoomAvatar} onFile={b.setAvatar}
              />
            </div>

            {/* Sub-section : Images de fond pour le mode cinématique */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px dashed var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.2rem' }}>🎬</span>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--gold)' }}>
                    Images de fond (Mode Cinématique)
                  </h4>
                </div>
                {hasPro && (
                  <span style={{ fontSize: '0.72rem', background: 'rgba(255,217,138,0.15)', color: 'var(--gold)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                    Inclus dans ton offre
                  </span>
                )}
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: 16 }}>
                Ajoute jusqu&apos;à 8 photos grand format qui serviront d&apos;arrière-plan immersif en mode Cinématique.
              </p>

              <div style={{ display: 'grid', gap: 20 }}>
                {b.cineImages.length === 0 && (
                  <CropBox 
                    label="Image de fond #1" 
                    hint="Sélectionne ou glisse une image de fond"
                    src={b.cineBg || ''} 
                    posX={b.cineBgPosX} 
                    posY={b.cineBgPosY} 
                    zoom={b.cropZoomCineBg}
                    targetUserId={b.targetUserId}
                    onPosChange={(x, y) => { b.setCineBgPosX(x); b.setCineBgPosY(y); }}
                    onZoomChange={b.setCropZoomCineBg}
                    onFile={(url) => {
                      b.setCineBg(url);
                      b.setCineImages([{ url, posX: b.cineBgPosX, posY: b.cineBgPosY, zoom: b.cropZoomCineBg }]);
                    }}
                  />
                )}

                {b.cineImages.map((img, idx) => (
                  <div key={idx} style={{ 
                    borderBottom: idx < b.cineImages.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', 
                    paddingBottom: idx < b.cineImages.length - 1 ? 16 : 0, 
                    display: 'grid', 
                    gap: 10 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gold)' }}>
                        Image de fond #{idx + 1}
                      </span>
                      {b.cineImages.length > 1 && (
                        <button 
                          type="button" 
                          className="btn btn-ghost"
                          style={{ color: '#ff4d4f', padding: '2px 8px', fontSize: '0.72rem', height: 'auto' }}
                          onClick={() => {
                            const copy = b.cineImages.filter((_, i) => i !== idx);
                            b.setCineImages(copy);
                          }} 
                        >
                          Supprimer
                        </button>
                      )}
                    </div>

                    <CropBox 
                      label="" 
                      hint="Sélectionne ou glisse une image de fond"
                      src={img.url} 
                      posX={img.posX ?? 50} 
                      posY={img.posY ?? 50} 
                      zoom={img.zoom ?? 1.25}
                      targetUserId={b.targetUserId}
                      onPosChange={(x, y) => {
                        const copy = [...b.cineImages];
                        copy[idx] = { ...copy[idx], posX: x, posY: y };
                        b.setCineImages(copy);
                        if (idx === 0) { b.setCineBgPosX(x); b.setCineBgPosY(y); }
                      }}
                      onZoomChange={(z) => {
                        const copy = [...b.cineImages];
                        copy[idx] = { ...copy[idx], zoom: z };
                        b.setCineImages(copy);
                        if (idx === 0) { b.setCropZoomCineBg(z); }
                      }}
                      onFile={(url) => {
                        const copy = [...b.cineImages];
                        copy[idx] = { ...copy[idx], url };
                        b.setCineImages(copy);
                        if (idx === 0) { b.setCineBg(url); }
                      }}
                    />
                  </div>
                ))}
              </div>

              {b.cineImages.length < 8 && (
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  style={{ marginTop: 14, width: '100%', border: '1px dashed var(--border)', fontSize: '0.8rem', padding: '8px' }}
                  onClick={() => {
                    const defaultImg = b.avatar || '';
                    const copy = [...b.cineImages, { url: defaultImg, posX: 50, posY: 50, zoom: 1.25 }];
                    b.setCineImages(copy);
                  }}
                >
                  + Ajouter une image de fond (max 8)
                </button>
              )}
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

          {/* 7 — Vidéos */}
          <div className="app-card b-card">
            <div className="b-sec-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="b-sec-num">7</span>
                <h3>Vidéos de l&apos;athlète</h3>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--muted-2)' }}>
                <input 
                  type="checkbox" 
                  checked={b.showSections.videos !== false} 
                  onChange={(e) => b.setShowSections({ ...b.showSections, videos: e.target.checked })} 
                />
                Activer
              </label>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-2)', marginBottom: 12 }}>
              Ajoute les liens de tes vidéos phares (YouTube, Vimeo ou fichier MP4). Le son sera activé par défaut avec un contrôle d&apos;avancement rapide.
            </p>
            <div style={{ opacity: b.showSections.videos !== false ? 1 : 0.4, pointerEvents: b.showSections.videos !== false ? 'auto' : 'none' }}>
              <DynRows kind="videos" rows={b.videos} onChange={b.setVideos} />
            </div>
            {b.showSections.videos === false && (
              <p style={{ fontSize: '0.78rem', color: 'var(--gold)', marginTop: 8, margin: 0 }}>
                ⚠️ Cette rubrique sera masquée sur ton profil.
              </p>
            )}
          </div>

          {/* 8 — Réseaux */}
          <div className="app-card b-card">
            <div className="b-sec-head"><span className="b-sec-num">8</span><h3>Réseaux</h3></div>
            <div className="field">
              <label>Instagram (URL)</label>
              <input value={b.instagram} maxLength={LIMITS.url} onChange={(e) => b.setInstagram(e.target.value)} placeholder="https://instagram.com/…" />
            </div>
            <div className="field">
              <label>X (URL)</label>
              <input value={b.xUrl} maxLength={LIMITS.url} onChange={(e) => b.setXUrl(e.target.value)} placeholder="https://x.com/…" />
            </div>
          </div>

          {/* 9 — Coordonnées */}
          <div className="app-card b-card">
            <div className="b-sec-head">
              <span className="b-sec-num">9</span>
              <h3>Coordonnées</h3>
            </div>

            {/* Infos publiques */}
            <div className="row2">
              <div className="field">
                <label>Date de naissance</label>
                <input
                  value={b.birthDate}
                  maxLength={20}
                  onChange={(e) => b.setBirthDate(e.target.value)}
                  placeholder="20/08/2007"
                />
              </div>
              <div className="field">
                <label>Nationalité</label>
                <input
                  value={b.nationality}
                  maxLength={60}
                  onChange={(e) => b.setNationality(e.target.value)}
                  placeholder="Française"
                />
              </div>
            </div>
            <div className="field">
              <label>Éligibilité internationale</label>
              <input
                value={b.eligibility}
                maxLength={100}
                onChange={(e) => b.setEligibility(e.target.value)}
                placeholder="Nouvelle-Calédonie (Franco-Calédonien)"
              />
            </div>

            {/* Infos sensibles */}
            <div
              style={{
                marginTop: 18,
                padding: '12px 14px',
                background: 'rgba(139,182,255,0.08)',
                border: '1px solid rgba(139,182,255,0.25)',
                borderRadius: 8,
                marginBottom: 14,
              }}
            >
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted-2)', lineHeight: 1.5 }}>
                🔒 <strong>Téléphone &amp; email — données protégées</strong><br />
                Ces coordonnées ne sont <strong>jamais affichées en clair</strong> aux visiteurs.
                Les recruteurs doivent faire une demande d&apos;accès explicite. Seul toi (et l&apos;équipe CVathlete) peut les voir en clair.
              </p>
            </div>
            <div className="row2">
              <div className="field">
                <label>Téléphone 🔒</label>
                <input
                  value={b.contactPhone}
                  maxLength={30}
                  onChange={(e) => b.setContactPhone(e.target.value)}
                  placeholder="+33 7 00 00 00 00"
                  type="tel"
                />
              </div>
              <div className="field">
                <label>Email 🔒</label>
                <input
                  value={b.contactEmail}
                  maxLength={120}
                  onChange={(e) => b.setContactEmail(e.target.value)}
                  placeholder="ton@email.com"
                  type="email"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Aperçu en direct */}
        <div className="preview-box">
          <div className="pb-head">
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button 
                type="button" 
                onClick={() => setPreviewMode('classic')}
                style={{ 
                  fontSize: '0.75rem', 
                  padding: '4px 10px', 
                  borderRadius: 4, 
                  background: previewMode === 'classic' ? 'var(--gold)' : 'rgba(255,255,255,0.08)', 
                  color: previewMode === 'classic' ? '#000' : 'var(--text)', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontWeight: 600 
                }}
              >
                📄 Classique
              </button>
              <button 
                type="button" 
                onClick={() => setPreviewMode('cine')}
                style={{ 
                  fontSize: '0.75rem', 
                  padding: '4px 10px', 
                  borderRadius: 4, 
                  background: previewMode === 'cine' ? 'var(--gold)' : 'rgba(255,255,255,0.08)', 
                  color: previewMode === 'cine' ? '#000' : 'var(--text)', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontWeight: 600 
                }}
              >
                🎬 Cinématique
              </button>
            </div>
            <div className="pb-sizes">
              <button type="button" className="active" title="Vue mobile"
                onClick={(e) => { if (iframeRef.current) iframeRef.current.style.width = '390px'; document.querySelectorAll('.pb-sizes button').forEach((btn) => btn.classList.toggle('active', btn === e.currentTarget)) }}>📱</button>
              <button type="button" title="Vue large"
                onClick={(e) => { if (iframeRef.current) iframeRef.current.style.width = '100%'; document.querySelectorAll('.pb-sizes button').forEach((btn) => btn.classList.toggle('active', btn === e.currentTarget)) }}>🖥️</button>
            </div>
          </div>
          <div className="pb-frame">
            <iframe 
              ref={iframeRef} 
              id="preview" 
              src={previewMode === 'cine' ? (b.user?.cv?.slug ? `/cine?u=${b.user.cv.slug}` : '/cine?u=dembele') : '/profil?preview=1'} 
              style={{ width: 390 }} 
            />
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
            </div>
          </div>
        </div>
      )}

      {/* Barre de sauvegarde fixe flottante en bas de l'écran (Sticky Save Bar Mobile) */}
      <div className="b-floating-savebar">
        <button type="button" className="btn btn-primary" onClick={b.save} disabled={b.saving} style={{ flex: 1, minHeight: 46, fontSize: '0.92rem', fontWeight: 'bold' }}>
          {b.saving ? 'Enregistrement…' : '💾 Enregistrer le CV'}
        </button>
        <Link className="btn btn-ghost" href={cvSlug ? `/${cvSlug}` : (b.targetUserId ? '/admin' : '/profil?me=1')} target="_blank">
          {b.targetUserId ? 'Voir ↗' : 'Voir ↗'}
        </Link>
      </div>
    </div>
  )
}

export default function BuilderClassiquePage() {
  return <Suspense fallback={null}><ClassiqueContent /></Suspense>
}
