'use client'

/**
 * /offre-sur-mesure — Tunnel high-ticket (Sur-mesure, à partir de 249 €), hors Stripe.
 * Formulaire de qualification : les réponses partent automatiquement par
 * e-mail à l'équipe et sont enregistrées en base (leads_sur_mesure).
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
          <span className="tag">Sur-mesure · À partir de 249 €</span>
          <h1>Un accompagnement à ta hauteur.</h1>
          <p>
            Flotte de répertoires, shooting photo, CV monté par un designer, accompagnement dédié :
            décris-nous ton projet et on te répond sous 48&nbsp;h.
          </p>
        </div>

        {ok && (
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div className="alert ok" style={{ marginBottom: 20 }}>{ok}</div>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 20 }}>
              Ton message a bien été enregistré. Notre équipe va étudier ton profil et te recontacter par téléphone ou par e-mail sous 48 heures ouvrées.
            </p>
            <Link href="/dashboard" className="btn btn-primary btn-block">
              Retour à mon espace
            </Link>
          </div>
        )}
        
        {error && <div className="alert err">{error}</div>}

        {!ok && (
          <form onSubmit={onSubmit}>
            {/* Honeypot anti-bot — invisible pour les humains */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />
            
            <div className="field">
              <label htmlFor="lead-nom">Nom complet</label>
              <input id="lead-nom" name="nom" type="text" maxLength={100} required autoComplete="name" placeholder="Ex. Dembélé Moussa" />
            </div>
            
            <div className="field">
              <label htmlFor="lead-email">E-mail</label>
              <input id="lead-email" name="email" type="email" maxLength={120} required autoComplete="email" placeholder="Ex. moussa@example.com" />
            </div>

            <div className="field">
              <label htmlFor="lead-telephone">Téléphone</label>
              <input id="lead-telephone" name="telephone" type="tel" maxLength={30} required autoComplete="tel" placeholder="Ex. +33 6 12 34 56 78" />
            </div>

            <div className="row2">
              <div className="field">
                <label htmlFor="lead-sport">Sport</label>
                <input id="lead-sport" name="sport" type="text" maxLength={100} required placeholder="Ex. Football" />
              </div>
              <div className="field">
                <label htmlFor="lead-club">Club actuel</label>
                <input id="lead-club" name="club" type="text" maxLength={100} required placeholder="Ex. OL (Lyon)" />
              </div>
            </div>

            <div className="row2">
              <div className="field">
                <label htmlFor="lead-ville">Ville</label>
                <input id="lead-ville" name="ville" type="text" maxLength={100} required placeholder="Ex. Lyon, France" />
              </div>
              <div className="field">
                <label htmlFor="lead-niveau">Niveau de jeu / Compétition</label>
                <input id="lead-niveau" name="niveau" type="text" maxLength={100} required placeholder="Ex. National 2 / U19 R1" />
              </div>
            </div>

            <div className="field">
              <label htmlFor="lead-besoin">Décris-nous ton besoin</label>
              <textarea id="lead-besoin" name="besoin" rows={5} maxLength={2000} required
                placeholder="Shooting photo, montage vidéo highlights, direction artistique sur-mesure, questions spécifiques..."
                style={{ width: '100%', resize: 'vertical', background: 'var(--bg-2)', border: '1px solid var(--border-2)', color: 'var(--text)', borderRadius: 6, padding: '10px 12px', fontFamily: 'var(--font-body)', fontSize: '.9rem' }} />
            </div>

            <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={sending}>
              {sending ? 'Envoi…' : 'Envoyer ma demande'}
            </button>
          </form>
        )}

        <p className="app-alt" style={{ marginTop: 24 }}>
          <Link href="/tarifs">← Voir les autres offres</Link>
        </p>
      </div>
    </div>
  )
}
