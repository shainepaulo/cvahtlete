import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCvBySlug } from "@/app/actions/cv";
import CvViewer from "@/components/cv/CvViewer";

interface PageProps {
  params: { slug: string }; // Next.js 14 : params est synchrone
}

// Déduplication : generateMetadata + page partagent la même requête
// au sein d'un même rendu (un seul hit Supabase au lieu de deux).
const getCv = cache(async (slug: string) => getCvBySlug(slug.toLowerCase()));

// ---------------------------------------------------------------------------
// SEO — uniquement pour les CV publics. Les CV privés ne sont jamais indexés.
// ---------------------------------------------------------------------------
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cv } = await getCv(params.slug);

  if (!cv || cv.visibility !== "public") {
    return { title: "ATHLETE CV", robots: { index: false, follow: false } };
  }

  const fullName = `${cv.first} ${cv.last}`.trim();
  return {
    title: `${fullName} — ${cv.sport} | ATHLETE CV`,
    description: `Découvrez le parcours, le palmarès et les statistiques de ${fullName}, ${cv.sport} (${cv.location}).`,
    openGraph: {
      title: `${fullName} — ${cv.sport}`,
      type: "profile",
      images: cv.avatar_url ? [{ url: cv.avatar_url }] : [],
    },
  };
}

// ---------------------------------------------------------------------------
// Page publique d'un CV : cvathlete.com/{slug}
// ---------------------------------------------------------------------------
export default async function PublicCvPage({ params }: PageProps) {
  const { cv, isOwner } = await getCv(params.slug);

  // 404 : slug inexistant — OU CV privé consulté par un tiers (la RLS de la
  // migration 00001 renvoie 0 ligne dans ce cas, donc cv === null : on ne
  // révèle jamais l'existence d'un profil privé).
  if (!cv) notFound();

  // Défense en profondeur : même si la RLS laissait passer la ligne,
  // un CV privé ne s'affiche que pour son propriétaire.
  if (cv.visibility === "private" && !isOwner) notFound();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b1120] text-slate-100 antialiased">
      {/* Halos lumineux — Tomorrow Night Blue */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-[#8bb6ff]/10 blur-[120px]" />
        <div className="absolute bottom-0 left-[-160px] h-[360px] w-[360px] rounded-full bg-[#79e0cf]/10 blur-[100px]" />
        <div className="absolute right-[-120px] top-1/3 h-[320px] w-[320px] rounded-full bg-[#ffd98a]/[0.07] blur-[100px]" />
      </div>

      {/* Bandeau "aperçu privé" : visible uniquement par le propriétaire */}
      {isOwner && cv.visibility === "private" && (
        <div className="relative z-20 border-b border-[#8bb6ff]/20 bg-[#001b3d]/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3 text-sm">
            <p className="text-[#8bb6ff]">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#ffd98a] align-middle" />
              Profil privé — vous seul pouvez voir cette page.
            </p>
            <Link
              href="/dashboard"
              className="shrink-0 rounded-full border border-[#8bb6ff]/30 px-4 py-1.5 font-medium text-[#8bb6ff] transition hover:bg-[#8bb6ff]/10"
            >
              Gérer mon CV
            </Link>
          </div>
        </div>
      )}

      {/* Contenu : composant client (animations, cinématique à venir) */}
      <div className="relative z-10">
        <CvViewer cv={cv} isOwner={isOwner} />
      </div>
    </main>
  );
}
