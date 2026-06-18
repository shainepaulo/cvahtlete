import type { Metadata } from 'next'
import { Sora, Jost } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BgFx from '@/components/BgFx'
import CookieBanner from '@/components/CookieBanner'
import SiteEffects from '@/components/SiteEffects'

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-sora',
  display: 'swap',
})

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-jost',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ATHLETE CV — Ton CV d\'athlète, en un lien',
  description:
    'Un CV d\'élite qui rassemble tout ton parcours d\'athlète. Un seul lien à mettre en bio ou à envoyer aux sponsors.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${sora.variable} ${jost.variable}`}>
      <body>
        <BgFx />
        <Navbar />
        <main>{children}</main>
        <Footer />
        <CookieBanner />
        <SiteEffects />
      </body>
    </html>
  )
}
