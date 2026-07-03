'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { VideoClip } from '@/types/noa'

interface Props {
  videos: VideoClip[]
  onClose: () => void
}

function embedUrl(clip: VideoClip, muted: boolean) {
  const params = new URLSearchParams({
    start: String(clip.start),
    end: String(clip.end),
    autoplay: '1',
    mute: muted ? '1' : '0',
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    playsinline: '1',
    controls: '0',
  })
  return `https://www.youtube-nocookie.com/embed/${clip.youtubeId}?${params.toString()}`
}

/**
 * Modal « Vidéos » — carrousel des meilleurs arrêts de Noa (CDM U20).
 * L'iframe YouTube est zoomée (variables --vzoom/--vshift) pour masquer le
 * navigateur capturé dans la vidéo source et l'habillage du lecteur.
 * Rendu via un portail dans <body> : .cine-wrap crée un contexte
 * d'empilement (z 300) qui coincerait le modal SOUS le toggle de mode (z 400).
 */
export function CineVideosModal({ videos, onClose }: Props) {
  const [index, setIndex] = useState(0)
  const [muted, setMuted] = useState(true)
  // Incrément pour recharger l'iframe (bouton « Revoir »).
  const [playKey, setPlayKey] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const count = videos.length
  const clip = videos[index] ?? videos[0]!

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % count)
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + count) % count)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [count, onClose])

  function go(delta: number) {
    setIndex((i) => (i + delta + count) % count)
    setPlayKey((k) => k + 1)
  }

  if (!mounted) return null

  return createPortal(
    <div className="ci-videos" role="dialog" aria-label="Vidéos — meilleurs arrêts">
      <button type="button" className="ci-videos-close" aria-label="Fermer" onClick={onClose}>
        ✕
      </button>

      <div className="ci-video-card">
        <div
          className="ci-video-frame"
          style={{ '--vzoom': clip.zoom ?? 1.25, '--vshift': clip.shiftY ?? '0%' } as React.CSSProperties}
        >
          <iframe
            key={`${index}-${muted}-${playKey}`}
            src={embedUrl(clip, muted)}
            title={clip.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
          <div className="ci-video-tools">
            <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Activer le son' : 'Couper le son'}>
              {muted ? '🔇' : '🔊'}
            </button>
            <button type="button" onClick={() => setPlayKey((k) => k + 1)} aria-label="Revoir le clip">
              ↻
            </button>
          </div>
          <span className="ci-video-num">{index + 1}</span>
        </div>
        <div className="ci-video-body">
          <h3>{clip.title}</h3>
          <p className="cat">{clip.category}</p>
          <p className="desc">{clip.description}</p>
        </div>
      </div>

      <div className="ci-videos-nav">
        <button type="button" onClick={() => go(-1)} aria-label="Clip précédent">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>
        <div className="dots">
          {videos.map((v, i) => (
            <button
              key={v.title}
              type="button"
              className={i === index ? 'on' : ''}
              aria-label={`Clip ${i + 1}`}
              onClick={() => {
                setIndex(i)
                setPlayKey((k) => k + 1)
              }}
            />
          ))}
        </div>
        <button type="button" onClick={() => go(1)} aria-label="Clip suivant">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <polyline points="9,6 15,12 9,18" />
          </svg>
        </button>
      </div>
    </div>,
    document.body,
  )
}
