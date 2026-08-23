'use client'

import { useState } from 'react'
import { deleteCv } from '@/app/actions/cv'

interface DeleteCvButtonProps {
  cvId: string
  label: string
}

export default function DeleteCvButton({ cvId, label }: DeleteCvButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    setErrorMsg(null)
    try {
      const res = await deleteCv(cvId)
      if (res.error) {
        setErrorMsg(res.error)
        setDeleting(false)
      } else {
        setShowModal(false)
      }
    } catch {
      setErrorMsg("Une erreur réseau est survenue.")
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Bouton Poubelle */}
      <button
        onClick={() => setShowModal(true)}
        className="mini-btn danger"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px 8px',
          height: '28px',
          width: '28px',
          borderRadius: '6px',
          background: 'rgba(255, 78, 80, 0.1)',
          border: '1px solid rgba(255, 78, 80, 0.15)',
          color: '#ff4e50',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        title="Supprimer le CV"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>

      {/* Fenêtre de suppression (Modale) */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 9, 21, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
          onClick={() => !deleting && setShowModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-2, #0d1527)',
              border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
              borderRadius: '16px',
              padding: '30px 24px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              display: 'grid',
              gap: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icône Danger en haut */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(255, 78, 80, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ff4e50',
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
            </div>

            {/* Contenu */}
            <div style={{ textAlign: 'center' }}>
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#fff',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Supprimer le CV ?
              </h3>
              <p style={{ color: 'var(--muted-2, #859bb3)', fontSize: '0.88rem', lineHeight: '1.5' }}>
                Es-tu sûr de vouloir supprimer définitivement le CV de <strong>{label}</strong> ? <br />
                Cette action effacera toutes ses données et est irréversible.
              </p>
            </div>

            {errorMsg && (
              <div
                style={{
                  background: 'rgba(255, 78, 80, 0.1)',
                  border: '1px solid rgba(255, 78, 80, 0.2)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#ff4e50',
                  fontSize: '0.82rem',
                  textAlign: 'center',
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowModal(false)}
                disabled={deleting}
                style={{ width: '100%', height: '42px', fontSize: '0.88rem' }}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  width: '100%',
                  height: '42px',
                  fontSize: '0.88rem',
                  background: '#ff4e50',
                  border: '1px solid #ff4e50',
                  color: '#fff',
                }}
              >
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
