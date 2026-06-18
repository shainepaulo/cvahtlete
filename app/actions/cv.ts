"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

// ---------------------------------------------------------------------------
// Types — miroir exact du schéma SQL (migration 00001)
// ---------------------------------------------------------------------------

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export type CvVisibility = "private" | "public";

export interface CvData {
  id: string;
  user_id: string;
  slug: string;
  visibility: CvVisibility;
  first: string;
  last: string;
  sport: string;
  location: string;
  avatar_url: string | null;
  cine_bg_url: string | null;
  photo_pos_x: number;
  photo_pos_y: number;
  crop_zoom_avatar: number;
  stats: Json;
  palmares: Json;
  career: Json;
  links: Json;
  colors: Json;
  created_at: string;
  updated_at: string;
}

export interface UserQuota {
  plan: "free" | "starter" | "pro" | "club";
  plan_name: string | null;
  modifications_left: number | null; // null = illimité (Pro / Club)
  entitlements_cinematic: boolean;
  entitlements_multi: boolean;
}

type ActionResult<T = undefined> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Whitelist anti mass-assignment : seules ces colonnes sont modifiables par
// le client. id, user_id, created_at, etc. sont silencieusement ignorés.
// ---------------------------------------------------------------------------

const UPDATABLE_COLUMNS = [
  "slug",
  "visibility",
  "first",
  "last",
  "sport",
  "location",
  "avatar_url",
  "cine_bg_url",
  "photo_pos_x",
  "photo_pos_y",
  "crop_zoom_avatar",
  "stats",
  "palmares",
  "career",
  "links",
  "colors",
] as const;

type UpdatableColumn = (typeof UPDATABLE_COLUMNS)[number];
export type CvUpdatePayload = Partial<Pick<CvData, UpdatableColumn>>;

function sanitizePayload(payload: Record<string, unknown>): CvUpdatePayload {
  const clean: Record<string, unknown> = {};
  for (const key of UPDATABLE_COLUMNS) {
    if (key in payload) clean[key] = payload[key];
  }
  return clean as CvUpdatePayload;
}

// ---------------------------------------------------------------------------
// Filet serveur : validation stricte des VALEURS avant d'atteindre la DB.
// Architecture en 3 couches : client (UX) -> Server Action (autorité)
// -> Postgres CHECK/RLS/triggers (loi). Un attaquant qui appelle la Server
// Action directement (sans passer par l'UI) est bloqué ici.
// ---------------------------------------------------------------------------

const TEXT_MAX = 80;
const URL_MAX = 500;
const JSON_MAX_BYTES = 20_000; // par champ JSONB : anti-bloat / anti-DoS
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

/** Caractères de contrôle ASCII (codes < 32 et 127) : interdits dans tout
 *  champ texte. Vérification par charCode — aucune ambiguïté d'échappement. */
function hasControlChars(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code < 32 || code === 127) return true;
  }
  return false;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isValidText(v: unknown): boolean {
  return typeof v === "string" && v.length <= TEXT_MAX && !hasControlChars(v);
}

/** URL média : https obligatoire + hébergée sur NOTRE storage Supabase.
 *  Bloque les `javascript:`, `data:` et le détournement vers des hôtes tiers. */
function isValidMediaUrl(v: unknown): boolean {
  if (v === null) return true;
  if (typeof v !== "string" || v.length > URL_MAX) return false;
  try {
    const url = new URL(v);
    const allowedHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host;
    return url.protocol === "https:" && url.host === allowedHost;
  } catch {
    return false;
  }
}

function isBoundedNumber(v: unknown, min: number, max: number): boolean {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
}

function isBoundedJson(v: unknown, mustBeArray: boolean): boolean {
  if (mustBeArray ? !Array.isArray(v) : !isPlainObject(v)) return false;
  try {
    return JSON.stringify(v).length <= JSON_MAX_BYTES;
  } catch {
    return false; // structures circulaires / non sérialisables : rejet
  }
}

