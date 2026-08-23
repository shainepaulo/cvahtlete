"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { normalizePublicLinks } from "@/utils/public-links";

// ─── Type partagé (CineView · ProfileView · builder · /[slug]) ───────────────
// Convention camelCase : correspond au builder, aux JSON de démo et à ProfileView.
// rowToCv() fait la traduction DB→camelCase en un seul endroit.

export interface CvData {
  slug: string;
  first: string;
  last: string;
  sport: string;
  emoji?: string;
  discipline?: string;
  tagline?: string;
  bio?: string;
  location?: string;
  verified?: boolean;
  colors: { a?: string; b?: string };
  avatar?: string;
  photoPosX?: number;
  photoPosY?: number;
  cropZoomAvatar?: number;
  cineBg?: string;
  cineBgPosX?: number;
  cineBgPosY?: number;
  cropZoomCineBg?: number;
  cinematic?: boolean;
  stats?: unknown[];
  palmares?: unknown[];
  career?: unknown[];
  links?: unknown[];
  visibility?: string;
  blocked?: boolean;
  hasPro?: boolean;
  plan?: string;
  characteristics?: Array<{ name: string; value: string }>;
  showCharacteristics?: boolean;
  showSections?: Record<string, boolean>;
  birthDate?: string;
  nationality?: string;
  eligibility?: string;
  contactPhone?: string;
  contactEmail?: string;
}

const EMOJI: Record<string, string> = {
  Football: "⚽",
  Basket: "🏀",
  Basketball: "🏀",
  Handball: "🤾",
  Escrime: "🤺",
  Tennis: "🎾",
  Volley: "🏐",
  "Athlétisme": "⚡",
  Rugby: "🏉",
  Autre: "🏅",
};

function rowToCv(row: Record<string, unknown>): CvData {
  const colors = (row.colors as Record<string, string> | null) ?? {};
  return {
    slug: String(row.slug ?? ""),
    first: String(row.first ?? ""),
    last: String(row.last ?? ""),
    sport: String(row.sport ?? ""),
    emoji: EMOJI[String(row.sport)] ?? "🏅",
    discipline: (row.discipline as string) || undefined,
    tagline: (row.tagline as string) || undefined,
    bio: (row.bio as string) || undefined,
    location: (row.location as string) || undefined,
    verified: true,
    colors: { a: colors.a, b: colors.b },
    avatar: (row.avatar_url as string) || undefined,
    photoPosX: (row.photo_pos_x as number) ?? 50,
    photoPosY: (row.photo_pos_y as number) ?? 50,
    cropZoomAvatar: Number(row.crop_zoom_avatar ?? 1.4),
    cineBg: (row.cine_bg_url as string) || undefined,
    cineBgPosX: (row.cine_bg_pos_x as number) ?? 50,
    cineBgPosY: (row.cine_bg_pos_y as number) ?? 50,
    cropZoomCineBg: Number(row.crop_zoom_cine_bg ?? 1.25),
    cinematic: !!(row.cinematic_enabled),
    stats: (row.stats as unknown[]) ?? [],
    palmares: (row.palmares as unknown[]) ?? [],
    career: (row.career as unknown[]) ?? [],
    links: normalizePublicLinks(row.links),
    visibility: String(row.visibility ?? "private"),
    characteristics: (row.characteristics as Array<{ name: string; value: string }>) ?? [],
    showCharacteristics: !!row.show_characteristics,
    showSections: (row.show_sections as Record<string, boolean>) || undefined,
    birthDate: (row.birth_date as string) || undefined,
    nationality: (row.nationality as string) || undefined,
    eligibility: (row.eligibility as string) || undefined,
    contactPhone: (row.contact_phone as string) || undefined,
    contactEmail: (row.contact_email as string) || undefined,
  };
}

// ─── Slugify ─────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// ─── Upsert CV ───────────────────────────────────────────────────────────────

