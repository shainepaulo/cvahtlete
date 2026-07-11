'use client'

import { useEffect, useState } from 'react'
import { ModeSwitcher, type ViewMode } from '@/components/noa/shared/ModeSwitcher'
import { ClassicView } from '@/components/noa/classic/ClassicView'
import { CinematicView } from '@/components/noa/cinematic/CinematicView'
import { noaProfile } from '@/data/noa'
import '@/components/noa/cinematic/noa-cinematic.css'

interface Props {
  adminForceMask: boolean
  isAdminViewer: boolean
}

/** Orchestrateur : gestion d'état locale du mode + rendu du CV de Noa. */
export function NoaCvExperience({ adminForceMask, isAdminViewer }: Props) {
  const [mode, setMode] = useState<ViewMode>('cinematic')

  // Masque nav/footer du site pour une expérience CV plein écran, comme /cine et /profil.
  useEffect(() => {
    const cls = mode === 'cinematic' ? 'cine-mode' : 'preview-mode'
    document.body.classList.add(cls)
    return () => document.body.classList.remove(cls)
  }, [mode])

  return (
    <>
      <ModeSwitcher mode={mode} onChange={setMode} />
      {mode === 'cinematic' ? (
        <CinematicView profile={noaProfile} />
      ) : (
        <ClassicView profile={noaProfile} adminForceMask={adminForceMask} isAdminViewer={isAdminViewer} />
      )}
    </>
  )
}
