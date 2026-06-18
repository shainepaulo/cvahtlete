'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Pack { name: string; perks: string[]; durationDays?: number }
interface User {
  id: string; name: string; email: string; role: string; plan?: string | null
  planName?: string; planExpires?: string; modificationsLeft?: number
  entitlements?: { cinematic: boolean }
  cv?: { slug: string; visibility: string } | null
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [packs, setPacks] = useState<Record<string, Pack>>({})

  useEffect(() => {
    async function load() {
      const [rUser, rPacks] = await Promise.all([
        fetch('/api/me').then((r) => r.json()),
        fetch('/api/packs').then((r) => r.json()),
      ])
      if (!rUser.user) { router.push('/login?next=/dashboard'); return }
      setUser(rUser.user)
      setPacks(rPacks.packs || {})
    }
    load()
  }, [router])

  async function logout() {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/')
  }

  if (!user) return <div className="app-wrap"><div className="app-head"><h1>Chargement…</h1></div></div>

  const pack = user.plan ? packs[user.plan] : null
  const mods = user.modificationsLeft === -1 ? 'illimitées' : (user.modificationsLeft ?? 0) + ' restantes'
  const firstName = user.name?.split(' ')[0] || 'athlète'

  return (
    <div className="app-wrap wide">
      <div className="app-head" style={{ textAlign: 'left' }}>
        <span className="tag">Mon compte</span>
        <h1>Bonjour, {firstName}.</h1>
        <p>
          {user.email}
          {user.role === 'owner' && (
            <> · <strong style={{ color: 'var(--gold)' }}>Owner / Admin</strong></>
          )}
        </p>
      </div>
      <div className="dash-grid">
        <div className="dash-plan">
          <span className={`pill${pack ? '' : ' none'}`}>{pack ? pack.name : 'Aucune offre'}</span>
          <h2>{pack ? pack.name : 'Choisis ton offre'}</h2>
          {pack ? (
            <>
              <ul className="perks">{pack.perks.map((p, i) => <li key={i}>{p}</li>)}</ul>
              <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>
                Modifications : <strong>{mods}</strong>
                {user.planExpires && ` · valable jusqu'au ${new Date(user.planExpires).toLocaleDateString('fr-FR')}`}
              </p>
            </>
          ) : (
            <>
              <p style={{ color: 'var(--muted)', margin: '14px 0 22px' }}>
                Tu n&apos;as pas encore d&apos;offre. Choisis un pack pour débloquer ton répertoire.
              </p>
              <Link href="/tarifs" className="btn btn-primary">Voir les offres</Link>
            </>
          )}
        </div>
        <div className="dash-aside">
          <Link href={pack ? '/builder' : '/tarifs'} className={`dash-link${pack ? '' : ' lock'}`}>
            <span>
              <span className="t">{pack ? 'Mon répertoire' : 'Créer mon répertoire'}</span>
              <span className="d">{pack ? 'Construis et mets à jour ta page' : "Disponible après l'achat d'une offre"}</span>
            </span>
            <span className="arrow">{pack ? '→' : '🔒'}</span>
          </Link>
          {user.cv && (
            <Link href="/profil?me=1" target="_blank" className="dash-link">
              <span>
                <span className="t">Voir ma page</span>
                <span className="d">Aperçu public de ton CV</span>
              </span>
              <span className="arrow">↗</span>
            </Link>
          )}
          {user.cv?.slug && user.entitlements?.cinematic && (
            <Link href={`/cine?u=${user.cv.slug}`} target="_blank" className="dash-link">
              <span>
                <span className="t">🎬 Mode cinématique</span>
                <span className="d">Ton CV en version immersive (Pro)</span>
              </span>
              <span className="arrow">↗</span>
            </Link>
          )}
          {user.role === 'owner' && (
            <Link href="/admin" className="dash-link">
              <span>
                <span className="t">Espace Admin</span>
                <span className="d">Gérer les comptes & offres</span>
              </span>
              <span className="arrow">→</span>
            </Link>
          )}
          <button className="dash-link" style={{ background: 'none', border: '1px solid var(--border)', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-body)' }} onClick={logout}>
            <span>
              <span className="t">Déconnexion</span>
              <span className="d">Fermer la session</span>
            </span>
            <span className="arrow">⎋</span>
          </button>
        </div>
      </div>
    </div>
  )
}
