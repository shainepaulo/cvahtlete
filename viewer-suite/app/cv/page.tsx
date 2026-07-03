import type { Metadata } from 'next'
import { Playfair_Display, Montserrat } from 'next/font/google'
import { CvCompletView } from '@/components/noa/complet/CvCompletView'
import { noaProfile } from '@/data/noa'

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
  title: 'Noa Bouchet-Muller — CV Joueur',
  description: 'CV complet de Noa Bouchet-Muller, gardien de but international.',
}

/** Route /cv : le CV complet (interface info.html d'ATHLETE CV). */
export default function CvCompletPage() {
  return (
    <div className={`${playfair.variable} ${montserrat.variable}`}>
      <CvCompletView profile={noaProfile} />
    </div>
  )
}