export interface UpsertCvInput {
  first: string;
  last: string;
  sport: string;
  discipline?: string;
  tagline?: string;
  bio?: string;
  location?: string;
  colors?: { a: string; b: string };
  avatar?: string;
  photoPosX?: number;
  photoPosY?: number;
  cropZoomAvatar?: number;
  cineBg?: string;
  cineBgPosX?: number;
  cineBgPosY?: number;
  cropZoomCineBg?: number;
  stats?: unknown[];
  palmares?: unknown[];
  career?: unknown[];
  links?: unknown[];
  visibility?: "private" | "public";
  characteristics?: Array<{ name: string; value: string }>;
  showCharacteristics?: boolean;
  targetUserId?: string;
  /** ID d'un CV existant à mettre à jour. Si absent → création d'un nouveau CV. */
  cvId?: string;
  /** Slug manuel (optionnel). Si absent → auto-généré depuis first+last. */
  customSlug?: string;
  showSections?: Record<string, boolean>;
  birthDate?: string;
  nationality?: string;
  eligibility?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface UpsertCvResult {
  slug?: string;
  error?: string;
}

const JSON_MAX = 20_000; // anti-bloat / anti-DoS

function isSafeJson(v: unknown): boolean {
  if (!Array.isArray(v)) return false;
  try {
    return JSON.stringify(v).length <= JSON_MAX;
  } catch {
    return false;
  }
}

// Limite de CV par compte (hors super admin)
const CV_LIMIT = 15;

export async function upsertCv(input: UpsertCvInput): Promise<UpsertCvResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { error: "Service indisponible." };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  // ── Résolution de l'utilisateur cible ─────────────────────────────────────
  let userIdToUpsert = user.id;
  let actorIsAdmin = false;

  const { data: actor } = await supabase
    .from("profiles")
    .select("is_owner, is_super_admin, plan")
    .eq("id", user.id)
    .single();

  if (actor?.is_owner || actor?.is_super_admin) actorIsAdmin = true;

  if (input.targetUserId && input.targetUserId !== user.id) {
    if (!actorIsAdmin) return { error: "Accès refusé." };
    userIdToUpsert = input.targetUserId;
  }

  const first = input.first.trim().slice(0, 60);
  const last = input.last.trim().slice(0, 60);
  if (!first || !last) return { error: "Prénom et nom requis." };

  // Validation des JSONB côté serveur (défense en profondeur).
  for (const [field, val] of [
    ["stats", input.stats ?? []],
    ["palmares", input.palmares ?? []],
    ["career", input.career ?? []],
    ["links", input.links ?? []],
  ] as const) {
    if (!isSafeJson(val)) return { error: `Données « ${field} » invalides ou trop volumineuses.` };
  }

  const links = normalizePublicLinks(input.links);

  // ── Plan & droits cinématique ──────────────────────────────────────────────
  const [{ data: targetProfile }, { data: sub }] = await Promise.all([
    supabase.from("profiles").select("is_owner, is_super_admin, plan").eq("id", userIdToUpsert).single(),
    supabase.from("subscriptions").select("season_expires_at").eq("user_id", userIdToUpsert).maybeSingle(),
  ]);
  const isSeasonExpired = !!(sub?.season_expires_at && new Date(sub.season_expires_at) < new Date());
  const canMultiCv = !!(actorIsAdmin || targetProfile?.is_owner || targetProfile?.is_super_admin ||
    targetProfile?.plan === "club");

  // ── Ciblage du CV existant ────────────────────────────────────────────────
  let existing: { id: string; slug: string; cinematic_enabled: boolean } | null = null;

  if (input.cvId) {
    // Mode édition d'un CV existant précis
    const { data } = await supabase
      .from("cvs")
      .select("id, slug, cinematic_enabled")
      .eq("id", input.cvId)
      .eq("user_id", userIdToUpsert)
      .maybeSingle();
    existing = data ?? null;
    if (!existing) return { error: "CV introuvable ou accès refusé." };
  } else if (!canMultiCv) {
    // Utilisateur mono-CV : cherche le CV existant par user_id
    const { data } = await supabase
      .from("cvs")
      .select("id, slug, cinematic_enabled")
      .eq("user_id", userIdToUpsert)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    existing = data ?? null;
  }
  // Si canMultiCv et pas de cvId → création d'un nouveau CV

