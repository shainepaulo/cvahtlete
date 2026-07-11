'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { setCvVisibility, type SetVisibilityState } from '@/app/actions/admin'

export interface AdminCvRow {
  id: string
  slug: string
  first: string
  last: string
  visibility: string
  owner_email: string
}

const initialState: SetVisibilityState = {}

function VisibilityButton({ value, label, disabled }: { value: 'public' | 'private'; label: string; disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      name="visibility"
      value={value}
      disabled={disabled || pending}
      className="btn btn-ghost"
      style={{ padding: '8px 12px', fontSize: '.7rem', letterSpacing: '.1em' }}
    >
      {label}
    </button>
  )
}

function CvRow({ row }: { row: AdminCvRow }) {
  const [state, formAction] = useFormState(setCvVisibility, initialState)
  const isPublic = row.visibility === 'public'

  return (
    <>
      <td>
        <div style={{ display: 'grid', gap: 3 }}>
          <strong>{row.first} {row.last}</strong>
          <span style={{ color: 'var(--muted-2)', fontSize: '.8rem' }}>/{row.slug} · {row.owner_email}</span>
        </div>
      </td>
      <td>
        <span style={{ color: isPublic ? 'var(--accent-2)' : 'var(--muted)', fontWeight: 700 }}>
          {isPublic ? 'Public' : 'Privé'}
        </span>
      </td>
      <td>
        <form action={formAction} style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <input type="hidden" name="cv_id" value={row.id} />
          <VisibilityButton value="public" label="Forcer public" disabled={isPublic} />
          <VisibilityButton value="private" label="Forcer privé" disabled={!isPublic} />
        </form>
        {state?.error && <div style={{ color: 'var(--red)', fontSize: '.75rem', marginTop: 8, textAlign: 'right' }}>{state.error}</div>}
      </td>
    </>
  )
}

export default function AdminCvsVisibility({ rows }: { rows: AdminCvRow[] }) {
  return (
    <div className="app-card" style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'grid', gap: 6 }}>
        <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)' }}>Visibilité des répertoires</h2>
        <p style={{ color: 'var(--muted-2)', fontSize: '.88rem' }}>
          Force le statut public/privé de n&apos;importe quel CV, indépendamment du choix de son propriétaire.
          Un CV privé reste accessible via son lien direct — seule sa présence dans la Bibliothèque change.
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--muted-2)', fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.12em' }}>
              <th style={{ padding: '12px 10px' }}>Répertoire</th>
              <th style={{ padding: '12px 10px' }}>Visibilité</th>
              <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} style={{ borderTop: '1px solid var(--border)' }}>
                <CvRow row={row} />
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: '28px 12px', color: 'var(--muted-2)' }}>
                  Aucun répertoire créé pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
