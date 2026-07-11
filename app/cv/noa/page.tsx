import type { Metadata } from 'next'
import { NoaCvExperience } from '@/components/noa/shared/NoaCvExperience'
import { getViewerContext } from '@/app/actions/viewer'

export const metadata: Metadata = {
  title: 'Noa Muller — CV Gardien de but · ATHLETE CV',
  description:
    'CV interactif de Noa Muller, gardien de but international (Coupes du Monde FIFA U17 & U20). Mode classique et mode cinématique.',
}

/** Route /cv/noa : CV de Noa Muller, switch Classique / Cinématique. */
export default async function NoaCvPage() {
  const { adminForceMask, isAdminViewer } = await getViewerContext()
  return <NoaCvExperience adminForceMask={adminForceMask} isAdminViewer={isAdminViewer} />
}
