"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { uploadToPcloud } from "@/utils/pcloud";

const BUCKET = "cv-images";
const MAX_BYTES = 2 * 1024 * 1024; // 2 Mo
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

export async function uploadImage(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { error: "Service indisponible." };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "Fichier manquant." };
  if (file.size > MAX_BYTES) return { error: "Taille max : 2 Mo." };
  if (!ALLOWED_TYPES.has(file.type)) return { error: "Format non supporté (jpg, png, webp, avif, gif)." };

  const targetUserId = formData.get("targetUserId") as string | null;
  let userIdToUse = user.id;
  let useAdmin = false;

  if (targetUserId && targetUserId !== user.id) {
    const { data: actor } = await supabase
      .from("profiles")
      .select("is_owner, is_super_admin")
      .eq("id", user.id)
      .single();
    if (actor?.is_owner || actor?.is_super_admin) {
      userIdToUse = targetUserId;
      useAdmin = true;
    }
  }

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z]/g, "") || "jpg";
  const path = `${userIdToUse}/${Date.now()}.${ext}`;

  const bytes = await file.arrayBuffer();
  const clientToUse = useAdmin ? createAdminClient() : supabase;
  const { error } = await clientToUse.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (error) return { error: "Échec de l'upload." };

  const { data } = clientToUse.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

const MAX_VIDEO_BYTES = 150 * 1024 * 1024; // 150 Mo
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"]);

export async function uploadVideo(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { error: "Service indisponible." };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const file = formData.get("video");
  if (!(file instanceof File) || file.size === 0) return { error: "Fichier vidéo manquant." };
  if (file.size > MAX_VIDEO_BYTES) {
    return { error: "Vidéo trop lourde (150 Mo max). Pour un clip plus long, privilégie un lien YouTube ou Vimeo." };
  }
  if (file.type && !ALLOWED_VIDEO_TYPES.has(file.type.toLowerCase()) && !file.name.match(/\.(mp4|webm|mov|m4v)$/i)) {
    return { error: "Format vidéo non supporté (MP4, WebM, MOV acceptés)." };
  }

  const targetUserId = formData.get("targetUserId") as string | null;
  let userIdToUse = user.id;
  let useAdmin = false;

  if (targetUserId && targetUserId !== user.id) {
    const { data: actor } = await supabase
      .from("profiles")
      .select("is_owner, is_super_admin")
      .eq("id", user.id)
      .single();
    if (actor?.is_owner || actor?.is_super_admin) {
      userIdToUse = targetUserId;
      useAdmin = true;
    }
  }

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z]/g, "") || "mp4";
  const filename = `${userIdToUse}_${Date.now()}.${ext}`;

  // Si l'accès pCloud est configuré dans .env.local, on envoie directement sur votre pCloud !
  if (process.env.PCLOUD_ACCESS_TOKEN) {
    return await uploadToPcloud(file, filename);
  }

  // Repli sur Supabase Storage si pCloud n'est pas encore configuré
  const path = `${userIdToUse}/videos/${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();
  const clientToUse = useAdmin ? createAdminClient() : supabase;
  const { error } = await clientToUse.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type || 'video/mp4', upsert: true });
  if (error) return { error: `Échec de l'upload : ${error.message}` };

  const { data } = clientToUse.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