/** Retourne un message d'erreur utilisateur, ou null si tout est valide. */
function validatePayload(payload: CvUpdatePayload): string | null {
  for (const [key, value] of Object.entries(payload)) {
    switch (key as UpdatableColumn) {
      case "slug":
        if (typeof value !== "string" || !SLUG_RE.test(value))
          return "Lien personnalisé invalide (minuscules, chiffres et tirets).";
        break;
      case "visibility":
        if (value !== "private" && value !== "public")
          return "Visibilité invalide.";
        break;
      case "first":
      case "last":
      case "sport":
      case "location":
        if (!isValidText(value))
          return `Champ « ${key} » invalide ou trop long (max ${TEXT_MAX} caractères).`;
        break;
      case "avatar_url":
      case "cine_bg_url":
        if (!isValidMediaUrl(value))
          return "Les médias doivent être hébergés sur le stockage ATHLETE CV (https).";
        break;
      case "photo_pos_x":
      case "photo_pos_y":
        if (!isBoundedNumber(value, 0, 100))
          return "Position de recadrage hors limites (0-100).";
        break;
      case "crop_zoom_avatar":
        if (!isBoundedNumber(value, 1, 4))
          return "Zoom de recadrage hors limites (1-4).";
        break;
      case "stats":
      case "palmares":
      case "career":
      case "links":
        if (!isBoundedJson(value, true))
          return "Format de données invalide ou trop volumineux.";
        break;
      case "colors":
        if (!isBoundedJson(value, false))
          return "Format de couleurs invalide ou trop volumineux.";
        break;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 1) Mise à jour du CV
//    Le quota est appliqué par le trigger SQL `consume_modification` dans la
//    même transaction que l'UPDATE : ici on ne fait que traduire ses erreurs.
//    ATTENTION PRODUIT : chaque save réussi consomme 1 modification (Starter).
//    Le builder devra sauvegarder en un seul appel (bouton "Enregistrer"),
//    jamais en autosave champ par champ.
// ---------------------------------------------------------------------------

export async function updateAthleteCv(
  slug: string,
  updatePayload: Record<string, unknown>
): Promise<ActionResult<CvData>> {
  let supabase: ReturnType<typeof createClient>;
  try {
    supabase = createClient();
  } catch {
    // Supabase non configuré : échec contrôlé, jamais de 500 brut.
    return { success: false, error: "Service momentanément indisponible." };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Session expirée. Veuillez vous reconnecter." };
  }

  const payload = sanitizePayload(updatePayload);
  if (Object.keys(payload).length === 0) {
    return { success: false, error: "Aucun champ modifiable fourni." };
  }

  // Filet serveur : aucune valeur non conforme ne part vers la DB.
  const invalid = validatePayload(payload);
  if (invalid) {
    return { success: false, error: invalid };
  }

  const { data, error } = await supabase
    .from("cv_data")
    .update(payload)
    .eq("slug", slug)
    .eq("user_id", user.id) // redondant avec RLS : défense en profondeur
    .select()
    .single<CvData>();

  if (error) {
    if (error.message.includes("QUOTA_EXCEEDED")) {
      return {
        success: false,
        error: "Quota atteint. Passez au plan Pro pour des modifications illimitées.",
      };
    }
    if (error.code === "PGRST116") {
      // 0 ligne touchée : slug inexistant, ou CV d'un autre utilisateur (filtré par RLS)
      return { success: false, error: "CV introuvable." };
    }
    if (error.code === "23505") {
      return { success: false, error: "Ce lien personnalisé est déjà pris." };
    }
    if (error.code === "23514") {
      return {
        success: false,
        error: "Données invalides (format du lien ou valeurs hors limites).",
      };
    }
    console.error("[updateAthleteCv]", error);
    return { success: false, error: "Échec de la sauvegarde. Réessayez." };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${slug}`);
  if (payload.slug && payload.slug !== slug) {
    revalidatePath(`/${payload.slug}`); // le CV a changé d'URL : purger aussi la nouvelle
  }

  return { success: true, data, message: "Profil mis à jour avec succès." };
}

// ---------------------------------------------------------------------------
// 2) Récupération pour le rendu public via le slug (consommé par
//    app/[slug]/page.tsx à l'Étape 3).
//    RLS fait le tri : un CV 'private' consulté par un tiers renvoie 0 ligne
//    -> on retourne null -> 404. On ne révèle jamais l'existence d'un CV privé.
// ---------------------------------------------------------------------------

export async function getCvBySlug(
  slug: string
): Promise<{ cv: CvData | null; isOwner: boolean }> {
  let supabase: ReturnType<typeof createClient>;
  try {
    supabase = createClient();
  } catch {
    return { cv: null, isOwner: false }; // Supabase non configuré => 404 propre
  }

  const { data: cv, error } = await supabase
    .from("cv_data")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<CvData>();

  if (error || !cv) {
    if (error) console.error("[getCvBySlug]", error);
    return { cv: null, isOwner: false };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { cv, isOwner: user?.id === cv.user_id };
}

// ---------------------------------------------------------------------------
// 3) Quota & entitlements de l'utilisateur courant (dashboard / builder).
// ---------------------------------------------------------------------------

export async function getUserQuota(): Promise<UserQuota | null> {
  let supabase: ReturnType<typeof createClient>;
  try {
    supabase = createClient();
  } catch {
    return null; // Supabase non configuré
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("plan, plan_name, modifications_left, entitlements_cinematic, entitlements_multi")
    .eq("id", user.id)
    .single<UserQuota>();

  if (error) {
    console.error("[getUserQuota]", error);
    return null;
  }
  return data;
}
