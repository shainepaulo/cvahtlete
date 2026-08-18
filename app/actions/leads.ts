"use server";

import { sendEmail, leadNotifyEmails, leadNotificationHtml, leadAckHtml } from "@/utils/email";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export interface LeadState {
  ok?: string;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function submitHighTicketLead(formData: FormData): Promise<LeadState> {
  const nom = String(formData.get("nom") ?? "").trim().slice(0, 100);
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 120);
  const telephone = String(formData.get("telephone") ?? "").trim().slice(0, 30);
  const sport = String(formData.get("sport") ?? "").trim().slice(0, 100);
  const club = String(formData.get("club") ?? "").trim().slice(0, 100);
  const ville = String(formData.get("ville") ?? "").trim().slice(0, 100);
  const niveau = String(formData.get("niveau") ?? "").trim().slice(0, 100);
  const besoin = String(formData.get("besoin") ?? "").trim().slice(0, 2000);
  
  // Honeypot anti-bot — invisible pour les humains
  const trap = String(formData.get("website") ?? "");
  if (trap) return { ok: "Demande envoyée ! On te recontacte très vite." };

  if (!nom || !email || !telephone || !sport || !club || !ville || !niveau || !besoin) {
    return { error: "Tous les champs sont obligatoires." };
  }
  if (!EMAIL_RE.test(email)) return { error: "E-mail invalide." };

  // Déterminer le profile_id si l'utilisateur est connecté
  let profileId: string | null = null;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      profileId = user.id;
    }
  } catch (err) {
    console.error("[leads] Impossible d'accéder à la session utilisateur :", err);
  }

  // 1) Enregistrement en base de données (table leads_sur_mesure) via client admin
  try {
    const admin = createAdminClient();
    const { error: dbErr } = await admin.from("leads_sur_mesure").insert({
      profile_id: profileId,
      nom,
      email,
      telephone,
      sport,
      club,
      ville,
      niveau,
      besoin,
      status: "new",
    });
    if (dbErr) {
      console.error("[leads] Échec d'insertion du lead :", dbErr);
      return { error: "Impossible de sauvegarder votre demande. Réessayez plus tard." };
    }
  } catch (err) {
    console.error("[leads] Erreur base de données :", err);
    return { error: "Erreur technique lors de l'enregistrement de votre demande." };
  }

  // 2) Notification interne par e-mail (best-effort)
  try {
    const notify = await sendEmail({
      to: leadNotifyEmails(),
      subject: `🔥 Lead Sur-mesure — ${nom}`,
      html: leadNotificationHtml({ nom, email, telephone, sport, club, ville, niveau, besoin }),
      replyTo: email,
    });
    if (!notify.ok) {
      console.warn("[leads] Notification e-mail non envoyée (service non configuré ou échec) :", notify.error);
    } else {
      // 3) Accusé de réception au prospect (best-effort)
      await sendEmail({
        to: [email],
        subject: "Bien reçu — ATHLETE CV Sur-mesure",
        html: leadAckHtml(nom),
      });
    }
  } catch (emailErr) {
    console.error("[leads] Erreur lors de l'envoi d'e-mail :", emailErr);
  }

  return { ok: "Demande envoyée ! Un membre de l'équipe te recontacte sous 48 h." };
}
