'use client'

import { useState, useTransition } from 'react'
import { requestContactUnlock } from '@/app/actions/privacy'

type UnlockState = 'locked' | 'pending' | 'unlocked'

interface Props {
  value: string
  href?: string
  sensitive: boolean
  /** true si l'admin a désactivé le masquage forcé (voir /admin) : donnée visible en clair. */
  forceVisible: boolean
  fieldLabel: string
  cvSlug: string
  className?: string
}

/**
 * Coordonnée sensible (téléphone, e-mail…) floutée par défaut (CSS filter: blur).
 * Clic → requête de déverrouillage (Task 3.2) → "Flouté" → "Demande en cours" → "Déverrouillé".
 */
export function BlurValue({ value, href, sensitive, forceVisible, fieldLabel, cvSlug, className }: Props) {
  const [state, setState] = useState<UnlockState>('locked')
  const [isPending, startTransition] = useTransition()

  const revealed = !sensitive || forceVisible || state === 'unlocked'

  if (revealed) {
    return href ? (
      <a className={className} href={href}>
        {value}
      </a>
    ) : (
      <span className={className}>{value}</span>
    )
  }

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    if (state !== 'locked') return
    setState('pending')
    startTransition(async () => {
      const res = await requestContactUnlock({ cvSlug, fieldLabel })
      setState(res.approved ? 'unlocked' : 'locked')
    })
  }

  return (
    <button
      type="button"
      className={`privacy-blur${className ? ` ${className}` : ''}`}
      onClick={handleClick}
      disabled={isPending}
      aria-live="polite"
      aria-label={state === 'pending' ? 'Demande en cours' : `Demander l'accès à ${fieldLabel}`}
      style={{ minWidth: '138px', maxWidth: '100%' }}
    >
      <span className="privacy-blur-value" aria-hidden="true" style={{ minWidth: '130px', display: 'inline-block' }}>{value}</span>
      <span className="privacy-blur-overlay" style={{ fontSize: '0.68rem', padding: '3px 8px', whiteSpace: 'nowrap', width: '100%', boxSizing: 'border-box' }}>
        {state === 'pending' ? (
          <>
            <span className="privacy-spinner" aria-hidden="true" />
            Requête envoyée…
          </>
        ) : (
          <>🔒 Demander l&apos;accès</>
        )}
      </span>
    </button>
  )
}
