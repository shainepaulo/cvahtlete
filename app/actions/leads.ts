"use server";

import { sendEmail, leadNotifyEmails, leadNotificationHtml, leadAckHtml } from "@/utils/email";

/**
 * Tunnel high-ticket (offre Sur-mesure, 149 €+) : pas de Stripe.
 * Le prospect remplit le formulaire /offre-sur-mesure ; ses réponses sont
 * envoyées automatiquement aux deux adresses internes (LEAD_NOTIFY_EMAILS)
 * et il reçoit un accusé de réception.
 */

export interface LeadState {
  ok?: string;
  error?: string;
}

const MAX = { name: 80, email: 120, positions: 160, goals: 1200, links: 1200 } as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function submitHighTicketLead(formData: FormData): Promise<LeadState> {
  const name = String(formData.get("name") ?? "").trim().slice(0, MAX.name);
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, MAX.email);
  const positions = String(formData.get("positions") ?? "").trim().slice(0, MAX.positions);
  const goals = String(formData.get("goals") ?? "").trim().slice(0, MAX.goals);
  const links = String(formData.get("links") ?? "").trim().slice(0, MAX.links);
  // Honeypot anti-bot : champ invisible, tout contenu => rejet silencieux.
  const trap = String(formData.get("website") ?? "");

  if (trap) return { ok: "Demande envoyée ! On te recontacte très vite." };
  if (!name || !email || !positions || !goals) {
    return { error: "Nom, e-mail, poste(s) et objectifs sont requis." };
  }
  if (!EMAIL_RE.test(email)) return { error: "E-mail invalide." };

  // 1) Notification interne — les deux adresses de l'équipe.
  const notify = await sendEmail({
    to: leadNotifyEmails(),
    subject: `🔥 Lead Sur-mesure — ${name}`,
    html: leadNotificationHtml({ name, email, positions, goals, links }),
    replyTo: email,
  });
  if (!notify.ok) {
    return { error: "Envoi impossible pour le moment. Réessaie ou écris-nous directement." };
  }

  // 2) Accusé de réception au prospect (best-effort : le lead interne est déjà parti).
  await sendEmail({
    to: [email],
    subject: "Bien reçu — ATHLETE CV Sur-mesure",
    html: leadAckHtml(name),
  });

  return { ok: "Demande envoyée ! Un membre de l'équipe te recontacte sous 24 h ouvrées." };
}
