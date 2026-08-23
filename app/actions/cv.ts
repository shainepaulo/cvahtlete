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

export async function upsertCv(input: UpsertCvInput): Promise<UpsertCvResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { error: "Service indisponible." };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  let userIdToUpsert = user.id;
  if (input.targetUserId && input.targetUserId !== user.id) {
    const { data: actor } = await supabase
      .from("profiles")
      .select("is_owner, is_super_admin")
      .eq("id", user.id)
      .single();
    if (actor?.is_owner || actor?.is_super_admin) {
      userIdToUpsert = input.targetUserId;
    } else {
      return { error: "Accès refusé." };
    }
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

  // Snapshot cinematic depuis le plan courant (lecture RLS = self uniquement).
  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase.from("profiles").select("is_owner, plan").eq("id", userIdToUpsert).single(),
    supabase.from("subscriptions").select("season_expires_at").eq("user_id", userIdToUpsert).maybeSingle(),
  ]);
  const isSeasonExpired = !!(sub?.season_expires_at && new Date(sub.season_expires_at) < new Date());
  const cinematic_enabled = !!(
    profile?.is_owner ||
    profile?.plan === "club" ||
    profile?.plan === "pro" || // legacy
    (profile?.plan === "season" && !isSeasonExpired)
  );

  // CV existant ?
  const { data: existing } = await supabase
    .from("cvs")
    .select("id, slug")
    .eq("user_id", userIdToUpsert)
    .maybeSingle();

  let slug = (existing?.slug as string | undefined);
  if (!slug) {
    const base = slugify(`${first} ${last}`);
    const { data: taken } = await supabase
      .from("cvs").select("id").eq("slug", base).maybeSingle();
    slug = taken ? `${base}-${Date.now().toString(36).slice(-4)}` : base;
  }

  const row = {
    user_id: userIdToUpsert,
    slug,
    first,
    last,
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
    if (error) return { error: "Erreur lors de la sauvegarde." };
  } else {
    const { error } = await supabase.from("cvs").insert(row);
    if (error) {
      if (error.code === "23505") {
        const msg = `${error.message ?? ""}`.toLowerCase();
        if (msg.includes("cvs_user_id_unique") || msg.includes("user_id")) {
          return { error: "Un répertoire existe déjà pour ce compte." };
        }
        return { error: "Slug déjà pris — réessaie." };
      }
      return { error: "Erreur lors de la création." };
    }
  }

  revalidatePath(`/${slug}`);
  return { slug };
}

// ─── Lecture : CV de l'utilisateur courant ───────────────────────────────────

export async function getMyCv(targetUserId?: string): Promise<CvData | null> {
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

  const { data } = await supabase
    .from("cvs").select("*").eq("user_id", userIdToFetch).maybeSingle();
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
  cv.blocked = false; // Plus de blocage automatique des CV gratuits
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
