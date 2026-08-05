import 'server-only'

/**
 * Envoi d'e-mails transactionnels via l'API HTTP Resend (aucun SDK requis).
 * SERVEUR UNIQUEMENT. Variables : RESEND_API_KEY, EMAIL_FROM.
 *
 * Destinataires internes des leads sur-mesure : LEAD_NOTIFY_EMAILS
 * (liste séparée par des virgules).
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export interface SendEmailInput {
  to: string[]
  subject: string
  html: string
  replyTo?: string
}

export interface SendEmailResult {
  ok: boolean
  error?: string
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) {
    // On n'échoue pas silencieusement : l'appelant décide quoi montrer.
    console.error('[email] RESEND_API_KEY ou EMAIL_FROM manquant — e-mail non envoyé :', subject)
    return { ok: false, error: 'Service e-mail non configuré.' }
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error('[email] Échec Resend', res.status, body.slice(0, 300))
      return { ok: false, error: `Envoi refusé (${res.status}).` }
    }
    return { ok: true }
  } catch (e) {
    console.error('[email] Erreur réseau Resend', e)
    return { ok: false, error: 'Erreur réseau lors de l’envoi.' }
  }
}

/** Destinataires internes des notifications de leads (offre sur-mesure). */
export function leadNotifyEmails(): string[] {
  const raw = process.env.LEAD_NOTIFY_EMAILS ?? 'shaine.paulo@gmail.com,toshirompika@gmail.com'
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

// ---------------------------------------------------------------------------
// Templates — thème ATHLETE CV (navy #002451, accents #8bb6ff / #79e0cf)
// ---------------------------------------------------------------------------

function shell(title: string, body: string): string {
  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:28px 12px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e3e8f2;">
          <tr>
            <td style="background:#002451;padding:22px 28px;">
              <span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:2px;">ATHLETE&nbsp;CV</span>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 28px;">
              <h1 style="margin:0 0 14px;font-size:21px;color:#002451;">${title}</h1>
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;border-top:1px solid #e3e8f2;">
              <p style="margin:0;font-size:12px;color:#8a94a6;">
                ATHLETE CV — Le CV des athlètes, en un lien. Paiement unique, jamais d'abonnement.
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** E-mail « Done » : confirmation client après capture d'un paiement unique. */
export function paymentConfirmationHtml(params: {
  fullName: string
  planLabel: string
  amountCents: number
  cvUrl?: string
}): string {
  const amount = (params.amountCents / 100).toFixed(2).replace('.', ',')
  return shell(
    'Paiement confirmé ✅',
    `
      <p style="margin:0 0 12px;font-size:14px;color:#3a4356;line-height:1.6;">
        Bonjour ${esc(params.fullName) || 'champion·ne'},
      </p>
      <p style="margin:0 0 12px;font-size:14px;color:#3a4356;line-height:1.6;">
        Ton paiement de <strong>${amount}&nbsp;€</strong> pour l'offre
        <strong>${esc(params.planLabel)}</strong> est confirmé.
        C'est un <strong>paiement unique</strong> : aucun prélèvement récurrent,
        aucune surprise.
      </p>
      <p style="margin:0 0 20px;font-size:14px;color:#3a4356;line-height:1.6;">
        Ton répertoire est actif : construis-le, mets-le à jour, partage ton lien
        aux clubs, agents et sponsors.
      </p>
      ${params.cvUrl ? `
      <p style="margin:0 0 8px;">
        <a href="${esc(params.cvUrl)}" style="display:inline-block;background:#8bb6ff;color:#002451;font-weight:bold;font-size:14px;text-decoration:none;padding:12px 26px;border-radius:10px;">
          Ouvrir mon espace →
        </a>
      </p>` : ''}
    `,
  )
}

/** Notification interne : nouveau lead sur l'offre Sur-mesure (249 €+). */
export function leadNotificationHtml(params: {
  nom: string
  email: string
  telephone: string
  sport: string
  club: string
  ville: string
  niveau: string
  besoin: string
}): string {
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 10px;background:#f4f6fb;font-size:12px;color:#8a94a6;text-transform:uppercase;letter-spacing:1px;white-space:nowrap;vertical-align:top;">${label}</td>
      <td style="padding:8px 10px;font-size:14px;color:#3a4356;line-height:1.5;word-break:break-word;">${esc(value) || '—'}</td>
    </tr>`
  return shell(
    '🔥 Nouveau lead — Offre Sur-mesure (249 €+)',
    `
      <p style="margin:0 0 16px;font-size:14px;color:#3a4356;">
        Un prospect vient de remplir le formulaire sur-mesure. À recontacter rapidement :
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3e8f2;border-radius:8px;overflow:hidden;">
        ${row('Nom', params.nom)}
        ${row('E-mail', params.email)}
        ${row('Téléphone', params.telephone)}
        ${row('Sport', params.sport)}
        ${row('Club', params.club)}
        ${row('Ville', params.ville)}
        ${row('Niveau', params.niveau)}
        ${row('Besoin', params.besoin)}
      </table>
    `,
  )
}

/** Accusé de réception envoyé au prospect sur-mesure. */
export function leadAckHtml(name: string): string {
  return shell(
    'Bien reçu — on te répond très vite 🤝',
    `
      <p style="margin:0 0 12px;font-size:14px;color:#3a4356;line-height:1.6;">
        Bonjour ${esc(name) || ''},
      </p>
      <p style="margin:0 0 12px;font-size:14px;color:#3a4356;line-height:1.6;">
        Ta demande d'accompagnement <strong>Sur-mesure</strong> est bien arrivée.
        Un membre de l'équipe ATHLETE CV te recontacte sous 24&nbsp;h ouvrées pour
        construire l'offre adaptée à ton projet.
      </p>
      <p style="margin:0;font-size:14px;color:#3a4356;line-height:1.6;">
        À très vite,<br/>L'équipe ATHLETE CV
      </p>
    `,
  )
}
