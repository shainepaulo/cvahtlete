'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cancelTrial } from '@/app/actions/billing'

interface Props {
  /** Fin d'essai (ISO) — affichée à l'utilisateur. */
  trialEndsAt: string
  /** Montant du paiement unique qui sera capturé à J+3 (euros). */
  amountEuros: number
}

/**
 * Bandeau affiché pendant l'essai Pro : rappelle la date de capture du
 * paiement unique et permet d'annuler (aucun débit, CV hors ligne).
 */
export function TrialBanner({ trialEndsAt, amountEuros }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const endDate = new Date(trialEndsAt).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })

  function onCancel() {
    startTransition(async () => {
      const res = await cancelTrial()
      if (res.error) {
        setMsg({ text: res.error, ok: false })
      } else {
        setMsg({ text: res.ok ?? 'Essai annulé.', ok: true })
        router.refresh()
      }
      setConfirming(false)
    })
  }

  return (
    <div className="trial-banner">
      <div className="trial-banner-txt">
        <strong>🛡️ Essai Pro en cours — 0 € débité pour l&apos;instant.</strong>
        <span>
          Sans annulation, ton paiement unique de {amountEuros} € sera capturé le{' '}
          <strong>{endDate}</strong>, puis tes avantages resteront actifs. Aucun abonnement.
        </span>
        {msg && <span className={msg.ok ? 'ok' : 'err'}>{msg.text}</span>}
      </div>
      {confirming ? (
        <div className="trial-banner-actions">
          <button type="button" className="btn btn-ghost" disabled={pending} onClick={onCancel}>
            {pending ? 'Annulation…' : 'Confirmer l’annulation'}
          </button>
          <button type="button" className="mini-btn" disabled={pending} onClick={() => setConfirming(false)}>
            Garder mon essai
          </button>
        </div>
      ) : (
        <button type="button" className="mini-btn danger" onClick={() => setConfirming(true)}>
          Annuler l&apos;essai (0 € débité, CV hors ligne)
        </button>
      )}
    </div>
  )
}