  // ── Vérification de la limite ─────────────────────────────────────────────
  if (!existing && !input.cvId) {
    const isSuperAdmin = !!(actor?.is_super_admin || targetProfile?.is_super_admin);
    if (!isSuperAdmin) {
      const { count } = await supabase
        .from("cvs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userIdToUpsert);
      if ((count ?? 0) >= CV_LIMIT) {
        return { error: `Limite de ${CV_LIMIT} CV atteinte pour ce compte.` };
      }
    }
  }

  // ── Slug ──────────────────────────────────────────────────────────────────
  let slug = existing?.slug;
  if (!slug) {
    const base = input.customSlug
      ? slugify(input.customSlug)
      : slugify(`${first} ${last}`);
    const { data: taken } = await supabase
      .from("cvs").select("id").eq("slug", base).maybeSingle();
    slug = taken ? `${base}-${Date.now().toString(36).slice(-4)}` : base;
  } else if (input.customSlug) {
    // Slug modifié manuellement
    const newSlug = slugify(input.customSlug);
    if (newSlug !== slug) {
      const { data: taken } = await supabase
        .from("cvs").select("id").eq("slug", newSlug).maybeSingle();
      if (taken) return { error: "Ce slug est déjà utilisé — choisis-en un autre." };
      slug = newSlug;
    }
  }

  // ── Flag cinématique ──────────────────────────────────────────────────────
  // On ne touche pas au flag si le CV existe (géré via admin toggle),
  // sauf à la création où on l'initialise selon le plan.
  const cinematic_enabled = existing
    ? existing.cinematic_enabled  // Préserve la valeur existante
    : !!(
        targetProfile?.is_owner ||
        targetProfile?.is_super_admin ||
        targetProfile?.plan === "club" ||
        targetProfile?.plan === "pro" ||
        (targetProfile?.plan === "season" && !isSeasonExpired)
      );

  const row = {
    user_id: userIdToUpsert,
    slug,
    first,
    last,
    label: `${first} ${last}`,
    sport: input.sport.slice(0, 40),
    discipline: (input.discipline ?? "").slice(0, 60),
    location: (input.location ?? "").slice(0, 80),
    tagline: (input.tagline ?? "").slice(0, 160),
    bio: (input.bio ?? "").slice(0, 2000),
    avatar_url: input.avatar || null,
    cine_bg_url: input.cineBg || null,
    photo_pos_x: input.photoPosX ?? 50,
    photo_pos_y: input.photoPosY ?? 50,
    crop_zoom_avatar: input.cropZoomAvatar ?? 1.4,
    cine_bg_pos_x: input.cineBgPosX ?? 50,
    cine_bg_pos_y: input.cineBgPosY ?? 50,
    crop_zoom_cine_bg: input.cropZoomCineBg ?? 1.25,
    stats: input.stats ?? [],
    palmares: input.palmares ?? [],
    career: input.career ?? [],
    links,
    colors: input.colors ?? { a: "#8bb6ff", b: "#79e0cf" },
    visibility: input.visibility ?? "private",
    cinematic_enabled,
    characteristics: input.characteristics ?? [],
    show_characteristics: !!input.showCharacteristics,
    show_sections: input.showSections ?? { stats: true, palmares: true, career: true, bio: true },
    birth_date: (input.birthDate ?? '').slice(0, 20) || null,
    nationality: (input.nationality ?? '').slice(0, 60) || null,
    eligibility: (input.eligibility ?? '').slice(0, 100) || null,
    contact_phone: (input.contactPhone ?? '').slice(0, 30) || null,
    contact_email: (input.contactEmail ?? '').slice(0, 120) || null,
  };

  if (existing) {
    const { error } = await supabase.from("cvs").update(row).eq("id", existing.id);
    if (error) return { error: `Erreur lors de la sauvegarde : ${error.message} (${error.code})` };
  } else {
    const { error } = await supabase.from("cvs").insert(row);
    if (error) {
      if (error.code === "23505") {
        return { error: "Slug déjà pris — réessaie ou modifie le slug manuellement." };
      }
      return { error: `Erreur lors de la création : ${error.message} (${error.code})` };
    }
  }

  revalidatePath(`/${slug}`);
  revalidatePath("/dashboard");
  return { slug };
}

// ─── Lecture : liste de tous les CV d'un compte ──────────────────────────────

export interface CvSummary {
  id: string;
  slug: string;
  label: string;
  first: string;
  last: string;
  sport: string;
  emoji: string;
  avatar?: string;
  visibility: string;
  cinematic_enabled: boolean;
  created_at: string;
}

export async function listMyCvs(targetUserId?: string): Promise<CvSummary[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let userIdToFetch = user.id;

  if (targetUserId && targetUserId !== user.id) {
    const { data: actor } = await supabase
      .from("profiles")
      .select("is_owner, is_super_admin")
      .eq("id", user.id)
      .single();
    if (!(actor?.is_owner || actor?.is_super_admin)) return [];
    userIdToFetch = targetUserId;
  }

  const { data } = await supabase
    .from("cvs")
    .select("id, slug, label, first, last, sport, avatar_url, visibility, cinematic_enabled, created_at")
    .eq("user_id", userIdToFetch)
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    label: String(row.label || `${row.first} ${row.last}`),
    first: String(row.first),
    last: String(row.last),
    sport: String(row.sport),
    emoji: EMOJI[String(row.sport)] ?? "🏅",
    avatar: (row.avatar_url as string) || undefined,
    visibility: String(row.visibility),
    cinematic_enabled: !!(row.cinematic_enabled),
    created_at: String(row.created_at),
  }));
}

