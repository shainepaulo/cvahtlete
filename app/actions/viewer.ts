"use server";

import { createClient } from "@/utils/supabase/server";

export interface ViewerContext {
  /** Connecté en tant que owner / super admin (godpower). */
  isAdminViewer: boolean;
  /** État courant du masquage forcé des coordonnées sensibles pour cet admin. */
  adminForceMask: boolean;
}

const DEFAULT: ViewerContext = { isAdminViewer: false, adminForceMask: true };

/**
 * Contexte du visiteur courant pour le Privacy Lock (Tâche 3.2) : sert à
 * déterminer si les coordonnées sensibles (téléphone / e-mail) doivent
 * s'afficher en clair pour ce viewer, peu importe le CV consulté.
 */
export async function getViewerContext(): Promise<ViewerContext> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return DEFAULT;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return DEFAULT;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_owner, is_super_admin, admin_force_contact_mask")
    .eq("id", user.id)
    .single();

  const isAdminViewer = !!(profile?.is_owner || profile?.is_super_admin);
  if (!isAdminViewer) return DEFAULT;

  return {
    isAdminViewer: true,
    adminForceMask: profile?.admin_force_contact_mask ?? true,
  };
}
