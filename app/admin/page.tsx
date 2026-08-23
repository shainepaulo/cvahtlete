import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import AdminUsersDashboard, { type AdminUserRow } from '@/components/admin/AdminUsersDashboard'

interface Params {
  searchParams: {
    q?: string
    page?: string
    status?: string
    plan?: string
  }
}

/**
 * Espace Admin — réservé au owner (godpower) et super_admin.
 * Double protection : middleware + vérification serveur.
 * Entièrement paginé et filtrable côté serveur.
 */
export default async function AdminPage({ searchParams }: Params) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/login')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin')

  // Profil de l'utilisateur connecté (sans charger admin_force_contact_mask pour tolérer l'absence de colonne)
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, is_owner, is_super_admin, account_status')
    .eq('id', user.id)
    .single()

  if (profile?.account_status && profile.account_status !== 'active') redirect('/login?error=inactive')
  if (!profile?.is_owner && !profile?.is_super_admin) redirect('/dashboard')

  // Récupération sécurisée du masquage de contact (optionnel)
  let adminForceContactMask = true
  const { data: maskData } = await supabase
    .from('profiles')
    .select('admin_force_contact_mask')
    .eq('id', user.id)
    .maybeSingle()
  if (maskData) {
    adminForceContactMask = maskData.admin_force_contact_mask ?? true
  }

  // Paramètres de filtrage et pagination
  const query = String(searchParams.q ?? '').trim()
  const statusFilter = String(searchParams.status ?? 'all').trim()
  const planFilter = String(searchParams.plan ?? 'all').trim()
  const page = Math.max(1, parseInt(String(searchParams.page ?? '1'), 10))
  const pageSize = 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const admin = createAdminClient()

  // Construction de la requête filtrée côté PostgreSQL
  let dbQuery = admin
    .from('profiles')
    .select('id, email, full_name, plan, account_status, is_owner, is_super_admin, created_at', { count: 'exact' })

  if (query) {
    dbQuery = dbQuery.or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
  }
  if (statusFilter !== 'all') {
    dbQuery = dbQuery.eq('account_status', statusFilter)
  }
  if (planFilter !== 'all') {
    dbQuery = dbQuery.eq('plan', planFilter)
  }

  const { data: profiles, count, error } = await dbQuery
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('[admin] Erreur lors du chargement des profils :', error.message)
  }

  const usersList = (profiles ?? [])
  const userIds = usersList.map((u) => u.id)

  // Joindre les CVs correspondants aux utilisateurs affichés (multi-CV)
  const cvsMap = new Map<string, Array<{ id: string; slug: string; visibility: string; first: string; last: string; cinematic_enabled: boolean }>>()
  if (userIds.length > 0) {
    const { data: cvRows } = await admin
      .from('cvs')
      .select('id, slug, visibility, first, last, user_id, cinematic_enabled')
      .in('user_id', userIds)
      .order('created_at', { ascending: true })

    if (cvRows) {
      cvRows.forEach((row) => {
        const uid = String(row.user_id)
        const cv = {
          id: String(row.id),
          slug: String(row.slug),
          visibility: String(row.visibility),
          first: String(row.first),
          last: String(row.last),
          cinematic_enabled: !!row.cinematic_enabled,
        }
        const existing = cvsMap.get(uid) ?? []
        cvsMap.set(uid, [...existing, cv])
      })
    }
  }

  // Joindre les souscriptions correspondantes aux utilisateurs affichés (10 max)
  const subsMap = new Map<string, { status: string; trial_ends_at: string | null }>()
  if (userIds.length > 0) {
    const { data: subRows } = await admin
      .from('subscriptions')
      .select('user_id, status, trial_ends_at')
      .in('user_id', userIds)

    if (subRows) {
      subRows.forEach((row) => {
        subsMap.set(String(row.user_id), {
          status: String(row.status),
          trial_ends_at: row.trial_ends_at ? String(row.trial_ends_at) : null,
        })
      })
    }
  }

  // Fusionner les données pour le composant client
  const users: AdminUserRow[] = usersList.map((p) => {
    const cvs = cvsMap.get(p.id) ?? []
    const sub = subsMap.get(p.id) ?? null
    return {
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      plan: p.plan,
      account_status: p.account_status,
      is_owner: p.is_owner,
      is_super_admin: p.is_super_admin,
      created_at: p.created_at,
      trial_ends_at: sub?.trial_ends_at ?? null,
      sub_status: sub?.status ?? null,
      cvs,
      cv: cvs[0] ?? null,  // compat backward
    }
  })

  return (
    <div className="app-wrap wide">
      <div className="app-head" style={{ textAlign: 'left' }}>
        <span className="tag">Admin · Godpower{profile?.is_super_admin ? ' · Super admin' : ''}</span>
        <h1>Espace propriétaire.</h1>
        <p>
          Connecté en {profile?.is_super_admin ? 'super admin' : 'owner'} :
          <strong style={{ color: 'var(--gold)' }}> {profile.email}</strong>
        </p>
      </div>

      <div className="app-card" style={{ display: 'grid', gap: 18 }}>
        <div className="app-head" style={{ textAlign: 'left', marginBottom: 4 }}>
          <h1 style={{ fontSize: '1.4rem' }}>Privilèges actifs</h1>
        </div>
        <ul className="perks" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <li>✅ Lecture &amp; écriture sur tous les CV (policies RLS owner)</li>
          <li>✅ Accès aux abonnements et détails des essais gratuits de tous les comptes</li>
          <li>✅ Modifications et attribution manuelle d’offres (Starter, Pro, Club)</li>
          <li>✅ Rôle défini en base — impossible à auto-attribuer par un autre compte</li>
          {profile?.is_super_admin && <li>✅ Super admin : droits maximaux sur l’administration des comptes</li>}
        </ul>
        <p style={{ color: 'var(--muted-2)', fontSize: '.86rem' }}>
          La console ci-dessous permet de suspendre, révoquer ou réactiver un compte, de gérer les offres manuellement ou de prolonger la période d&apos;essai Pro de 3 jours.
        </p>
      </div>

      <AdminUsersDashboard
        currentEmail={profile.email}
        rows={users}
        totalCount={count ?? 0}
        currentPage={page}
        pageSize={pageSize}
        initialMasked={adminForceContactMask}
      />

      <div className="app-card" style={{ marginTop: 20 }}>
        <p style={{ color: 'var(--muted-2)', fontSize: '.82rem' }}>
          Suspendu : accès temporairement bloqué. Révoqué : accès coupé de manière définitive côté application. Les actions sur les offres s’appliquent immédiatement en base de données.
        </p>
        <Link href="/dashboard" className="btn btn-ghost" style={{ marginTop: 22 }}>← Mon compte</Link>
      </div>
    </div>
  )
}
