import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { signOut } from '@/app/actions/auth'
import { TrialBanner } from '@/components/billing/TrialBanner'

const PLAN_LABEL: Record<string, string> = {
  free: 'Gratuit',
  starter: 'Starter (Legacy)',
  pro: 'Pro (Legacy)',
  season: 'Pass Saison Pro',
  club: 'Club',
}

export default async function DashboardPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/login')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard')

  const [{ data: profile }, { data: cv }, { data: sub }] = await Promise.all([
    supabase.from('profiles').select('full_name, email, is_owner, is_super_admin, plan, account_status').eq('id', user.id).single(),
    supabase.from('cvs').select('slug, visibility').eq('user_id', user.id).maybeSingle(),
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
  
  // Le mode cinématique est accessible aux membres actifs Pro/Season/Club ou propriétaires
  const cinematic = isOwner || plan === 'pro' || plan === 'season' || plan === 'club'

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

          {/* Section QR Code */}
          {cv?.slug && (
            <div className="app-card" style={{ padding: '24px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '12px' }}>
              {hasPlan || isOwner ? (
                <>
                  <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`https://cvathlete.com/${cv.slug}`)}`}
                      alt="QR Code du CV"
                      width={120}
                      height={120}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text)' }}>Ton QR Code</h3>
                    <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '12px', lineHeight: '1.4' }}>Télécharge le QR code pour l&apos;ajouter sur tes réseaux, affiches ou cartes de visite.</p>
                    <a 
                      href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`https://cvathlete.com/${cv.slug}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost"
                      style={{ padding: '6px 14px', fontSize: '0.8rem', height: 'auto', display: 'inline-flex', alignItems: 'center' }}
                    >
                      📥 Télécharger le QR Code
                    </a>
                  </div>
                </>
              ) : (
                <div style={{ width: '100%', textAlign: 'center', padding: '14px 0' }}>
                  <span style={{ fontSize: '2rem' }}>🔒</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '10px', marginBottom: '6px', color: 'var(--text)' }}>QR Code du CV</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '14px', lineHeight: '1.4' }}>Télécharge le QR code redirigeant vers ton CV en passant Pro.</p>
                  <Link href="/tarifs" className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '0.8rem', height: 'auto' }}>Débloquer avec le Pass Pro</Link>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="dash-aside">
          <Link href="/builder" className="dash-link">
            <span>
              <span className="t">Mon CV</span>
              <span className="d">Construis et mets à jour ta page en autonomie</span>
            </span>
            <span className="arrow">→</span>
          </Link>

          {cv?.slug && (
            <Link href={`/profil?me=1`} target="_blank" className="dash-link">
              <span>
                <span className="t">Voir ma page</span>
                <span className="d">Aperçu public de ton CV</span>
              </span>
              <span className="arrow">↗</span>
            </Link>
          )}

          {cv?.slug && cinematic && (
            <Link href={`/cine?u=${cv.slug}`} target="_blank" className="dash-link">
              <span>
                <span className="t">🎬 Mode cinématique</span>
                <span className="d">Ton CV en version immersive (Pro)</span>
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
