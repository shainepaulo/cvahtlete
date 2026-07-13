'use client'

/**
 * /offre-sur-mesure — Tunnel high-ticket (149 €+), hors Stripe.
 * Formulaire de qualification : les réponses partent automatiquement par
 * e-mail à l'équipe (server action submitHighTicketLead) et le prospect
 * reçoit un accusé de réception.
 */

import { useState } from 'react'
import Link from 'next/link'
import { submitHighTicketLead } from '@/app/actions/leads'

export default function OffreSurMesurePage() {
  const [sending, setSending] = useState(false)
  const [ok, setOk] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSending(true); setError(''); setOk('')
    const res = await submitHighTicketLead(new FormData(e.currentTarget))
    setSending(false)
    if (res.error) setError(res.error)
    else {
      setOk(res.ok ?? 'Demande envoyée !')
      e.currentTarget?.reset?.()
    }
  }

  return (
    <div className="app-wrap" style={{ maxWidth: 560 }}>
      <div className="app-card">
        <div className="app-head" style={{ textAlign: 'left' }}>
          <span className="tag">Sur-mesure · 149 €+</span>
          <h1>Un accompagnement à ta hauteur.</h1>
          <p>
            Flotte de répertoires, espace multi-sport, coaching personnalisé :
            dis-nous où tu veux aller — on construit l&apos;offre avec toi et on
            te recontacte sous 24&nbsp;h ouvrées.
          </p>
        </div>

        {ok && <div className="alert ok">{ok}</div>}
        {error && <div className="alert err">{error}</div>}

        {!ok && (
          <form onSubmit={onSubmit}>
            {/* Honeypot anti-bot — invisible pour les humains */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />
            <div className="field">
              <label htmlFor="lead-name">Nom complet</label>
              <input id="lead-name" name="name" type="text" maxLength={80} required autoComplete="name" />
            </div>
            <div className="field">
              <label htmlFor="lead-email">E-mail</label>
              <input id="lead-email" name="email" type="email" maxLength={120} required autoComplete="email" />
            </div>
            <div className="field">
              <label htmlFor="lead-positions">Poste(s) / discipline(s)</label>
              <input id="lead-positions" name="positions" type="text" maxLength={160} required
                placeholder="Ex. Gardien de but U20 · Ailier · Sprint 100 m" />
            </div>
            <div className="field">
              <label htmlFor="lead-goals">Objectifs</label>
              <textarea id="lead-goals" name="goals" rows={4} maxLength={1200} required
                placeholder="Signer en pro, trouver un sponsor, gérer les CV d'une académie…"
                style={{ width: '100%', resize: 'vertical', background: 'var(--bg-2)', border: '1px solid var(--border-2)', color: 'var(--text)', borderRadius: 6, padding: '10px 12px', fontFamily: 'var(--font-body)', fontSize: '.9rem' }} />
            </div>
            <div className="field">
              <label htmlFor="lead-links">Liens vidéos / statistiques (facultatif)</label>
              <textarea id="lead-links" name="links" rows={3} maxLength={1200}
                placeholder={'https://youtube.com/…\nhttps://transfermarkt.fr/…'}
                style={{ width: '100%', resize: 'vertical', background: 'var(--bg-2)', border: '1px solid var(--border-2)', color: 'var(--text)', borderRadius: 6, padding: '10px 12px', fontFamily: 'var(--font-body)', fontSize: '.9rem' }} />
            </div>
            <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={sending}>
              {sending ? 'Envoi…' : 'Envoyer ma demande'}
            </button>
          </form>
        )}

        <p className="app-alt" style={{ marginTop: 16 }}>
          <Link href="/tarifs">← Voir les autres offres</Link>
        </p>
      </div>
    </div>
  )
}
