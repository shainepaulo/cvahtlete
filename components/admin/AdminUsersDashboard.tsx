'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { 
  updateAccountStatus, 
  setCvVisibility, 
  updateUserPlan, 
  extendTrial, 
  deleteUser, 
  setCinematicEnabled,
  toggleAdminContactMask
} from '@/app/actions/admin'

type AccountStatus = 'active' | 'suspended' | 'revoked'

export interface AdminUserRow {
  id: string
  email: string
  full_name: string
  plan: string
  account_status: string
  is_owner: boolean
  is_super_admin: boolean
  created_at: string
  trial_ends_at: string | null
  sub_status: string | null
  cvs: Array<{ id: string; slug: string; visibility: string; first: string; last: string; cinematic_enabled?: boolean }>
  /** @deprecated use cvs[0] — kept for backward compat */
  cv: { id: string; slug: string; visibility: string; first: string; last: string; cinematic_enabled?: boolean } | null
}

interface AdminUsersDashboardProps {
  currentEmail: string
  rows: AdminUserRow[]
  totalCount: number
  currentPage: number
  pageSize: number
  initialMasked: boolean
}

function planLabel(plan: string): string {
  switch (plan) {
    case 'free': return 'Free'
    case 'starter': return 'Starter'
    case 'pro': return 'Pro'
    case 'season': return 'Saison'
    case 'club': return 'Club'
    default: return plan
  }
}

function planBadgeColor(plan: string): string {
  switch (plan) {
    case 'free': return 'rgba(255,255,255,0.06)'
    case 'starter': return 'rgba(59, 130, 246, 0.12)'
    case 'pro': return 'rgba(234, 179, 8, 0.12)'
    case 'season': return 'rgba(234, 179, 8, 0.15)'
    case 'club': return 'rgba(16, 185, 129, 0.12)'
    default: return 'rgba(255,255,255,0.06)'
  }
}

function planTextColor(plan: string): string {
  switch (plan) {
    case 'free': return 'var(--muted-2)'
    case 'starter': return '#60a5fa'
    case 'pro': return 'var(--gold)'
    case 'season': return 'var(--gold)'
    case 'club': return '#34d399'
    default: return '#fff'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Actif'
    case 'suspended': return 'Suspendu'
    case 'revoked': return 'Révoqué'
    default: return status
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'active': return 'var(--accent-2)'
    case 'suspended': return 'var(--gold)'
    case 'revoked': return 'var(--red)'
    default: return 'var(--muted)'
  }
}

