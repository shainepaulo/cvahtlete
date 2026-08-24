'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { VideoClip } from '@/types/noa'

interface Props {
  videos: VideoClip[]
  onClose: () => void
}

function embedUrl(clip: VideoClip, origin: string) {
  const params = new URLSearchParams({
    start: String(clip.start),
    end: String(clip.end),
    autoplay: '1',
    mute: '1',
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    playsinline: '1',
    controls: '0',
    enablejsapi: '1',
    ...(origin ? { origin } : {}),
  })
  return `https://www.youtube-nocookie.com/embed/${clip.youtubeId}?${params.toString()}`
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

function postToPlayer(win: Window | null | undefined, func: string, args: unknown[] = []) {
  win?.postMessage(JSON.stringify({ event: 'command', func, args }), '*')
}

/**
 * Modal « Vidéos » — carrousel des meilleurs arrêts de Noa (CDM U20).
 * L'iframe YouTube est zoomée (variables --vzoom/--vshift) pour masquer le
 * navigateur capturé dans la vidéo source et l'habillage du lecteur.
 * Contrôles (lecture, progression, son, plein écran) pilotés via le
 * protocole postMessage du player YouTube (enablejsapi=1) pour offrir un
 * vrai lecteur custom par-dessus le cadrage recadré.
 * Rendu via un portail dans <body> : .noa-cine-wrap crée un contexte
 * d'empilement qui coincerait le modal sous le toggle de mode.
 */
export function CineVideosModal({ videos, onClose }: Props) {
  const [index, setIndex] = useState(0)
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [seeking, setSeeking] = useState(false)
  const [controlsOn, setControlsOn] = useState(true)
  // Incrément pour recharger l'iframe (bouton « Revoir »).
  const [playKey, setPlayKey] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [dragX, setDragX] = useState(0)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const swiping = useRef(false)

  useEffect(() => setMounted(true), [])

  const count = videos.length
  const clip = videos[index] ?? videos[0]!
  const duration = Math.max(1, clip.end - clip.start)

  // Réinitialise la progression affichée à chaque nouveau clip / rechargement.
  useEffect(() => {
    setElapsed(0)
    setPlaying(true)
  }, [index, playKey])

  // Écoute les mises à jour du player YouTube (temps, état) via postMessage.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (typeof e.data !== 'string') return
      let data: { event?: string; info?: { currentTime?: number; playerState?: number } }
      try {
        data = JSON.parse(e.data)
      } catch {
        return
      }
      if (data.event !== 'infoDelivery' || !data.info) return
      if (typeof data.info.currentTime === 'number' && !seeking) {
        setElapsed(Math.max(0, data.info.currentTime - clip.start))
      }
      if (typeof data.info.playerState === 'number') {
        setPlaying(data.info.playerState === 1)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [clip.start, seeking])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === ' ') {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, playing])

  function handshake() {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'noa-clip' }), '*')
  }

  function go(delta: number) {
    setIndex((i) => (i + delta + count) % count)
    setPlayKey((k) => k + 1)
  }

  function togglePlay() {
    postToPlayer(iframeRef.current?.contentWindow, playing ? 'pauseVideo' : 'playVideo')
    setPlaying((p) => !p)
  }

  function toggleMute() {
    postToPlayer(iframeRef.current?.contentWindow, muted ? 'unMute' : 'mute')
    setMuted((m) => !m)
  }

  function handleSeekChange(e: React.ChangeEvent<HTMLInputElement>) {
    setElapsed(parseFloat(e.target.value))
  }

  function commitSeek() {
    if (!seeking) return
    postToPlayer(iframeRef.current?.contentWindow, 'seekTo', [clip.start + elapsed, true])
    setSeeking(false)
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      frameRef.current?.requestFullscreen().catch(() => {})
    }
  }

  function wakeControls() {
    setControlsOn(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setControlsOn(false), 2600)
  }

  useEffect(() => {
    wakeControls()
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]
    if (!t) return
    touchStart.current = { x: t.clientX, y: t.clientY }
    swiping.current = false
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!touchStart.current) return
    const t = e.touches[0]
    if (!t) return
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    if (!swiping.current && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) swiping.current = true
    if (swiping.current) setDragX(dx)
  }

  function onTouchEnd() {
    if (swiping.current && Math.abs(dragX) > 60) {
      go(dragX < 0 ? 1 : -1)
    }
    setDragX(0)
    touchStart.current = null
    swiping.current = false
  }

  if (!mounted) return null

  const seekMax = duration
  const seekPct = Math.min(100, (elapsed / seekMax) * 100)

  return createPortal(
    <div className="noa-ci-videos" role="dialog" aria-label="Vidéos — meilleurs arrêts">
      <button type="button" className="noa-ci-videos-close" aria-label="Fermer" onClick={onClose}>
        ✕
      </button>

      <div
        className="noa-ci-video-card"
        style={dragX ? { transform: `translateX(${dragX * 0.35}px)`, transition: 'none' } : undefined}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          ref={frameRef}
          className="noa-ci-video-frame"
          style={{ '--vzoom': clip.zoom ?? 1.25, '--vshift': clip.shiftY ?? '0%' } as React.CSSProperties}
          onMouseMove={wakeControls}
          onClick={wakeControls}
        >
          <iframe
            ref={iframeRef}
            key={`${index}-${playKey}`}
            src={embedUrl(clip, typeof window !== 'undefined' ? window.location.origin : '')}
            title={clip.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            onLoad={handshake}
          />

          <div className={`noa-ci-video-controls${controlsOn ? ' show' : ''}`}>
            <div className="noa-ci-scrub">
              <div className="track">
                <div className="fill" style={{ width: `${seekPct}%` }} />
              </div>
              <input
                type="range"
                min={0}
                max={seekMax}
                step={0.1}
                value={elapsed}
                onPointerDown={() => setSeeking(true)}
                onChange={handleSeekChange}
                onMouseUp={commitSeek}
                onTouchEnd={commitSeek}
                aria-label="Progression du clip"
              />
            </div>
            <div className="row">
              <button type="button" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Lecture'}>
                {playing ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
              <button type="button" onClick={toggleMute} aria-label={muted ? 'Activer le son' : 'Couper le son'}>
                {muted ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.6l2.4 2.4c.06-.32.1-.65.1-1zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.94 8.94 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1-3.29-2.5-4.03v8.05c1.5-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                )}
              </button>
              <span className="time">{formatTime(elapsed)} / {formatTime(seekMax)}</span>
              <span className="spacer" />
              <span className="count">{index + 1}/{count}</span>
              <button type="button" onClick={toggleFullscreen} aria-label="Plein écran">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="noa-ci-video-body">
          <div className="head">
            <h3>{clip.title}</h3>
            <span className="cat">{clip.category}</span>
          </div>
          <p className="desc">{clip.description}</p>
        </div>
      </div>

      <div className="noa-ci-videos-nav">
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