// ─── Lecture : CV de l'utilisateur courant (premier CV ou par cvId) ───────────

export async function getMyCv(targetUserId?: string, cvId?: string): Promise<CvData | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let userIdToFetch = user.id;
  let isActorAdmin = false;

  const { data: actor } = await supabase
    .from("profiles")
    .select("is_owner, is_super_admin")
    .eq("id", user.id)
    .single();

  if (actor?.is_owner || actor?.is_super_admin) {
    isActorAdmin = true;
    if (targetUserId) {
      userIdToFetch = targetUserId;
    }
  } else if (targetUserId && targetUserId !== user.id) {
    return null;
  }

  // Si cvId fourni → CV précis, sinon → premier CV du compte
  let query = supabase.from("cvs").select("*").eq("user_id", userIdToFetch);
  if (cvId) {
    query = query.eq("id", cvId);
  } else {
    query = query.order("created_at", { ascending: true }).limit(1);
  }
  const { data } = await query.maybeSingle();
  if (!data) return null;
  const cv = rowToCv(data as Record<string, unknown>);

  // Vérification de l'expiration dynamique et attribution du statut Pro
  const [{ data: sub }, { data: profile }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("status, trial_ends_at, plan, season_expires_at")
      .eq("user_id", userIdToFetch)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("is_owner, plan")
      .eq("id", userIdToFetch)
      .maybeSingle()
  ]);

  const isSeasonExpired = !!(sub?.season_expires_at && new Date(sub.season_expires_at) < new Date());
  const hasPaid = isActorAdmin || !!(
    profile?.is_owner ||
    profile?.plan === 'club' ||
    (profile?.plan === 'season' && !isSeasonExpired) ||
    sub?.plan === 'club' ||
    (sub?.plan === 'season' && !isSeasonExpired) ||
    sub?.status === 'active'
  );

  cv.hasPro = hasPaid;
  cv.plan = isActorAdmin ? 'club' : (profile?.plan ?? 'free');
  cv.blocked = false;
  cv.showSections = cv.showSections ?? { stats: true, palmares: true, career: true, bio: true };
  return cv;
}

