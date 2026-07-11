'use client'

import { useState, useTransition } from 'react'
import { toggleAdminContactMask } from '@/app/actions/admin'

interface Props {
  initialMasked: boolean
}

/**
 * Contrôle admin universel du floutage des coordonnées sensibles (Tâche 3.2).
 * Effet immédiat sur tout CV consulté par cet admin, quel qu'il soit.
 */
export default function AdminPrivacyToggle({ initialMasked }: Props) {
  const [masked, setMasked] = useState(initialMasked)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    setError(null)
    startTransition(async () => {
      const res = await toggleAdminContactMask()
      if (res.error) setError(res.error)
      else if (typeof res.masked === 'boolean') setMasked(res.masked)
    })
  }

  return (
    <div className="app-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
      <div style={{ display: 'grid', gap: 4 }}>
        <h2 style={{ fontSize: '1.1rem' }}>Masquage forcé des coordonnées</h2>
        <p style={{ color: 'var(--muted-2)', fontSize: '.86rem', maxWidth: 460 }}>
          Contrôle universel : s&apos;applique à tout CV que tu consultes (le tien ou celui d&apos;un autre
          utilisateur), peu importe si la coordonnée a déjà été déverrouillée par un visiteur.
        </p>
        {error && <p style={{ color: 'var(--red)', fontSize: '.8rem' }}>{error}</p>}
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`btn ${masked ? 'btn-ghost' : 'btn-primary'}`}
        aria-pressed={masked}
      >
        {isPending ? '…' : masked ? '🔒 Flouté' : '🔓 Visible en clair'}
      </button>
    </div>
  )
}