function UserCard({ row, currentEmail }: { row: AdminUserRow; currentEmail: string }) {
  const isSelf = row.email.toLowerCase() === currentEmail.toLowerCase()
  const canManage = !isSelf && !row.is_super_admin
  
  const [statusPending, startStatusTransition] = useTransition()
  const [planPending, startPlanTransition] = useTransition()
  const [trialPending, startTrialTransition] = useTransition()
  const [visPending, startVisTransition] = useTransition()
  const [deletePending, startDeleteTransition] = useTransition()
  const [cinePending, startCineTransition] = useTransition()

  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [planMsg, setPlanMsg] = useState<string | null>(null)
  const [trialMsg, setTrialMsg] = useState<string | null>(null)
  const [visMsg, setVisMsg] = useState<string | null>(null)
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null)
  const [cineMsg, setCineMsg] = useState<string | null>(null)

  const [selectedPlan, setSelectedPlan] = useState(row.plan)
  const [extendDays, setExtendDays] = useState(3)

  // Status handler
  const handleStatusChange = (status: AccountStatus) => {
    setStatusMsg(null)
    startStatusTransition(async () => {
      const formData = new FormData()
      formData.append('email', row.email)
      formData.append('account_status', status)
      const res = await updateAccountStatus({}, formData)
      if (res.error) setStatusMsg(res.error)
      else setStatusMsg(res.ok ?? 'Statut mis à jour.')
    })
  }

  // Plan handler
  const handlePlanChange = () => {
    setPlanMsg(null)
    startPlanTransition(async () => {
      const formData = new FormData()
      formData.append('user_id', row.id)
      formData.append('plan', selectedPlan)
      const res = await updateUserPlan({}, formData)
      if (res.error) setPlanMsg(res.error)
      else setPlanMsg(res.ok ?? 'Plan mis à jour.')
    })
  }

  // Trial extension handler
  const handleExtendTrial = () => {
    setTrialMsg(null)
    startTrialTransition(async () => {
      const formData = new FormData()
      formData.append('user_id', row.id)
      formData.append('days', String(extendDays))
      const res = await extendTrial({}, formData)
      if (res.error) setTrialMsg(res.error)
      else setTrialMsg(res.ok ?? 'Essai prolongé.')
    })
  }

  // CV visibility handler
  const handleVisChange = (visibility: 'public' | 'private', cvId: string) => {
    setVisMsg(null)
    startVisTransition(async () => {
      const formData = new FormData()
      formData.append('cv_id', cvId)
      formData.append('visibility', visibility)
      const res = await setCvVisibility({}, formData)
      if (res.error) setVisMsg(res.error)
      else setVisMsg(res.ok ?? 'Visibilité mise à jour.')
    })
  }

  // Cinematic toggle handler
  const handleCineToggle = (enabled: boolean) => {
    setCineMsg(null)
    startCineTransition(async () => {
      const formData = new FormData()
      formData.append('user_id', row.id)
      formData.append('enabled', String(enabled))
      const res = await setCinematicEnabled({}, formData)
      if (res.error) setCineMsg(res.error)
      else setCineMsg(res.ok ?? 'Mode cinématique mis à jour.')
    })
  }

  // Delete account handler
  const handleDelete = () => {
    const confirmed = window.confirm(
      `⚠️ SUPPRESSION IRRÉVERSIBLE\n\nSupprimer définitivement le compte de ${row.full_name || row.email} ?\n\nCette action est impossible à annuler.`
    )
    if (!confirmed) return
    setDeleteMsg(null)
    startDeleteTransition(async () => {
      const formData = new FormData()
      formData.append('user_id', row.id)
      const res = await deleteUser({}, formData)
      if (res.error) setDeleteMsg(res.error)
      else setDeleteMsg(res.ok ?? 'Compte supprimé.')
    })
  }

  const isTrialActive = row.sub_status === 'trialing' && row.trial_ends_at && new Date(row.trial_ends_at) > new Date()
  const isTrialExpired = row.sub_status === 'trialing' && row.trial_ends_at && new Date(row.trial_ends_at) <= new Date()

  return (
    <div className="admin-user-card">
      {/* 1. Colonne Gauche : Identité & CVs */}
      <div className="admin-user-card-left">
        <div style={{ display: 'grid', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{row.full_name || 'Sans nom'}</strong>
            {row.is_super_admin ? (
              <span className="tag" style={{ background: 'linear-gradient(135deg, var(--gold), #ffb800)', color: '#000', fontWeight: 'bold', fontSize: '0.7rem', padding: '2px 8px' }}>Super Admin</span>
            ) : row.is_owner ? (
              <span className="tag" style={{ background: 'var(--gold)', color: '#000', fontSize: '0.7rem', padding: '2px 8px' }}>Owner</span>
            ) : (
              <span className="tag" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--muted)', fontSize: '0.7rem', padding: '2px 8px' }}>Membre</span>
            )}
          </div>
          <span style={{ color: 'var(--muted-2)', fontSize: '0.85rem' }}>{row.email}</span>
          <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: '0.72rem', fontFamily: 'monospace' }}>ID: {row.id}</span>
        </div>

        {/* Liste des CV (multi-CV) */}
        <div style={{ display: 'grid', gap: 10, marginTop: 4 }}>
          {(row.cvs ?? (row.cv ? [row.cv] : [])).length > 0 ? (
            <>
              {(row.cvs ?? (row.cv ? [row.cv] : [])).map((cv) => (
                <div key={cv.id} style={{ 
                  fontSize: '0.8rem', 
                  background: 'rgba(255,255,255,0.02)', 
                  padding: '12px 14px', 
                  borderRadius: 8, 
                  border: '1px solid rgba(255,255,255,0.05)', 
                  display: 'grid', 
                  gap: 8 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <span>📝 CV: <strong>{cv.first} {cv.last}</strong></span>
                    <a href={`/${cv.slug}`} target="_blank" style={{ color: 'var(--gold)', textDecoration: 'underline', fontSize: '0.76rem' }}>
                      /{cv.slug} ↗
                    </a>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '4px 0' }}>
                    <span>Visibilité: <strong style={{ color: cv.visibility === 'public' ? 'var(--accent-2)' : 'var(--muted)' }}>{cv.visibility === 'public' ? 'Public' : 'Privé'}</strong></span>
                    {canManage && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => handleVisChange('public', cv.id)} disabled={visPending || cv.visibility === 'public'} className="mini-btn" style={{ padding: '2px 8px', fontSize: '0.65rem' }}>Public</button>
                        <button onClick={() => handleVisChange('private', cv.id)} disabled={visPending || cv.visibility === 'private'} className="mini-btn danger" style={{ padding: '2px 8px', fontSize: '0.65rem' }}>Privé</button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted-2)' }}>🎬 Mode cinématique :</span>
                    <strong style={{ fontSize: '0.72rem', color: cv.cinematic_enabled ? '#34d399' : 'var(--muted)' }}>
                      {cv.cinematic_enabled ? 'Activé' : 'Désactivé'}
                    </strong>
                    {canManage && (
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => handleCineToggle(true)}
                          disabled={cinePending || !!cv.cinematic_enabled}
                          className="mini-btn"
                          style={{ padding: '2px 8px', fontSize: '0.65rem', background: 'rgba(52,211,153,0.15)', color: '#34d399' }}
                        >
                          Activer
                        </button>
                        <button
                          onClick={() => handleCineToggle(false)}
                          disabled={cinePending || !cv.cinematic_enabled}
                          className="mini-btn danger"
                          style={{ padding: '2px 8px', fontSize: '0.65rem' }}
                        >
                          Désactiver
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginTop: 4, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <a href={`/builder/classique?u=${row.id}&cv=${cv.id}`} className="mini-btn" style={{ background: 'rgba(56, 216, 255, 0.08)', color: '#38d8ff', textDecoration: 'none', padding: '4px 8px', fontSize: '0.7rem', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }}>
                      ✏️ Éditer classique
                    </a>
                    <a href={`/builder/cinematique?u=${row.id}&cv=${cv.id}`} className="mini-btn" style={{ background: 'rgba(234, 179, 8, 0.08)', color: 'var(--gold)', textDecoration: 'none', padding: '4px 8px', fontSize: '0.7rem', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }}>
                      🎬 Éditer cinématique
                    </a>
                  </div>
                </div>
              ))}
              {cineMsg && <span style={{ color: cineMsg.startsWith('Mode') ? '#34d399' : 'var(--red)', fontSize: '0.72rem', display: 'block' }}>{cineMsg}</span>}
              {visMsg && <span style={{ color: 'var(--muted-2)', fontSize: '0.72rem', display: 'block' }}>{visMsg}</span>}
            </>
          ) : (
            <span style={{ color: 'var(--muted-2)', fontSize: '0.8rem', fontStyle: 'italic' }}>Aucun CV créé</span>
          )}

          {canManage && (row.plan === 'club' || row.is_owner || row.is_super_admin) && (
            <a
              href={`/builder/classique?u=${row.id}`}
              className="mini-btn"
              style={{ textDecoration: 'none', background: 'rgba(255,255,255,0.04)', color: '#fff', padding: '6px 12px', fontSize: '0.76rem', borderRadius: 6, textAlign: 'center', marginTop: 4 }}
            >
              + Ajouter un joueur
            </a>
          )}
        </div>
      </div>

      {/* 2. Colonne Droite : Offres, Essai & Statut */}
      <div className="admin-user-card-right">
        {/* Plan / Offres */}
        <div style={{ display: 'grid', gap: 6, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: 14, borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--muted-2)' }}>Offre actuelle :</span>
            <span className="tag" style={{ background: planBadgeColor(row.plan), color: planTextColor(row.plan), fontWeight: 'bold', fontSize: '0.78rem' }}>
              {planLabel(row.plan)}
            </span>
          </div>

          {canManage && (
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                style={{ flex: 1, background: 'var(--bg-2)', border: '1px solid var(--border-2)', color: '#fff', borderRadius: 6, padding: '6px 8px', fontSize: '0.78rem', outline: 'none' }}
              >
                <option value="free">Free</option>
                <option value="starter">Starter (Legacy)</option>
                <option value="pro">Pro (Legacy)</option>
                <option value="season">Pass Saison Pro</option>
                <option value="club">Club</option>
              </select>
              <button onClick={handlePlanChange} disabled={planPending || selectedPlan === row.plan} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.78rem', height: 'auto' }}>
                Changer
              </button>
            </div>
          )}
          {planMsg && <span style={{ color: 'var(--muted-2)', fontSize: '0.72rem' }}>{planMsg}</span>}
        </div>

        {/* Abonnement / Essai */}
        <div style={{ display: 'grid', gap: 6, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: 14, borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--muted-2)' }}>Statut abonnement :</span>
            <strong style={{ fontSize: '0.82rem', color: row.sub_status === 'active' ? 'var(--accent-2)' : row.sub_status === 'trialing' ? 'var(--gold)' : 'var(--red)' }}>
              {row.sub_status || 'Aucun'}
            </strong>
          </div>
          {row.trial_ends_at && (
            <span style={{ fontSize: '0.78rem', color: isTrialExpired ? 'var(--red)' : 'var(--muted)', marginTop: 2 }}>
              {isTrialActive && `⏳ Essai actif jusqu'au ${new Date(row.trial_ends_at).toLocaleDateString('fr-FR')}`}
              {isTrialExpired && `⌛ Essai expiré le ${new Date(row.trial_ends_at).toLocaleDateString('fr-FR')}`}
            </span>
          )}

          {canManage && (row.sub_status === 'trialing' || isTrialExpired || row.plan === 'free') && (
            <div style={{ display: 'grid', gap: 6, marginTop: 6, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted-2)' }}>Prolonger l&apos;essai Pro :</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={extendDays}
                  onChange={(e) => setExtendDays(Math.max(1, parseInt(e.target.value, 10)))}
                  style={{ width: 55, background: 'var(--bg-2)', border: '1px solid var(--border-2)', color: '#fff', borderRadius: 6, padding: '4px 6px', fontSize: '0.78rem', textAlign: 'center' }}
                />
                <span style={{ fontSize: '0.75rem', alignSelf: 'center', color: 'var(--muted-2)' }}>jours</span>
                <button onClick={handleExtendTrial} disabled={trialPending} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.74rem', height: 'auto', marginLeft: 'auto' }}>
                  Accorder
                </button>
              </div>
              {trialMsg && <span style={{ color: 'var(--muted-2)', fontSize: '0.72rem' }}>{trialMsg}</span>}
            </div>
          )}
        </div>

        {/* Actions de compte (Actif, suspendre, supprimer) */}
        <div style={{ display: 'grid', gap: 8, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: 14, borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--muted-2)' }}>Statut compte :</span>
            <span style={{ color: statusColor(row.account_status), fontWeight: 700, fontSize: '0.85rem' }}>
              {statusLabel(row.account_status)}
            </span>
          </div>

          {canManage && (
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              <button onClick={() => handleStatusChange('active')} disabled={statusPending || row.account_status === 'active'} className="mini-btn" style={{ flex: 1, padding: '4px 0', fontSize: '0.68rem', textAlign: 'center' }}>Activer</button>
              <button onClick={() => handleStatusChange('suspended')} disabled={statusPending || row.account_status === 'suspended'} className="mini-btn" style={{ flex: 1, padding: '4px 0', fontSize: '0.68rem', textAlign: 'center', background: 'rgba(234,179,8,0.08)', color: 'var(--gold)' }}>Suspendre</button>
              <button onClick={() => handleStatusChange('revoked')} disabled={statusPending || row.account_status === 'revoked'} className="mini-btn danger" style={{ flex: 1, padding: '4px 0', fontSize: '0.68rem', textAlign: 'center' }}>Révoquer</button>
            </div>
          )}
          {statusMsg && <span style={{ color: 'var(--muted-2)', fontSize: '0.72rem' }}>{statusMsg}</span>}

          {canManage && (
            <div style={{ marginTop: 4, paddingTop: 8, borderTop: '1px solid rgba(255,50,50,0.1)' }}>
              <button
                onClick={handleDelete}
                disabled={deletePending}
                className="mini-btn danger"
                style={{ fontSize: '0.72rem', width: '100%', padding: '6px 8px', borderRadius: 6 }}
              >
                {deletePending ? '⏳ Suppression…' : '🗑️ Supprimer le compte'}
              </button>
              {deleteMsg && (
                <span style={{ color: deleteMsg.startsWith('Le compte') ? '#34d399' : 'var(--red)', fontSize: '0.7rem', display: 'block', marginTop: 4, textAlign: 'center' }}>{deleteMsg}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminUsersDashboard({ 
  currentEmail, 
  rows, 
  totalCount, 
  currentPage, 
  pageSize, 
  initialMasked 
}: AdminUsersDashboardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [planFilter, setPlanFilter] = useState(searchParams.get('plan') || 'all')

  // Logique masquage forcé des coordonnées intégrée
  const [masked, setMasked] = useState(initialMasked)
  const [maskError, setMaskError] = useState<string | null>(null)
  const [maskPending, startMaskTransition] = useTransition()

  function handleToggleMask() {
    setMaskError(null)
    startMaskTransition(async () => {
      const res = await toggleAdminContactMask()
      if (res.error) setMaskError(res.error)
      else if (typeof res.masked === 'boolean') setMasked(res.masked)
    })
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const applyFilters = useCallback((newParams: { q?: string; status?: string; plan?: string; page?: string }) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (newParams.q !== undefined) {
      if (newParams.q) params.set('q', newParams.q)
      else params.delete('q')
    }
    if (newParams.status !== undefined) {
      if (newParams.status && newParams.status !== 'all') params.set('status', newParams.status)
      else params.delete('status')
    }
    if (newParams.plan !== undefined) {
      if (newParams.plan && newParams.plan !== 'all') params.set('plan', newParams.plan)
      else params.delete('plan')
    }
    if (newParams.page !== undefined) {
      params.set('page', newParams.page)
    } else {
      params.set('page', '1')
    }

    router.push(`${pathname}?${params.toString()}`)
  }, [searchParams, pathname, router])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== (searchParams.get('q') || '')) {
        applyFilters({ q: query })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [query, searchParams, applyFilters])

  return (
    <div className="admin-layout-grid">
      {/* ─── COLONNE GAUCHE (3/10) : Filtres & Vie privée ─── */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {/* Recherche et Filtres */}
        <div className="app-card" style={{ display: 'grid', gap: 16, padding: 22, background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-display)', margin: 0, fontWeight: 700 }}>Filtres &amp; Recherche</h2>
            <p style={{ color: 'var(--muted-2)', fontSize: '0.78rem', margin: '3px 0 0' }}>Recherche instantanée des comptes.</p>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mots-clés</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nom ou e-mail..."
                style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border-2)', color: 'var(--text)', borderRadius: 8, padding: '10px 12px', fontSize: '0.84rem', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statut</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  applyFilters({ status: e.target.value })
                }}
                style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border-2)', color: 'var(--text)', borderRadius: 8, padding: '10px 12px', fontSize: '0.84rem', outline: 'none' }}
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="suspended">Suspendu</option>
                <option value="revoked">Révoqué</option>
              </select>
            </div>

            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Offre</span>
              <select
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value)
                  applyFilters({ plan: e.target.value })
                }}
                style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border-2)', color: 'var(--text)', borderRadius: 8, padding: '10px 12px', fontSize: '0.84rem', outline: 'none' }}
              >
                <option value="all">Tous les plans</option>
                <option value="free">Plan Free</option>
                <option value="starter">Plan Starter</option>
                <option value="pro">Plan Pro</option>
                <option value="season">Pass Saison Pro</option>
                <option value="club">Plan Club</option>
              </select>
            </div>
          </div>
        </div>

        {/* Masquage des coordonnées */}
        <div className="app-card" style={{ display: 'grid', gap: 12, padding: 22, background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-display)', margin: 0, fontWeight: 700 }}>Sécurité des coordonnées</h2>
            <p style={{ color: 'var(--muted-2)', fontSize: '0.78rem', margin: '3px 0 0', lineHeight: 1.4 }}>
              Masquage universel : s&apos;applique à tous les CV que tu consultes.
            </p>
          </div>
          {maskError && <p style={{ color: 'var(--red)', fontSize: '.76rem', margin: 0 }}>{maskError}</p>}
          <button
            type="button"
            onClick={handleToggleMask}
            disabled={maskPending}
            className={`btn ${masked ? 'btn-ghost' : 'btn-primary'}`}
            style={{ width: '100%', padding: '10px 0', fontSize: '0.82rem', height: 'auto', borderRadius: 8 }}
          >
            {maskPending ? '…' : masked ? '🔒 Contacts floutés' : '🔓 Contacts visibles'}
          </button>
        </div>
      </div>

      {/* ─── COLONNE DROITE (7/10) : Liste des comptes ─── */}
      <div style={{ display: 'grid', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', fontWeight: 700, margin: 0 }}>Comptes Utilisateurs</h2>
          <span style={{ color: 'var(--muted-2)', fontSize: '0.82rem', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: 6 }}>
            {totalCount} utilisateur(s) trouvé(s)
          </span>
        </div>

        {/* Liste des comptes sous forme de cartes */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {rows.map((row) => (
            <UserCard key={row.id} row={row} currentEmail={currentEmail} />
          ))}

          {rows.length === 0 && (
            <div className="app-card" style={{ padding: '50px 20px', color: 'var(--muted-2)', textAlign: 'center', fontSize: '0.9rem', fontStyle: 'italic', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 12 }}>
              Aucun compte ne correspond à ces critères de recherche.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 15, marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
            <button
              onClick={() => applyFilters({ page: String(currentPage - 1) })}
              disabled={currentPage <= 1}
              className="btn btn-ghost"
              style={{ padding: '8px 16px', fontSize: '0.82rem' }}
            >
              ← Précédent
            </button>
            <span style={{ fontSize: '0.86rem', color: 'var(--muted-2)' }}>
              Page <strong>{currentPage}</strong> sur {totalPages}
            </span>
            <button
              onClick={() => applyFilters({ page: String(currentPage + 1) })}
              disabled={currentPage >= totalPages}
              className="btn btn-ghost"
              style={{ padding: '8px 16px', fontSize: '0.82rem' }}
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
