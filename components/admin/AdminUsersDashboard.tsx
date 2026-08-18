'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { updateAccountStatus, setCvVisibility, updateUserPlan, extendTrial } from '@/app/actions/admin'

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
  cv: { id: string; slug: string; visibility: string; first: string; last: string } | null
}

interface AdminUsersDashboardProps {
  currentEmail: string
  rows: AdminUserRow[]
  totalCount: number
  currentPage: number
  pageSize: number
}

function planLabel(plan: string): string {
  switch (plan) {
    case 'free': return 'Free'
    case 'starter': return 'Starter'
    case 'pro': return 'Pro'
    case 'club': return 'Club'
    default: return plan
  }
}

function planBadgeColor(plan: string): string {
  switch (plan) {
    case 'free': return 'rgba(255,255,255,0.1)'
    case 'starter': return 'rgba(59, 130, 246, 0.15)'
    case 'pro': return 'rgba(234, 179, 8, 0.15)'
    case 'club': return 'rgba(16, 185, 129, 0.15)'
    default: return 'rgba(255,255,255,0.1)'
  }
}

function planTextColor(plan: string): string {
  switch (plan) {
    case 'free': return 'var(--muted-2)'
    case 'starter': return '#60a5fa'
    case 'pro': return 'var(--gold)'
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

function UserRow({ row, currentEmail }: { row: AdminUserRow; currentEmail: string }) {
  const isSelf = row.email.toLowerCase() === currentEmail.toLowerCase()
  const canManage = !isSelf && !row.is_super_admin
  
  const [statusPending, startStatusTransition] = useTransition()
  const [planPending, startPlanTransition] = useTransition()
  const [trialPending, startTrialTransition] = useTransition()
  const [visPending, startVisTransition] = useTransition()

  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [planMsg, setPlanMsg] = useState<string | null>(null)
  const [trialMsg, setTrialMsg] = useState<string | null>(null)
  const [visMsg, setVisMsg] = useState<string | null>(null)

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
  const handleVisChange = (visibility: 'public' | 'private') => {
    setVisMsg(null)
    if (!row.cv) return
    startVisTransition(async () => {
      const formData = new FormData()
      formData.append('cv_id', row.cv!.id)
      formData.append('visibility', visibility)
      const res = await setCvVisibility({}, formData)
      if (res.error) setVisMsg(res.error)
      else setVisMsg(res.ok ?? 'Visibilité mise à jour.')
    })
  }

  const isTrialActive = row.sub_status === 'trialing' && row.trial_ends_at && new Date(row.trial_ends_at) > new Date()
  const isTrialExpired = row.sub_status === 'trialing' && row.trial_ends_at && new Date(row.trial_ends_at) <= new Date()

  return (
    <>
      {/* Colonne Identité */}
      <td style={{ padding: '16px 12px', verticalAlign: 'top' }}>
        <div style={{ display: 'grid', gap: 3 }}>
          <strong style={{ fontSize: '0.95rem' }}>{row.full_name || 'Sans nom'}</strong>
          <span style={{ color: 'var(--muted-2)', fontSize: '0.82rem' }}>{row.email}</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', fontFamily: 'monospace' }}>ID: {row.id}</span>
          {row.cv ? (
            <div style={{ marginTop: 8, fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)', display: 'grid', gap: 4 }}>
              <span>📝 CV: <strong>{row.cv.first} {row.cv.last}</strong></span>
              <span>🔗 Slug: <a href={`/${row.cv.slug}`} target="_blank" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>/{row.cv.slug}</a></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Visibilité: <strong style={{ color: row.cv.visibility === 'public' ? 'var(--accent-2)' : 'var(--muted)' }}>{row.cv.visibility === 'public' ? 'Public' : 'Privé'}</strong>
                {canManage && (
                  <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                    <button onClick={() => handleVisChange('public')} disabled={visPending || row.cv!.visibility === 'public'} className="mini-btn" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>Public</button>
                    <button onClick={() => handleVisChange('private')} disabled={visPending || row.cv!.visibility === 'private'} className="mini-btn danger" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>Privé</button>
                  </div>
                )}
              </span>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <a href={`/builder/classique?u=${row.id}`} className="mini-btn" style={{ background: 'rgba(56, 216, 255, 0.1)', color: '#38d8ff', textDecoration: 'none', padding: '4px 8px', fontSize: '0.7rem', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  ✏️ Modifier classique
                </a>
                <a href={`/builder/cinematique?u=${row.id}`} className="mini-btn" style={{ background: 'rgba(234, 179, 8, 0.1)', color: 'var(--gold)', textDecoration: 'none', padding: '4px 8px', fontSize: '0.7rem', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  🎬 Modifier cinématique
                </a>
              </div>
              {visMsg && <span style={{ color: 'var(--muted-2)', fontSize: '0.7rem', display: 'block', marginTop: 2 }}>{visMsg}</span>}
            </div>
          ) : (
            <span style={{ color: 'var(--muted-2)', fontSize: '0.78rem', fontStyle: 'italic', marginTop: 4 }}>Aucun CV créé</span>
          )}
        </div>
      </td>

      {/* Rôles & Privilèges */}
      <td style={{ padding: '16px 12px', verticalAlign: 'top' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
          {row.is_super_admin ? (
            <span className="tag" style={{ background: 'linear-gradient(135deg, var(--gold), #ffb800)', color: '#000', fontWeight: 'bold' }}>Super Admin</span>
          ) : row.is_owner ? (
            <span className="tag" style={{ background: 'var(--gold)', color: '#000' }}>Owner</span>
          ) : (
            <span className="tag" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--muted)' }}>Membre</span>
          )}
        </div>
      </td>

      {/* Colonne Plan & Offres (Avec Formulaire Modifiable) */}
      <td style={{ padding: '16px 12px', verticalAlign: 'top' }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="tag" style={{ background: planBadgeColor(row.plan), color: planTextColor(row.plan), fontWeight: 'bold', fontSize: '0.78rem' }}>
              {planLabel(row.plan)}
            </span>
          </div>

          {canManage && (
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', color: '#fff', borderRadius: 4, padding: '4px 6px', fontSize: '0.75rem', outline: 'none' }}
              >
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="club">Club</option>
              </select>
              <button onClick={handlePlanChange} disabled={planPending || selectedPlan === row.plan} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: 4 }}>
                {planPending ? '…' : 'Changer'}
              </button>
            </div>
          )}
          {planMsg && <span style={{ color: 'var(--muted-2)', fontSize: '0.72rem' }}>{planMsg}</span>}
        </div>
      </td>

      {/* Abonnement / Infos Essai (Avec Formulaire Prolongation) */}
      <td style={{ padding: '16px 12px', verticalAlign: 'top' }}>
        <div style={{ display: 'grid', gap: 6, fontSize: '0.82rem' }}>
          {row.sub_status ? (
            <div style={{ display: 'grid', gap: 4 }}>
              <span>Statut: <strong style={{ color: row.sub_status === 'active' ? 'var(--accent-2)' : row.sub_status === 'trialing' ? 'var(--gold)' : 'var(--red)' }}>{row.sub_status}</strong></span>
              {row.trial_ends_at && (
                <span style={{ fontSize: '0.78rem', color: isTrialExpired ? 'var(--red)' : 'var(--muted)' }}>
                  {isTrialActive && `⏳ Essai actif : finit le ${new Date(row.trial_ends_at).toLocaleDateString('fr-FR')}`}
                  {isTrialExpired && `⌛ Essai expiré le ${new Date(row.trial_ends_at).toLocaleDateString('fr-FR')}`}
                </span>
              )}
            </div>
          ) : (
            <span style={{ color: 'var(--muted-2)', fontStyle: 'italic' }}>Aucune info</span>
          )}

          {canManage && (row.sub_status === 'trialing' || isTrialExpired || row.plan === 'free') && (
            <div style={{ display: 'grid', gap: 6, marginTop: 6, padding: 8, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 6 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted-2)' }}>Prolonger l&apos;essai Pro :</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={extendDays}
                  onChange={(e) => setExtendDays(Math.max(1, parseInt(e.target.value, 10)))}
                  style={{ width: 50, background: 'var(--bg-2)', border: '1px solid var(--border-2)', color: '#fff', borderRadius: 4, padding: '4px', fontSize: '0.75rem', textAlign: 'center' }}
                />
                <span style={{ fontSize: '0.75rem', alignSelf: 'center', color: 'var(--muted-2)' }}>jours</span>
                <button onClick={handleExtendTrial} disabled={trialPending} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: 4, marginLeft: 'auto' }}>
                  {trialPending ? '…' : 'Accorder'}
                </button>
              </div>
              {trialMsg && <span style={{ color: 'var(--muted-2)', fontSize: '0.72rem' }}>{trialMsg}</span>}
            </div>
          )}
        </div>
      </td>

      {/* Compte Statut (Actif/Suspendu/Révoqué) */}
      <td style={{ padding: '16px 12px', verticalAlign: 'top' }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <span style={{ color: statusColor(row.account_status), fontWeight: 700, fontSize: '0.88rem' }}>
            {statusLabel(row.account_status)}
          </span>
          {canManage && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              <button onClick={() => handleStatusChange('active')} disabled={statusPending || row.account_status === 'active'} className="mini-btn" style={{ fontSize: '0.65rem' }}>Activer</button>
              <button onClick={() => handleStatusChange('suspended')} disabled={statusPending || row.account_status === 'suspended'} className="mini-btn" style={{ fontSize: '0.65rem', background: 'rgba(234,179,8,0.1)', color: 'var(--gold)' }}>Suspendre</button>
              <button onClick={() => handleStatusChange('revoked')} disabled={statusPending || row.account_status === 'revoked'} className="mini-btn danger" style={{ fontSize: '0.65rem' }}>Révoquer</button>
            </div>
          )}
          {statusMsg && <span style={{ color: 'var(--muted-2)', fontSize: '0.72rem' }}>{statusMsg}</span>}
        </div>
      </td>
    </>
  )
}

export default function AdminUsersDashboard({ currentEmail, rows, totalCount, currentPage, pageSize }: AdminUsersDashboardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [planFilter, setPlanFilter] = useState(searchParams.get('plan') || 'all')

  const totalPages = Math.ceil(totalCount / pageSize)

  // Effectuer les recherches/filtres côté URL
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
      // Revenir en page 1 si on change les filtres
      params.set('page', '1')
    }

    router.push(`${pathname}?${params.toString()}`)
  }, [searchParams, pathname, router])

  // Permet de debounce la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== (searchParams.get('q') || '')) {
        applyFilters({ q: query })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [query, searchParams, applyFilters])

  return (
    <div className="admin-shell" style={{ display: 'grid', gap: 24 }}>
      {/* Barre de filtres et recherche */}
      <div className="app-card" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 10, padding: 18 }}>
        <div style={{ display: 'grid', gap: 4 }}>
          <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', margin: 0, fontWeight: 700 }}>Filtres &amp; Recherche</h2>
          <p style={{ color: 'var(--muted-2)', fontSize: '0.8rem', margin: 0 }}>Recherche instantanée et filtrage serveur.</p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%', marginTop: 10 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom ou e-mail..."
            style={{ flex: '1 1 240px', background: 'var(--bg-2)', border: '1px solid var(--border-2)', color: 'var(--text)', borderRadius: 6, padding: '10px 14px', fontSize: '0.88rem', fontFamily: 'var(--font-body)', outline: 'none' }}
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              applyFilters({ status: e.target.value })
            }}
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', color: 'var(--text)', borderRadius: 6, padding: '10px 14px', fontSize: '0.88rem', fontFamily: 'var(--font-body)', outline: 'none' }}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="suspended">Suspendu</option>
            <option value="revoked">Révoqué</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value)
              applyFilters({ plan: e.target.value })
            }}
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', color: 'var(--text)', borderRadius: 6, padding: '10px 14px', fontSize: '0.88rem', fontFamily: 'var(--font-body)', outline: 'none' }}
          >
            <option value="all">Tous les plans</option>
            <option value="free">Plan Free</option>
            <option value="starter">Plan Starter</option>
            <option value="pro">Plan Pro</option>
            <option value="club">Plan Club</option>
          </select>
        </div>
      </div>

      {/* Tableau principal */}
      <div className="app-card" style={{ display: 'grid', gap: 18, background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', fontWeight: 700, margin: 0 }}>Comptes Utilisateurs</h2>
          <span style={{ color: 'var(--muted-2)', fontSize: '0.85rem' }}>{totalCount} utilisateur(s) trouvé(s)</span>
        </div>

        <div style={{ overflowX: 'auto', margin: '0 -20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted-2)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Identité &amp; CV</th>
                <th style={{ padding: '14px 12px', fontWeight: 600 }}>Rôles</th>
                <th style={{ padding: '14px 12px', fontWeight: 600 }}>Offre Actuelle</th>
                <th style={{ padding: '14px 12px', fontWeight: 600 }}>Abonnement / Essai</th>
                <th style={{ padding: '14px 12px', fontWeight: 600 }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--border)', background: 'transparent' }} className="admin-tr">
                  <UserRow row={row} currentEmail={currentEmail} />
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '40px 20px', color: 'var(--muted-2)', textAlign: 'center', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    Aucun compte ne correspond à ces critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 15, marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
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
