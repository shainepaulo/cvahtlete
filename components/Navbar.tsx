'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from './Logo'

interface User {
  name?: string
  plan?: string | null
}

const PAGES = [
  { href: '/', label: 'Accueil' },
  { href: '/exemples', label: 'Exemples' },
  { href: '/bibliotheque', label: 'Bibliothèque' },
  { href: '/sports', label: 'Tous les sports' },
  { href: '/tarifs', label: 'Tarifs' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((j) => setUser(j.user || null))
      .catch(() => {})
  }, [])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <nav className={`site-nav${scrolled ? ' scrolled' : ''}`}>
      <div className="container">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="mark">
            <Logo />
          </span>
          ATHLETE&nbsp;CV
        </Link>
        <button
          className="nav-toggle"
          aria-label="Menu"
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className={`nav-menu${open ? ' open' : ''}`}>
          {PAGES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className={`link${isActive(p.href) ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {p.label}
            </Link>
          ))}
          <span id="navAuth" style={{ display: 'contents' }}>
            {user ? (
              <>
                <Link href="/dashboard" className="link" onClick={() => setOpen(false)}>
                  Mon compte
                </Link>
                <Link
                  href={user.plan ? '/builder' : '/tarifs'}
                  className="btn btn-primary"
                  onClick={() => setOpen(false)}
                >
                  {user.plan ? 'Mon répertoire' : 'Choisir une offre'}
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="link" onClick={() => setOpen(false)}>
                  Connexion
                </Link>
                <Link href="/signup" className="btn btn-primary" onClick={() => setOpen(false)}>
                  Créer un compte
                </Link>
              </>
            )}
          </span>
        </div>
      </div>
    </nav>
  )
}
