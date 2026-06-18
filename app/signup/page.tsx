'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const PW_RULES = [
  { key: 'length', label: '10+ caractères', test: (p: string) => p.length >= 10 },
  { key: 'lower', label: 'une minuscule', test: (p: string) => /[a-z]/.test(p) },
  { key: 'upper', label: 'une majuscule', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'digit', label: 'un chiffre', test: (p: string) => /[0-9]/.test(p) },
  { key: 'special', label: 'un caractère spécial', test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p) },
]

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const valid = PW_RULES.every((r) => r.test(password))

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!valid) { setError('Le mot de passe ne respecte pas toutes les règles.'); return }
    setLoading(true)
    try {
      const r = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const j = await r.json()
      if (!r.ok) { setError(j.error || 'Inscription impossible.'); setLoading(false); return }
      router.push(next)
    } catch {
      setError('Inscription impossible.')
      setLoading(false)
    }
  }

  return (
    <div className="app-wrap">
      <div className="app-card">
        <div className="app-head">
          <span className="tag">Créer un compte</span>
          <h1>Rejoins ATHLETE&nbsp;CV.</h1>
          <p>Crée ton compte, choisis ton offre, construis ton répertoire.</p>
        </div>
        {error && <div className="alert err">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="name">Nom complet</label>
            <input id="name" type="text" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <div className="pw-wrap">
              <input
                id="password" type={showPw ? 'text' : 'password'}
                autoComplete="new-password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)}>
                {showPw ? 'Cacher' : 'Voir'}
              </button>
            </div>
            <ul className="pw-rules">
              {PW_RULES.map((r) => (
                <li key={r.key} className={r.test(password) ? 'ok' : ''}>
                  {r.label}
                </li>
              ))}
            </ul>
          </div>
          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>
        <p className="app-alt">
          Déjà inscrit&nbsp;?{' '}
          <Link href={`/login${next !== '/dashboard' ? '?next=' + encodeURIComponent(next) : ''}`}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return <Suspense fallback={null}><SignupForm /></Suspense>
}
