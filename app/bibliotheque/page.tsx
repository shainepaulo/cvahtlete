'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface CvCard {
  slug: string
  first: string
  last: string
  sport: string
  emoji: string
  discipline: string
  avatar: string
  colors: { a: string; b: string }
}

export default function BibliothequerPage() {
  const [cvs, setCvs] = useState<CvCard[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  async function load(q: string) {
    try {
      const r = await fetch('/api/library' + (q ? '?q=' + encodeURIComponent(q) : ''))
      const j = await r.json()
      setCvs(j.cvs || [])
      setError(false)
    } catch {
      setError(true)
    }
  }

  useEffect(() => { load('') }, [])

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => load(v.trim()), 250)
  }

  const ini = (c: CvCard) => ((c.first || ' ')[0] + (c.last || ' ')[0]).toUpperCase()

  return (
    <section className="section center" style={{ paddingTop: 'calc(var(--nav-h) + 90px)' }}>
      <div className="container">
        <span className="tag reveal">Bibliothèque</span>
        <h2 className="title reveal" data-delay="1">
          Les CV d&apos;athlètes,<br />en accès public.
        </h2>
        <p className="lead-2 reveal" data-delay="2">
          Recherche un athlète par nom ou par sport. Seuls les CV mis en «&nbsp;public&nbsp;»
          apparaissent ici.
        </p>

        <div className="lib-search reveal" data-delay="2" style={{ maxWidth: 460, margin: '40px auto 0' }}>
          <input
            type="search"
            placeholder="Rechercher un nom, un sport…"
            autoComplete="off"
            value={query}
            onChange={onInput}
            style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 100, padding: '15px 24px', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '1rem' }}
          />
        </div>

        {error && (
          <div style={{ color: 'var(--muted)', marginTop: 30 }}>Bibliothèque indisponible.</div>
        )}

        {!error && cvs.length === 0 && (
          <div style={{ color: 'var(--muted)', marginTop: 30 }}>
            Aucun CV public pour l&apos;instant.{' '}
            <Link href="/tarifs" style={{ color: 'var(--accent)' }}>Crée le tien</Link> et
            passe-le en public&nbsp;!
          </div>
        )}

        <div className="gallery" id="grid">
          {cvs.map((c) => {
            const a = c.colors?.a || '#8bb6ff'
            const b = c.colors?.b || '#79e0cf'
            return (
              <Link key={c.slug} className="athlete-card" href={`/profil?u=${c.slug}`}>
                <div className="ac-cover" style={{ background: `linear-gradient(120deg,${a},${b})` }}>
                  {c.avatar && <img src={c.avatar} alt="" />}
                  <span className="emoji">{c.emoji || '🏅'}</span>
                </div>
                <div className="ac-avatar">
                  {c.avatar ? (
                    <img src={c.avatar} alt={`${c.first} ${c.last}`} />
                  ) : (
                    <span className="ini">{ini(c)}</span>
                  )}
                </div>
                <div className="ac-body">
                  <div className="ac-name">{c.first} {c.last}</div>
                  <div className="ac-sport">
                    {c.emoji} {c.sport}{c.discipline ? ' · ' + c.discipline : ''}
                  </div>
                  <span className="ac-link" style={{ marginTop: 14 }}>Voir le CV →</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
