'use client'

import { useRef, useState, useEffect } from 'react'

interface PlayerVideoProps {
  src: string
  title?: string
  autoPlay?: boolean
  className?: string
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=0&controls=1`
  }
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/)
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=0`
  }
  return null
}

export function PlayerVideo({ src, title, autoPlay = false, className = '' }: PlayerVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1.0)
  const [isMuted, setIsMuted] = useState(false) // Son activé par défaut
  const [showControls, setShowControls] = useState(true)

  const embedUrl = getEmbedUrl(src)

  useEffect(() => {
    const video = videoRef.current
    if (!video || embedUrl) return

    video.volume = volume
    video.muted = false // Son activé par défaut par exigence

    const onLoadedMetadata = () => setDuration(video.duration || 0)
    const onTimeUpdate = () => setCurrentTime(video.currentTime || 0)
    const onEnded = () => setIsPlaying(false)

    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('ended', onEnded)

    if (autoPlay) {
      video.play().then(() => setIsPlaying(true)).catch(() => {
        // En cas de blocage d'autoplay avec son par le navigateur, retente en muet
        video.muted = true
        setIsMuted(true)
        video.play().then(() => setIsPlaying(true)).catch(() => {})
      })
    }

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('ended', onEnded)
    }
  }, [src, autoPlay, embedUrl])

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
    } else {
      video.muted = isMuted
      video.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current
    if (!video) return
    const newTime = parseFloat(e.target.value)
    video.currentTime = newTime
    setCurrentTime(newTime)
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current
    const newVol = parseFloat(e.target.value)
    setVolume(newVol)
    if (video) {
      video.volume = newVol
      video.muted = newVol === 0
    }
    setIsMuted(newVol === 0)
  }

  function toggleMute() {
    const video = videoRef.current
    if (!video) return
    const nextMute = !isMuted
    video.muted = nextMute
    setIsMuted(nextMute)
  }

  function toggleFullscreen() {
    const video = videoRef.current
    if (!video) return
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      video.requestFullscreen().catch(() => {})
    }
  }

  if (embedUrl) {
    return (
      <div className={`video-player-container ${className}`} style={{ borderRadius: 12, overflow: 'hidden', background: '#000', margin: '10px 0' }}>
        {title && <div style={{ padding: '8px 12px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text, #fff)', background: 'rgba(255,255,255,0.05)' }}>{title}</div>}
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <iframe
            src={embedUrl}
            title={title || 'Vidéo joueur'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`video-player-container ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      style={{
        position: 'relative',
        borderRadius: 14,
        overflow: 'hidden',
        background: '#040914',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        margin: '12px 0'
      }}
    >
      {title && (
        <div style={{
          padding: '10px 14px',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: '#fff',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10
        }}>
          🎬 {title}
        </div>
      )}

      {/* HTML5 Video element avec son activé par défaut */}
      <video
        ref={videoRef}
        src={src}
        onClick={togglePlay}
        playsInline
        style={{ width: '100%', display: 'block', maxHeight: 480, objectFit: 'contain', cursor: 'pointer', background: '#000' }}
      />

      {/* Commandes vidéo personnalisées avec Slider d'avancement/recul */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(0deg, rgba(0,12,28,0.95) 0%, rgba(0,12,28,0.7) 70%, transparent 100%)',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transition: 'opacity 0.3s',
        opacity: showControls ? 1 : 0,
        zIndex: 15
      }}>
        {/* SLIDER AVANCER / RECULER (Time seekbar) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            aria-label="Avancer ou reculer dans la vidéo"
            style={{
              flex: 1,
              height: 5,
              borderRadius: 3,
              accentColor: 'var(--gold, #ffd98a)',
              cursor: 'pointer'
            }}
          />
          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.85)', minWidth: 80, textAlign: 'right' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Barre d'outils inférieure : Lecture, Son, Plein écran */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Lecture'}
              style={{
                background: 'var(--gold, #ffd98a)',
                color: '#001226',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>

            {/* Contrôle du Son (Volume & Mute) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1rem', cursor: 'pointer' }}
              >
                {isMuted || volume === 0 ? '🔇' : '🔊'}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                aria-label="Volume du son"
                style={{ width: 60, height: 4, accentColor: '#fff', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Plein écran */}
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Plein écran"
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.1rem', cursor: 'pointer' }}
          >
            ⛶
          </button>
        </div>
      </div>
    </div>
  )
}
