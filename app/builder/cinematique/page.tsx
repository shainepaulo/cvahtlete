'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCvBuilder } from '@/components/builder/shared'

function CinematiqueContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const targetUser = searchParams.get('u')
  const cvId = searchParams.get('cv')
  const b = useCvBuilder('/builder/cinematique')

  useEffect(() => {
    if (b.user) {
      const params = new URLSearchParams()
      params.set('mode', 'cine')
      if (targetUser) params.set('u', targetUser)
      if (cvId) params.set('cv', cvId)
      router.replace(`/builder/classique?${params.toString()}`)
    }
  }, [b.user, targetUser, cvId, router])

  return (
    <div className="app-wrap wide b-page" style={{ textAlign: 'center', paddingTop: 80 }}>
      <h2>Redirection vers le constructeur unique...</h2>
      <p style={{ color: 'var(--muted)' }}>Toutes les options cinématiques et classiques sont désormais réunies sur le même constructeur.</p>
    </div>
  )
}

export default function BuilderCinematiquePage() {
  return <Suspense fallback={null}><CinematiqueContent /></Suspense>
}
