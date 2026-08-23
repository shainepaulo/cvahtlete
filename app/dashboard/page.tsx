import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { signOut } from '@/app/actions/auth'
import { listMyCvs } from '@/app/actions/cv'
import { TrialBanner } from '@/components/billing/TrialBanner'

const PLAN_LABEL: Record<string, string> = {
  free: 'Gratuit',
  starter: 'Starter (Legacy)',
  pro: 'Pro (Legacy)',
  season: 'Pass Saison Pro',
  club: 'Club',
}

const EMOJI: Record<string, string> = {
  Football: '⚽', Basket: '🏀', Handball: '🤾', Escrime: '🤺',
  Tennis: '🎾', Volley: '🏐', 'Athlétisme': '⚡', Rugby: '🏉', Autre: '🏅',
}

const CV_LIMIT = 15

export default async function DashboardPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/login')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard')

  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase.from('profiles').select('full_name, email, is_owner, is_super_admin, plan, account_status').eq('id', user.id).single(),
    supabase.from('subscriptions').select('status, trial_ends_at, plan, season_expires_at').eq('user_id', user.id).maybeSingle(),
  ])

  if (profile?.account_status && profile.account_status !== 'active') redirect('/login?error=inactive')

  const isSeasonExpired = !!(sub?.season_expires_at && new Date(sub.season_expires_at) < new Date())
  const isExpired = !!(
    (sub?.status === 'trialing' && sub.trial_ends_at && new Date(sub.trial_ends_at) < new Date()) ||
    (sub?.status === 'canceled' && sub.trial_ends_at) ||
    isSeasonExpired
  )
  const plan = isExpired ? 'free' : (profile?.plan ?? 'free')
  const hasPlan = plan !== 'free'
  const isOwner = !!profile?.is_owner || !!profile?.is_super_admin
  const isSuperAdmin = !!profile?.is_super_admin
  const firstName = (profile?.full_name || '').split(' ')[0] || 'athlète'
  const cinematic = isOwner || plan === 'pro' || plan === 'season' || plan === 'club'

  // Multi-CV : droits selon plan
  const canMultiCv = isOwner || plan === 'club'

  // Liste de tous les CV du compte
  const cvs = await listMyCvs()
  const canAddMore = isSuperAdmin || cvs.length < CV_LIMIT

  return (
    <div className="app-wrap wide">
      <div className="app-head" style={{ textAlign: 'left' }}>
        <span className="tag">Mon compte</span>
        <h1>Bonjour, {firstName}.</h1>
        <p>
          {profile?.email}
          {isSuperAdmin ? (
            <> · <strong style={{ color: 'var(--gold)' }}>Super admin · Godpower</strong></>
          ) : isOwner ? (
            <> · <strong style={{ color: 'var(--gold)' }}>Owner · Godpower</strong></>
          ) : null}
        </p>
      </div>

      {sub?.trial_ends_at && (sub?.status === 'trialing' || sub?.status === 'canceled') && !isSeasonExpired && (
        <TrialBanner trialEndsAt={sub.trial_ends_at} isExpired={isExpired} />
      )}

      <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>
        {/* Colonne gauche : plan + CV */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Plan */}
          <div className="dash-plan" style={{ margin: 0, height: 'auto' }}>
            <span className={`pill${hasPlan || isOwner ? '' : ' none'}`}>
              {isOwner ? 'Accès illimité' : PLAN_LABEL[plan]}
            </span>
            <h2>{isOwner ? 'Club · Godpower' : PLAN_LABEL[plan]}</h2>
            <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginTop: 12 }}>
              Modifications : <strong>illimitées</strong>
              {isOwner && ' · tous les privilèges débloqués'}
              {isSeasonExpired && (
                <span style={{ color: 'var(--red)', display: 'block', marginTop: '8px', fontWeight: 600 }}>
                  ⚠️ Ton Pass Saison Pro a expiré. Renseigne un nouveau pass pour réactiver les fonctionnalités Pro.
                </span>
              )}
            </p>
            {!hasPlan && !isOwner && (
              <div style={{ marginTop: '16px' }}>
                <Link href="/tarifs" className="btn btn-primary">Passer au Pass Pro</Link>
              </div>
            )}
          </div>

          {/* ── Liste des CV (multi-CV) ── */}
          <div className="app-card" style={{ padding: '20px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                  {canMultiCv ? 'Mes joueurs' : 'Mon CV'}
                </h3>
                {canMultiCv && (
                  <p style={{ color: 'var(--muted-2)', fontSize: '0.78rem', margin: '3px 0 0' }}>
                    {cvs.length} / {isSuperAdmin ? '∞' : CV_LIMIT} CV
                  </p>
                )}
              </div>
              {(canMultiCv || cvs.length === 0) && canAddMore && (
                <Link
                  href="/builder/classique"
                  className="btn btn-primary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                >
                  + Nouveau joueur
                </Link>
              )}
            </div>

            {cvs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--muted-2)' }}>
                <p style={{ fontSize: '1.4rem', marginBottom: 8 }}>📄</p>
                <p style={{ fontSize: '0.88rem' }}>Aucun CV créé pour le moment.</p>
                <Link href="/builder/classique" className="btn btn-primary" style={{ marginTop: 14, display: 'inline-block' }}>
                  Créer mon premier CV
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cvs.map((cv) => (
                  <div key={cv.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '12px 14px'
                  }}>
                    {/* Avatar */}
                    {cv.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cv.avatar} alt={cv.label} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                        {EMOJI[cv.sport] ?? '🏅'}
                      </div>
                    )}

                    {/* Infos */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: '0.92rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cv.label}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted-2)' }}>
                        {cv.sport} · /{cv.slug}
                        {cv.cinematic_enabled && <span style={{ marginLeft: 6, color: 'var(--gold)' }}>🎬</span>}
                        <span style={{ marginLeft: 6, color: cv.visibility === 'public' ? 'var(--accent-2)' : 'var(--muted)' }}>
                          {cv.visibility === 'public' ? '🌍 Public' : '🔒 Privé'}
                        </span>
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <Link
                        href={`/${cv.slug}`}
                        target="_blank"
                        className="mini-btn"
                        style={{ textDecoration: 'none', padding: '4px 8px', fontSize: '0.7rem' }}
                      >
                        Voir ↗
                      </Link>
                      <Link
                        href={`/builder/classique${canMultiCv ? `?cv=${cv.id}` : ''}`}
                        className="mini-btn"
                        style={{ textDecoration: 'none', padding: '4px 8px', fontSize: '0.7rem', background: 'rgba(56,216,255,0.1)', color: '#38d8ff' }}
                      >
                        ✏️ Éditer
                      </Link>
                      {cv.cinematic_enabled && (
                        <Link
                          href={`/builder/cinematique${canMultiCv ? `?cv=${cv.id}` : ''}`}
                          className="mini-btn"
                          style={{ textDecoration: 'none', padding: '4px 8px', fontSize: '0.7rem', background: 'rgba(234,179,8,0.1)', color: 'var(--gold)' }}
                        >
                          🎬
                        </Link>
                      )}
                    </div>
                  </div>
                ))}

                {/* QR Code du premier CV seulement si un seul CV */}
                {cvs.length === 1 && (hasPlan || isOwner) && (
                  <div style={{ marginTop: 8, padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ background: '#fff', padding: '6px', borderRadius: '6px', flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`https://cvathlete.com/${cvs[0].slug}`)}`}
                        alt="QR Code"
                        width={80} height={80}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0 0 4px' }}>QR Code</h4>
                      <p style={{ color: 'var(--muted)', fontSize: '0.76rem', marginBottom: 8 }}>Partage-le sur tes réseaux ou affiches.</p>
                      <a
                        href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`https://cvathlete.com/${cvs[0].slug}`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="btn btn-ghost"
                        style={{ padding: '4px 12px', fontSize: '0.75rem', height: 'auto', display: 'inline-flex', alignItems: 'center' }}
                      >
                        📥 Télécharger
                      </a>
                    </div>
                  </div>
                )}

                {!canMultiCv && !canAddMore && (
                  <p style={{ color: 'var(--muted-2)', fontSize: '0.78rem', textAlign: 'center', marginTop: 4 }}>
                    Passe au plan <strong>Club</strong> pour gérer plusieurs joueurs.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite : navigation */}
        <div className="dash-aside">
          {cvs.length > 0 && cinematic && (
            <Link href={`/cine?u=${cvs[0].slug}`} target="_blank" className="dash-link">
              <span>
                <span className="t">🎬 Mode cinématique</span>
                <span className="d">CV en version immersive (Pro)</span>
              </span>
              <span className="arrow">↗</span>
            </Link>
          )}

          {isOwner && (
            <Link href="/admin" className="dash-link">
              <span>
                <span className="t">Espace Admin</span>
                <span className="d">Gérer les comptes & offres</span>
              </span>
              <span className="arrow">→</span>
            </Link>
          )}

          <form action={signOut}>
            <button
              type="submit"
              className="dash-link"
              style={{ width: '100%', background: 'none', border: '1px solid var(--border)', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              <span>
                <span className="t">Déconnexion</span>
                <span className="d">Fermer la session</span>
              </span>
              <span className="arrow">⎋</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
