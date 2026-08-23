import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getCvBySlug } from '@/app/actions/cv'
import { createClient } from '@/utils/supabase/server'
import ProfileView from '@/components/ProfileView'
import ClientCineView from '@/components/ClientCineView'

interface Params {
  params: { slug: string }
  searchParams: { mode?: string }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const cv = await getCvBySlug(params.slug)
  if (!cv) return { title: 'Profil introuvable — ATHLETE CV' }
  const name = `${cv.first} ${cv.last}`
  return {
    title: `${name} — ${cv.sport} · ATHLETE CV`,
    description: cv.tagline || `Profil d'athlète de ${name}.`,
    openGraph: {
      title: name,
      description: cv.tagline || '',
      images: cv.avatar ? [{ url: cv.avatar }] : [],
    },
  }
}

export default async function SlugPage({ params, searchParams }: Params) {
  const cv = await getCvBySlug(params.slug)
  if (!cv) notFound()

  const mode = searchParams?.mode

  // Déterminer si le visiteur connecté est propriétaire du CV (CTA adaptatif).
  let isOwn = false
  let hasPro = false
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const [{ data: profile }, { data: mine }] = await Promise.all([
        supabase.from('profiles').select('is_owner, plan').eq('id', user.id).single(),
        supabase.from('cvs').select('slug').eq('user_id', user.id).eq('slug', params.slug).maybeSingle(),
      ])
      isOwn = !!mine
      hasPro = !!(profile?.is_owner || profile?.plan === 'pro' || profile?.plan === 'club')
    }
  }

  // Si le CV est bloqué (essai expiré ou suspendu)
  if (cv.blocked) {
    if (isOwn) {
      // Le propriétaire peut voir sa page avec un bandeau/CTA d'activation
      return <ProfileView cv={cv} isOwn={isOwn} hasPro={hasPro} />
    } else {
      // Les visiteurs externes voient une page d'explication premium
      return (
        <div className="app-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center', padding: '0 20px' }}>
          <div className="app-card" style={{ maxWidth: 500, padding: '40px 30px', border: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(12px)', borderRadius: 12 }}>
            <span className="tag" style={{ background: 'var(--red)', color: '#fff', marginBottom: 18, padding: '5px 12px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>HORS LIGNE</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', marginBottom: 14, fontWeight: 700 }}>CV en attente d&apos;activation</h1>
            <p style={{ color: 'var(--muted-2)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 26 }}>
              La période d&apos;essai gratuite de ce CV d&apos;athlète est terminée. Si vous êtes le propriétaire, connectez-vous à votre espace personnel pour réactiver votre page en ligne.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link href="/login" className="btn btn-primary btn-block">Se connecter à mon espace</Link>
              <Link href="/" className="btn btn-ghost btn-block">Retour à l&apos;accueil</Link>
            </div>
          </div>
        </div>
      )
    }
  }

  // Si la vue cinématique est activée en base de données et non-outpassée par le paramètre mode
  if (cv.cinematic && mode !== 'classic') {
    return <ClientCineView cv={cv} />
  }

  return <ProfileView cv={cv} isOwn={isOwn} hasPro={hasPro} />
}
