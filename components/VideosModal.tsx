'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { PlayerVideo } from '@/components/PlayerVideo'

interface VideoItem {
  url: string
  title: string
}

interface Props {
  videos: VideoItem[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

/**
 * Fenêtre dédiée aux vidéos d'un CV — jamais imbriquée dans le panneau
 * Stats/Palmarès (les deux ont des déclencheurs distincts dans CineView).
 * Carrousel : flèches gauche/droite + points, navigation clavier.
 */
export function VideosModal({ videos, index, onIndexChange, onClose }: Props) {
  const count = videos.length
  const current = videos[index] ?? videos[0]

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % count)
      if (e.key === 'ArrowLeft') onIndexChange((index - 1 + count) % count)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [count, index, onIndexChange, onClose])

  if (!current) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[600] flex items-center justify-center bg-[#00081c]/85 p-4 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-label="Vidéos"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute -top-3 -right-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white text-base font-bold text-[#0a0a0a] shadow-lg transition hover:scale-105"
        >
          ✕
        </button>

        <div className="overflow-hidden rounded-2xl bg-black shadow-2xl">
          <PlayerVideo key={index} src={current.url} title={current.title} autoPlay />
        </div>

        {count > 1 && (
          <div className="mt-5 flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={() => onIndexChange((index - 1 + count) % count)}
              aria-label="Vidéo précédente"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-[#000c1c]/60 text-white backdrop-blur-md transition hover:scale-105 hover:border-accent/60"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
                <polyline points="15,18 9,12 15,6" />
              </svg>
            </button>
            <div className="flex gap-2">
              {videos.map((v, i) => (
                <button
                  key={`${v.url}-${i}`}
                  type="button"
                  onClick={() => onIndexChange(i)}
                  aria-label={`Vidéo ${i + 1}`}
                  className={`h-2.5 w-2.5 rounded-full transition ${i === index ? 'scale-125 bg-gold' : 'bg-white/35'}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => onIndexChange((index + 1) % count)}
              aria-label="Vidéo suivante"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-[#000c1c]/60 text-white backdrop-blur-md transition hover:scale-105 hover:border-accent/60"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
                <polyline points="9,6 15,12 9,18" />
              </svg>
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
