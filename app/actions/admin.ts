"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export type AccountStatus = "active" | "suspended" | "revoked";

export interface AdminActionState {
  ok?: string;
  error?: string;
}

function normalizeEmail(email: FormDataEntryValue | null): string {
  return String(email ?? "").trim().toLowerCase();
}

export async function updateAccountStatus(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const targetEmail = normalizeEmail(formData.get("email"));
  const rawStatus = String(formData.get("account_status") ?? "").trim();

  if (!targetEmail) return { error: "E-mail requis." };
  if (!['active', 'suspended', 'revoked'].includes(rawStatus)) {
    return { error: "Statut invalide." };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const { data: actor } = await supabase
    .from('profiles')
    .select('is_owner, is_super_admin, account_status, email')
    .eq('id', user.id)
    .single();

  if (!actor?.is_owner && !actor?.is_super_admin) return { error: "Accès refusé." };
  if (actor.account_status && actor.account_status !== 'active') return { error: "Compte inactif." };
  if ((actor.email ?? '').toLowerCase() === targetEmail) {
    return { error: "Tu ne peux pas modifier ton propre statut depuis cette console." };
  }

  const admin = createAdminClient();
  const { data: targetProfile, error: fetchError } = await admin
    .from('profiles')
    .select('id, email, account_status, is_super_admin')
    .eq('email', targetEmail)
    .maybeSingle();

  if (fetchError) return { error: "Impossible de charger le compte cible." };
  if (!targetProfile) return { error: "Compte introuvable." };
  if (targetProfile.is_super_admin && !actor.is_super_admin) {
    return { error: "Seul le super admin peut modifier ce compte." };
  }

  const status = rawStatus as AccountStatus;
  const { error: updateError } = await admin
    .from('profiles')
    .update({ account_status: status })
    .eq('id', targetProfile.id);

  if (updateError) return { error: "Impossible de mettre à jour le statut." };

  revalidatePath('/admin');
  return { ok: `${targetProfile.email} est maintenant en statut ${status}.` };
}

// ─── Privacy Lock — masquage forcé des coordonnées sensibles (Tâche 3.2) ─────

export interface ToggleMaskState {
  masked?: boolean;
  error?: string;
}

/**
 * Bascule le masquage forcé des numéros / e-mails pour l'admin courant.
 * Effet global : s'applique quel que soit le CV consulté par cet admin
 * (le sien ou celui d'un autre utilisateur) — voir components/privacy/BlurValue.
 */
export async function toggleAdminContactMask(): Promise<ToggleMaskState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const { data: actor } = await supabase
    .from('profiles')
    .select('is_owner, is_super_admin, admin_force_contact_mask, account_status')
    .eq('id', user.id)
    .single();

  if (!actor?.is_owner && !actor?.is_super_admin) return { error: "Accès refusé." };
  if (actor.account_status && actor.account_status !== 'active') return { error: "Compte inactif." };

  const next = !(actor.admin_force_contact_mask ?? true);
  const { error } = await supabase
    .from('profiles')
    .update({ admin_force_contact_mask: next })
    .eq('id', user.id);

  if (error) return { error: "Impossible de mettre à jour le réglage." };

  revalidatePath('/admin');
  revalidatePath('/cv/noa');
  revalidatePath('/cv/noa/complet');
  return { masked: next };
}

// ─── Bibliothèque — visibilité publique/privée forcée par l'admin (Tâche 4) ──

export interface SetVisibilityState {
  error?: string;
  ok?: string;
}

/**
 * Force la visibilité (public/privé) d'un CV, quel que soit son propriétaire.
 * Écrase la préférence par défaut de l'utilisateur — réservé owner/super admin.
 * L'accès par lien direct (/[slug]) reste actif dans tous les cas ; seule la
 * présence dans la Bibliothèque publique change (voir getCvBySlug / listPublicCvs).
 */
export async function setCvVisibility(
  _prevState: SetVisibilityState,
  formData: FormData,
): Promise<SetVisibilityState> {
  const cvId = String(formData.get('cv_id') ?? '').trim();
  const visibility = String(formData.get('visibility') ?? '').trim();
  if (!cvId) return { error: 'CV introuvable.' };
  if (!['public', 'private'].includes(visibility)) return { error: 'Visibilité invalide.' };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non connecté.' };

  const { data: actor } = await supabase
    .from('profiles')
    .select('is_owner, is_super_admin, account_status')
    .eq('id', user.id)
    .single();

  if (!actor?.is_owner && !actor?.is_super_admin) return { error: 'Accès refusé.' };
  if (actor.account_status && actor.account_status !== 'active') return { error: 'Compte inactif.' };

  const admin = createAdminClient();
  const { data: cv, error: fetchError } = await admin
    .from('cvs')
    .select('id, slug')
    .eq('id', cvId)
    .maybeSingle();
  if (fetchError || !cv) return { error: 'CV introuvable.' };

  const { error: updateError } = await admin
    .from('cvs')
    .update({ visibility })
    .eq('id', cvId);
  if (updateError) return { error: 'Impossible de mettre à jour la visibilité.' };

  revalidatePath('/admin');
  revalidatePath('/bibliotheque');
  revalidatePath(`/${cv.slug}`);
  return { ok: `Visibilité mise à jour : ${visibility === 'public' ? 'public' : 'privé'}.` };
}
