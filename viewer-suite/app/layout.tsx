import type { Metadata } from 'next'
import { Sora, Jost } from 'next/font/google'
import './globals.css'

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
  title: 'Noa Bouchet-Muller — CV Gardien de but',
  description:
    'CV interactif de Noa Bouchet-Muller, gardien de but international (Coupes du Monde FIFA U17 & U20). Mode classique et mode cinématique.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${sora.variable} ${jost.variable}`}>
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
