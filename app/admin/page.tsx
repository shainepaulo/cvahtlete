'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AdminUser {
  id: string; name: string; email: string; role: string; plan?: string | null
  createdAt?: string; cv?: { visibility: string } | null
}

const PLANS = ['', 'starter', 'pro', 'club']

export default function AdminPage() {
  const router = useRouter()
  const [me, setMe] = useState<AdminUser | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [flash, setFlash] = useState<{ msg: string; ok: boolean } | null>(null)

  useEffect(() => {
    async function load() {
      const rMe = await fetch('/api/me').then((r) => r.json())
      if (!rMe.user) { router.push('/login?next=/admin'); return }
      if (rMe.user.role !== 'owner') { setMe(rMe.user); return }
      setMe(rMe.user)
      const rUsers = await fetch('/api/admin/users').then((r) => r.json()).catch(() => ({ users: [] }))
      setUsers(rUsers.users || [])
    }
    load()
  }, [router])

  function showFlash(msg: string, ok = true) {
    setFlash({ msg, ok })
    if (ok) setTimeout(() => setFlash(null), 1800)
  }

  async function updateUser(id: string, patch: Record<string, string>) {
    try {
      const r = await fetch(`/api/admin/users/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const j = await r.json()
      if (!r.ok) { showFlash(j.error || 'Erreur', false); return }
      showFlash('Mis à jour ✓')
      setUsers((us) => us.map((u) => u.id === id ? { ...u, ...patch } : u))
    } catch { showFlash('Erreur', false) }
  }

  async function deleteUser(id: string) {
    if (!confirm('SUPPRIMER ce compte définitivement ? Action irréversible.')) return
    try {
      const r = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      const j = await r.json()
      if (!r.ok) { showFlash(j.error || 'Erreur', false); return }
      setUsers((us) => us.filter((u) => u.id !== id))
      showFlash('Compte supprimé')
    } catch { showFlash('Erreur', false) }
  }

  async function deleteCv(id: string) {
    if (!confirm('Supprimer le CV de ce compte ? Le compte est conservé.')) return
    try {
      const r = await fetch(`/api/admin/users/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearCv: true }),
      })
      const j = await r.json()
      if (!r.ok) { showFlash(j.error || 'Erreur', false); return }
      setUsers((us) => us.map((u) => u.id === id ? { ...u, cv: null } : u))
      showFlash('CV supprimé')
    } catch { showFlash('Erreur', false) }
  }

  if (!me) {
    return <div className="app-wrap"><div className="app-head"><h1>Chargement…</h1></div></div>
  }

  if (me.role !== 'owner') {
    return (
      <div className="app-wrap">
        <div className="app-card">
          <div className="app-head">
            <h1>Accès réservé</h1>
            <p>Cet espace est réservé à l&apos;administrateur.</p>
          </div>
          <a className="btn btn-ghost btn-block" href="/dashboard">← Mon compte</a>
        </div>
      </div>
    )
  }

  return (
    <div className="app-wrap xwide">
      <div className="app-head" style={{ textAlign: 'left' }}>
        <span className="tag">Admin</span>
        <h1>
          Comptes{' '}
          <span style={{ color: 'var(--muted)', fontSize: '1.4rem' }}>({users.length})</span>
        </h1>
        <p>Gère les rôles et les offres. Connecté en owner : {me.email}</p>
      </div>

      {flash && (
        <div className={`alert ${flash.ok ? 'ok' : 'err'}`} style={{ marginBottom: 14 }}>
          {flash.msg}
        </div>
      )}

      <div className="app-card" style={{ padding: '8px 24px', overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Compte</th><th>Rôle</th><th>Offre</th><th>CV</th><th>Inscrit</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.name || '—'}</strong><br />
                  <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{u.email}</span>
                </td>
                <td>
                  <select
                    defaultValue={u.role === 'owner' ? 'owner' : 'user'}
                    disabled={u.id === me.id}
                    onChange={(e) => updateUser(u.id, { role: e.target.value })}
                  >
                    <option value="user">user</option>
                    <option value="owner">owner</option>
                  </select>
                </td>
                <td>
                  <select
                    defaultValue={u.plan || ''}
                    onChange={(e) => updateUser(u.id, { plan: e.target.value })}
                  >
                    {PLANS.map((p) => (
                      <option key={p} value={p}>{p || '—'}</option>
                    ))}
                  </select>
                </td>
                <td>
                  {u.cv ? `✓ ${u.cv.visibility === 'public' ? '🌐' : '🔒'}` : '—'}
                </td>
                <td style={{ color: 'var(--muted)', fontSize: '.85rem' }}>
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : ''}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {u.cv && (
                    <button className="mini-btn" onClick={() => deleteCv(u.id)} title="Supprimer le CV">
                      🗑 CV
                    </button>
                  )}
                  {u.id !== me.id && (
                    <button className="mini-btn danger" onClick={() => deleteUser(u.id)} title="Supprimer le compte">
                      🗑 Compte
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
