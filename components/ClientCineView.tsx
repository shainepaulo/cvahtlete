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

  // Préparation de la galerie cinématique avec la liste d'images (cineImages), sinon l'image unique (cineBg)
  const gallery = cv.cineImages && cv.cineImages.length > 0
    ? cv.cineImages.map((img) => ({
        src: img.url,
        alt: `${cv.first} ${cv.last}`,
        posX: img.posX ?? 50,
        posY: img.posY ?? 50,
        zoom: img.zoom ?? 1.25,
      }))
    : (cv.cineBg
        ? [{ src: cv.cineBg, alt: `${cv.first} ${cv.last}`, posX: cv.cineBgPosX ?? 50, posY: cv.cineBgPosY ?? 50, zoom: cv.cropZoomCineBg ?? 1.25 }]
        : []);

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
