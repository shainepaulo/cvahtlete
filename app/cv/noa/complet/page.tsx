import type { Metadata } from 'next'
import { Playfair_Display, Montserrat } from 'next/font/google'
import { CvCompletView } from '@/components/noa/complet/CvCompletView'
import { noaProfile } from '@/data/noa'
import { getViewerContext } from '@/app/actions/viewer'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-playfair',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Noa Muller — CV Joueur · ATHLETE CV',
  description: 'CV complet de Noa Muller, gardien de but international.',
}

/** Route /cv/noa/complet : le CV complet (interface info.html d'ATHLETE CV). */
export default async function NoaCvCompletPage() {
  const { adminForceMask, isAdminViewer } = await getViewerContext()
  return (
    <div className={`${playfair.variable} ${montserrat.variable}`}>
      <CvCompletView profile={noaProfile} adminForceMask={adminForceMask} isAdminViewer={isAdminViewer} />
    </div>
  )
}
