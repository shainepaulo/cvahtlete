import type { Metadata } from 'next'
import { Playfair_Display, Montserrat } from 'next/font/google'
import { CvCompletView } from '@/components/noa/complet/CvCompletView'
import { dembeleCompletProfile } from '@/data/dembele'
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
  title: 'Ousmane Dembélé — CV Joueur · ATHLETE CV',
  description: "CV complet d'Ousmane Dembélé, ailier du Paris Saint-Germain (démo ATHLETE CV).",
}

/** Route /cv/dembele/complet : CV complet de la vitrine démo (impression PDF thémée). */
export default async function DembeleCvCompletPage() {
  const { adminForceMask, isAdminViewer } = await getViewerContext()
  return (
    <div className={`${playfair.variable} ${montserrat.variable}`}>
      <CvCompletView
        profile={dembeleCompletProfile}
        backHref="/profil?a=dembele"
        cvSlug="dembele"
        adminForceMask={adminForceMask}
        isAdminViewer={isAdminViewer}
      />
    </div>
  )
}
