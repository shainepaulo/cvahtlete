'use client'

/**
 * /builder/cinematique — Éditeur dédié du CV cinématique (offre Pro/Club).
 * Image de fond plein écran recadrable + couleurs du dégradé du nom,
 * avec un aperçu immersif rendu en direct (mock CSS de l'écran /cine).
 * L'identité et les données viennent du CV classique : /builder/classique.
 */

import { Suspense } from 'react'
import Link from 'next/link'
import {
  useCvBuilder, CropBox, cropTf, COLOR_PRESETS,
} from '@/components/builder/shared'

function CinematiqueContent() {
  const b = useCvBuilder('/builder/cinematique')

  if (!b.user) {
    return <div className="app-wrap"><div className="app-head"><h1>Chargement…</h1></div></div>
  }

  const hasCine = !!b.user.entitlements?.cinematic
  const cvSlug = b.user.cv?.slug

  // Verrou premium : espace réservé aux offres avec option cinématique.
  if (!hasCine) {
    return (
      <div className="app-wrap b-page">
        <div className="app-card b-card" style={{ textAlign: 'center', marginTop: 60 }}>
          <span className="hub-ic" style={{ fontSize: '2.4rem' }}>🎬</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', margin: '12px 0 8px' }}>
            CV Cinématique
          </h1>
          <p style={{ color: 'var(--muted)', marginBottom: 22 }}>
            L&apos;écran immersif plein écran est réservé à l&apos;offre Pro
            (79&nbsp;€, paiement unique — essai 3 jours sans engagement).
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link className="btn btn-primary" href="/tarifs">Passer au Pro</Link>
            <Link className="btn btn-ghost" href="/builder">← Espaces de création</Link>
          </div>
        </div>
      </div>
    )
  }

  const bgSrc = b.cineBg || b.avatar
  const chips = [b.sport, b.discipline, b.location && `📍 ${b.location}`].filter(Boolean) as string[]

  return (
    <div className="app-wrap wide b-page">
      <div className="b-topbar">
        <div style={{ minWidth: 0 }}>
          <Link href="/builder" className="b-back">← Espaces de création</Link>
          <h1>🎬 CV Cinématique</h1>
          <p>{b.user.planName || ''} · L&apos;écran immersif de ton profil</p>
        </div>
        <div className="b-actions">
          {cvSlug && (
            <Link className="btn btn-ghost" href={`/cine?u=${cvSlug}`} target="_blank">Voir en plein écran ↗</Link>
          )}
          <button className="btn btn-primary" onClick={b.save} disabled={b.saving}>
            {b.saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {b.alertMsg && (
        <div className={`alert ${b.alertMsg.ok ? 'ok' : 'err'}`} style={{ marginBottom: 14 }}>
          {b.alertMsg.msg}
          {b.alertMsg.ok && b.alertMsg.slug && (
            <>
              {' '}
              <a href={`/cine?u=${b.alertMsg.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                🎬 Ouvrir mon cinématique
              </a>
            </>
          )}
        </div>
      )}

      <div className="builder-grid">
        <div style={{ minWidth: 0 }}>
          {/* 1 — Image signature */}
          <div className="app-card b-card">
            <div className="b-sec-head"><span className="b-sec-num">1</span><h3>Image signature</h3></div>
            <p style={{ color: 'var(--muted)', fontSize: '.86rem', marginBottom: 16 }}>
              La photo plein écran de ton mode cinématique. Laisse vide pour
              réutiliser ta photo de profil du CV classique.
            </p>
            <CropBox label="Image de fond plein écran" hint="Réutilise la photo de profil si vide"
              src={b.cineBg} posX={b.cineBgPosX} posY={b.cineBgPosY} zoom={b.cropZoomCineBg}
              onPosChange={(x, y) => { b.setCineBgPosX(x); b.setCineBgPosY(y) }}
              onZoomChange={b.setCropZoomCineBg} onFile={b.setCineBg}
            />
          </div>

          {/* 2 — Dégradé du nom */}
          <div className="app-card b-card">
            <div className="b-sec-head"><span className="b-sec-num">2</span><h3>Dégradé du nom</h3></div>
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
            <p style={{ color: 'var(--muted-2)', fontSize: '.8rem' }}>
              Ces couleurs colorent aussi ton CV classique — un seul univers visuel.
            </p>
          </div>

          {/* 3 — Contenu affiché */}
          <div className="app-card b-card">
            <div className="b-sec-head"><span className="b-sec-num">3</span><h3>Contenu affiché</h3></div>
            <p style={{ color: 'var(--muted)', fontSize: '.86rem' }}>
              Le nom, l&apos;accroche, les stats et le palmarès affichés dans le
              mode cinématique viennent de ton <strong>CV classique</strong>.
            </p>
            <Link className="btn btn-ghost" href="/builder/classique" style={{ marginTop: 14 }}>
              📄 Modifier le contenu du CV →
            </Link>
          </div>
        </div>

        {/* Aperçu immersif en direct (mock CSS de /cine, toujours contenu) */}
        <div className="preview-box">
          <div className="pb-head"><span>Aperçu immersif</span></div>
          <div style={{ padding: 14 }}>
            <div className="cine-mock">
              {bgSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bgSrc} alt="" style={{ transform: cropTf(b.cineBgPosX, b.cineBgPosY, b.cropZoomCineBg), transformOrigin: 'center' }} />
              ) : (
                <div className="mk-empty">Ajoute une image signature</div>
              )}
              <div className="mk-scrim" />
              <div className="mk-body">
                <div className="mk-name">
                  <span>{b.first || 'Prénom'}</span>
                  <strong style={{ backgroundImage: `linear-gradient(90deg, ${b.colorA}, ${b.colorB})` }}>
                    {b.last || 'NOM'}
                  </strong>
                </div>
                {chips.length > 0 && (
                  <div className="mk-chips">
                    {chips.map((c) => <span key={c}>{c}</span>)}
                  </div>
                )}
                <div className="mk-btns">
                  <span className="solid">📊 Stats &amp; palmarès</span>
                  <span>📄 CV complet</span>
                </div>
              </div>
            </div>
            <p style={{ color: 'var(--muted-2)', fontSize: '.78rem', marginTop: 12, textAlign: 'center' }}>
              Rendu indicatif — ouvre le plein écran pour l&apos;expérience réelle.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BuilderCinematiquePage() {
  return <Suspense fallback={null}><CinematiqueContent /></Suspense>
}