// ─── Lecture : CV par slug (RLS gère public / self / owner) ──────────────────

export async function getCvBySlug(slug: string): Promise<CvData | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = createClient();
  const { data } = await supabase
    .from("cvs").select("*").eq("slug", slug).maybeSingle();

  let cvRow = data;
  if (!cvRow) {
    const admin = createAdminClient();
    const { data: direct } = await admin
      .from("cvs").select("*").eq("slug", slug).maybeSingle();
    cvRow = direct;
  }

  if (!cvRow) return null;

  const cv = rowToCv(cvRow as Record<string, unknown>);

  const admin = createAdminClient();
  const [{ data: sub }, { data: ownerProfile }] = await Promise.all([
    admin.from("subscriptions").select("status, trial_ends_at, plan, season_expires_at").eq("user_id", cvRow.user_id).maybeSingle(),
    admin.from("profiles").select("is_owner, is_super_admin, plan").eq("id", cvRow.user_id).maybeSingle(),
  ]);

  const isOwner = !!(ownerProfile?.is_owner || ownerProfile?.is_super_admin);
  const isSeasonExpired = !!(sub?.season_expires_at && new Date(sub.season_expires_at) < new Date());
  const hasPaid = !!(
    isOwner ||
    ownerProfile?.plan === 'club' ||
    (ownerProfile?.plan === 'season' && !isSeasonExpired) ||
    sub?.plan === 'club' ||
    (sub?.plan === 'season' && !isSeasonExpired) ||
    sub?.status === 'active'
  );

  cv.hasPro = hasPaid;
  cv.plan = ownerProfile?.plan ?? 'free';
  cv.blocked = false; // Plus de blocage automatique des CV gratuits
  return cv;
}

// ─── Lecture : Bibliothèque publique (Tâche 4) ────────────────────────────────

export interface PublicCvSummary {
  slug: string;
  first: string;
  last: string;
  sport: string;
  emoji: string;
  tagline?: string;
  location?: string;
  avatar?: string;
}

export async function listPublicCvs(): Promise<PublicCvSummary[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("cvs")
    .select("slug, first, last, sport, tagline, location, avatar_url, created_at")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    slug: String(row.slug ?? ""),
    first: String(row.first ?? ""),
    last: String(row.last ?? ""),
    sport: String(row.sport ?? ""),
    emoji: EMOJI[String(row.sport)] ?? "🏅",
    tagline: (row.tagline as string) || undefined,
    location: (row.location as string) || undefined,
    avatar: (row.avatar_url as string) || undefined,
  }));
}

export async function deleteCv(cvId: string): Promise<{ ok?: string; error?: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { error: "Service indisponible." };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  // Double vérification : l'utilisateur courant doit être propriétaire du CV (ou admin/owner)
  const { data: cv, error: fetchError } = await supabase
    .from("cvs")
    .select("id, user_id, slug")
    .eq("id", cvId)
    .maybeSingle();

  if (fetchError || !cv) return { error: "CV introuvable." };

  // Est-il admin ou propriétaire ?
  let authorized = cv.user_id === user.id;
  if (!authorized) {
    const { data: actor } = await supabase
      .from("profiles")
      .select("is_owner, is_super_admin")
      .eq("id", user.id)
      .single();
    if (actor?.is_owner || actor?.is_super_admin) {
      authorized = true;
    }
  }

  if (!authorized) return { error: "Action non autorisée." };

  // Suppression
  const admin = createAdminClient();
  const { error: deleteError } = await admin.from("cvs").delete().eq("id", cvId);
  if (deleteError) return { error: "Impossible de supprimer le CV." };

  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/bibliotheque");
  revalidatePath(`/${cv.slug}`);
  return { ok: "CV supprimé avec succès." };
}
