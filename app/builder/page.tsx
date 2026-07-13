'use client'

/**
 * /builder — Hub de création : deux espaces distincts.
 *   · CV Classique   → /builder/classique   (page publique, stats, palmarès…)
 *   · CV Cinématique → /builder/cinematique (écran immersif, offre Pro/Club)
 * Les deux flux ne sont plus mélangés sur la même vue.
 */

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getMyProfile } from '@/app/actions/auth'
import { PLAN_LABEL } from '@/components/builder/shared'

interface HubUser { plan: string; planName: string; cinematic: boolean; isOwner: boolean }

function BuilderHubContent() {
  const router = useRouter()
  const welcome = useSearchParams().has('welcome')
  const [user, setUser] = useState<HubUser | null>(null)

  useEffect(() => {
    getMyProfile().then((p) => {
      if (!p) { router.push('/login?next=/builder'); return }
      if (p.plan === 'free' && !p.isOwner) { router.push('/tarifs'); return }
      setUser({ plan: p.plan, planName: PLAN_LABEL[p.plan] ?? p.plan, cinematic: !!p.cinematic, isOwner: !!p.isOwner })
    })
  }, [router])

  if (!user) {
    return <div className="app-wrap"><div className="app-head"><h1>Chargement…</h1></div></div>
  }

  return (
    <div className="app-wrap wide b-page">
      <div className="app-head" style={{ textAlign: 'left' }}>
        <span className="tag">Mon répertoire</span>
        <h1>Que veux-tu créer&nbsp;?</h1>
        <p>Offre <strong>{user.planName}</strong> · Deux espaces dédiés, un seul CV toujours à jour.</p>
      </div>

      {welcome && (
        <div className="alert ok" style={{ marginBottom: 20 }}>
          Bienvenue ! Commence par ton CV classique — le cinématique s&apos;appuie dessus.
        </div>
      )}

      <div className="builder-hub">
        <Link href="/builder/classique" className="hub-card">
          <span className="hub-ic">📄</span>
          <h3>CV Classique</h3>
          <p>Ta page publique : identité, statistiques, palmarès, parcours et réseaux. Le lien que tu partages aux clubs et aux sponsors.</p>
          <div className="hub-feats">
            <span>Aperçu en direct mobile &amp; desktop</span>
            <span>Photo de profil recadrable</span>
            <span>Couleurs à ton image</span>
          </div>
          <span className="btn btn-primary hub-cta">Ouvrir l&apos;éditeur →</span>
        </Link>

        <Link href="/builder/cinematique" className="hub-card cine">
          <span className="hub-badge">PRO</span>
          <span className="hub-ic">🎬</span>
          <h3>CV Cinématique</h3>
          <p>L&apos;écran immersif plein écran : photo signature, nom en dégradé, panneau stats. L&apos;expérience qui marque les esprits.</p>
          <div className="hub-feats">
            <span>Image plein écran recadrable</span>
            <span>Aperçu immersif en direct</span>
            <span>Même lien, effet spectaculaire</span>
          </div>
          {user.cinematic ? (
            <span className="btn btn-primary hub-cta">Ouvrir l&apos;éditeur →</span>
          ) : (
            <span className="btn btn-ghost hub-cta">🔒 Débloquer avec l&apos;offre Pro</span>
          )}
        </Link>
      </div>
    </div>
  )
}

export default function BuilderHubPage() {
  return <Suspense fallback={null}><BuilderHubContent /></Suspense>
}
