'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { CvData } from '@/app/actions/cv'

const CineView = dynamic(() => import('@/components/CineView'), {
  ssr: false,
  loading: () => (
    <div className="cine-wrap">
      <div className="ci-locked"><p>Chargement de la scène…</p></div>
    </div>
  ),
})

interface ClientCineViewProps {
  cv: CvData
}

export default function ClientCineView({ cv }: ClientCineViewProps) {
  useEffect(() => {
    document.body.classList.add('cine-mode')
    return () => {
      document.body.classList.remove('cine-mode')
    }
  }, [])

  // Préparation de la galerie cinématique avec l'image de fond (cineBg) ou l'avatar
  const gallery = cv.cineBg
    ? [{ src: cv.cineBg, alt: `${cv.first} ${cv.last}`, position: `${cv.cineBgPosX ?? 50}% ${cv.cineBgPosY ?? 50}%` }]
    : []

  return (
    <CineView
      cv={cv}
      cinematic={!!cv.cinematic}
      tagline={cv.tagline || ''}
      gallery={gallery}
      completHref={`/${cv.slug}?mode=classic`}
      classicHref={`/${cv.slug}?mode=classic`}
    />
  )
}
