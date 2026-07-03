'use client'

import { useState } from 'react'
import { ModeSwitcher, type ViewMode } from '@/components/noa/shared/ModeSwitcher'
import { ClassicView } from '@/components/noa/classic/ClassicView'
import { CinematicView } from '@/components/noa/cinematic/CinematicView'
import { noaProfile } from '@/data/noa'

/** Orchestrateur : gestion d'état locale du mode + rendu du CV de Noa. */
export function NoaCvExperience() {
  const [mode, setMode] = useState<ViewMode>('cinematic')

  return (
    <>
      <ModeSwitcher mode={mode} onChange={setMode} />
      {mode === 'cinematic' ? (
        <CinematicView profile={noaProfile} />
      ) : (
        <ClassicView profile={noaProfile} />
      )}
    </>
  )
}
