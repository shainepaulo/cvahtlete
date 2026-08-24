"use client";

/**
 * CineView — Mode cinématique immersif (offre Pro/Club).
 *
 * Mise en scène photo plein écran, calquée sur le mode cinématique de Noa
 * (galerie cliquable, fondu noir entre les images, flèches de navigation,
 * scrim de lisibilité), avec les overlays Framer Motion d'ATHLETE CV.
 * L'ancienne scène 3D Three.js (particules/« galaxie ») a été retirée :
 * fond photo net, ou dégradés de la charte si aucune image n'est fournie.
 *
 * INTÉGRATION :
 *   const CineView = dynamic(() => import("@/components/CineView"), { ssr: false });
 *   <CineView cv={cv} cinematic={ownerEntitlements.cinematic} />
 *
 * SÉCURITÉ AFFICHAGE : les JSONB (stats, palmares, career, links, colors,
 * gallery) sont re-validés à l'entrée : textes bornés sans caractères de
 * contrôle (React échappe le HTML), URLs https ou chemins locaux uniquement,
 * couleurs hex strictes (seules valeurs injectées dans des styles inline).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { CvData } from "@/app/actions/cv";
import { PlayerVideo } from "@/components/PlayerVideo";

// ===========================================================================
// 1. CHARTE — Tomorrow Night Blue
// ===========================================================================

const BRAND = {
  bg: "#002451",
  blue: "#8bb6ff",
  green: "#79e0cf",
} as const;

// ===========================================================================
// 2. FILETS DE SÉCURITÉ — parsing strict des JSONB avant affichage
// ===========================================================================

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function toSafeText(v: unknown, max = 80): string {
  if (typeof v === "number" && Number.isFinite(v)) v = String(v);
  if (typeof v !== "string") return "";
  let out = "";
  for (let i = 0; i < v.length; i++) {
    const code = v.charCodeAt(i);
    if (code >= 32 && code !== 127) out += v[i];
  }
  return out.slice(0, max).trim();
}

function toSafeHttpsUrl(v: unknown): string | null {
  if (typeof v !== "string" || v.length > 500) return null;
  try {
    const url = new URL(v);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

/** Seules des couleurs hex strictes finissent dans un style inline. */
function toSafeHex(v: unknown, fallback: string): string {
  return typeof v === "string" && HEX_COLOR.test(v) ? v : fallback;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

interface CineStat { label: string; value: string; unit: string }
interface CinePalmares { icon: string; name: string; count: string; detail: string }
interface CineCareer { year: string; club: string; detail: string }
interface CineLink { label: string; url: string }

function parseStats(raw: unknown): CineStat[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 6).flatMap((item) => {
    if (!isRecord(item)) return [];
    const label = toSafeText(item.label);
    const value = toSafeText(item.value, 20);
    const unit = toSafeText(item.unit, 8);
    return label && value ? [{ label, value, unit }] : [];
  });
}

function parsePalmares(raw: unknown): CinePalmares[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 8).flatMap((item) => {
    if (!isRecord(item)) return [];
    const icon = toSafeText(item.icon, 8);
    const name = toSafeText(item.name);
    const count = toSafeText(item.count, 12);
    const detail = toSafeText(item.detail);
    return name ? [{ icon, name, count, detail }] : [];
  });
}

function parseCareer(raw: unknown): CineCareer[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 12).flatMap((item) => {
    if (!isRecord(item)) return [];
    const year = toSafeText(item.year, 12);
    const club = toSafeText(item.club);
    const detail = toSafeText(item.detail);
    return year || club ? [{ year, club, detail }] : [];
  });
}

function parseLinks(raw: unknown): CineLink[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 6).flatMap((item) => {
    if (!isRecord(item)) return [];
    const label = toSafeText(item.label, 30);
    const url = toSafeHttpsUrl(item.url); // https obligatoire, sinon le lien saute
    return label && url ? [{ label, url }] : [];
  });
}

interface CineGalleryPhoto {
  src: string;
  alt: string;
  posX: number;
  posY: number;
  zoom: number;
  position?: string;
}

function cropTf(x = 50, y = 50, z = 1.4) {
  const m = (z - 1) / 2 * 100;
  return `translate(${(m * (1 - x / 50)).toFixed(2)}%,${(m * (1 - y / 50)).toFixed(2)}%) scale(${z})`;
}

/** Galerie de fond : chemins locaux (/images/...) ou https uniquement. */
function parseGallery(raw: unknown): CineGalleryPhoto[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 8).flatMap((item) => {
    if (!isRecord(item)) return [];
    const local = typeof item.src === "string" && item.src.startsWith("/") && !item.src.startsWith("//");
    const src = local ? (item.src as string) : toSafeHttpsUrl(item.src) ?? "";
    if (!src) return [];
    const position = toSafeText(item.position, 24) || undefined;
    return [{
      src,
      alt: toSafeText(item.alt, 120),
      posX: typeof item.posX === "number" ? item.posX : 50,
      posY: typeof item.posY === "number" ? item.posY : 50,
      zoom: typeof item.zoom === "number" ? item.zoom : 1.25,
      position,
    }];
  });
}

// ===========================================================================
// 3. FOND — photo plein écran ou dégradés de la charte
// ===========================================================================

/** Fond sans photo : halos de la charte, sobres et propres (aucun WebGL). */
function GradientBackdrop() {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        background: `
          radial-gradient(640px 420px at 18% 78%, ${BRAND.blue}1f, transparent 70%),
          radial-gradient(560px 380px at 82% 22%, ${BRAND.green}1a, transparent 70%),
          radial-gradient(800px 600px at 50% 110%, ${BRAND.blue}14, transparent 75%),
          ${BRAND.bg}`,
      }}
    />
  );
}

// ===========================================================================
// 4. COMPOSANT PRINCIPAL — photo + overlays Framer Motion
// ===========================================================================

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } },
};

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT },
  },
};

export interface CineViewProps {
  cv: CvData;
  /** entitlements_cinematic du propriétaire du CV (lecture serveur, jamais le client). */
  cinematic: boolean;
  /** Accroche optionnelle (colonne dédiée prévue en migration 00002). */
  tagline?: string;
  /** Galerie photo de fond (JSON démo ou cine_bg_url). */
  gallery?: unknown;
  /** Cible du bouton « CV complet » (démos : route dédiée ; défaut : /slug). */
  completHref?: string;
  /** Cible de l'encoche « Mode Classique » (même logique que le CV de Noa). */
  classicHref?: string;
}

export default function CineView({ cv, cinematic, tagline, gallery, completHref, classicHref }: CineViewProps) {
  // ---- Données : tout passe au filet avant affichage ----------------------
  const data = useMemo(() => {
    const colors = isRecord(cv.colors) ? cv.colors : {};
    return {
      first: toSafeText(cv.first),
      last: toSafeText(cv.last),
      sport: toSafeText(cv.sport),
      location: toSafeText(cv.location),
      tagline: toSafeText(tagline, 160),
      colorA: toSafeHex(colors.a, BRAND.blue),
      colorB: toSafeHex(colors.b, BRAND.green),
      stats: parseStats(cv.stats),
      palmares: parsePalmares(cv.palmares),
      career: parseCareer(cv.career),
      links: parseLinks(cv.links),
      gallery: parseGallery(gallery),
    };
  }, [cv, tagline, gallery]);

  const reducedMotion = useReducedMotion() ?? false;
  const [panelOpen, setPanelOpen] = useState(false);

  // ---- Galerie photo de fond : fondu noir entre les images (pattern Noa) --
  const photos = data.gallery;
  const hasGallery = photos.length > 0;
  const [photoIndex, setPhotoIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const fadeTimers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  // Préchargement : évite le flash blanc au premier changement de photo.
  useEffect(() => {
    photos.forEach((p) => {
      const img = new window.Image();
      img.src = p.src;
    });
  }, [photos]);

  useEffect(
    () => () => {
      fadeTimers.current.forEach(clearTimeout);
    },
    []
  );

  /** Voile noir opaque → changement de photo → voile levé. */
  function changePhoto(dir: 1 | -1) {
    if (fading || photos.length < 2) return;
    setFading(true);
    fadeTimers.current.push(
      setTimeout(() => {
        setPhotoIndex((i) => (i + dir + photos.length) % photos.length);
        fadeTimers.current.push(setTimeout(() => setFading(false), 80));
      }, 380)
    );
  }

  // ---- Swipe tactile pour le carrousel sur mobile --------------------------
  const touchStartX = useRef(0);
  const isSwipe = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isSwipe.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diffX = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(diffX) > 10) {
      isSwipe.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isSwipe.current && e.changedTouches.length > 0) {
      const diffX = e.changedTouches[0].clientX - touchStartX.current;
      const threshold = 40; // distance minimale en pixels
      if (Math.abs(diffX) > threshold) {
        if (diffX < 0) {
          changePhoto(1); // glissement gauche -> photo suivante
        } else {
          changePhoto(-1); // glissement droite -> photo précédente
        }
      }
    }
  };

  const handleClickBackground = (e: React.MouseEvent) => {
    if (isSwipe.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    changePhoto(1);
  };

  // ---- Verrou premium : le booléen vient du SERVEUR (entitlements RLS) ----
  if (!cinematic) {
    return (
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-bg px-6">
        <GradientBackdrop />
        <div className="relative z-10 max-w-md rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
          <h1 className="font-display text-2xl font-bold text-text-main">
            Mode cinématique 🎬
          </h1>
          <p className="font-body mt-3 text-text-muted">
            Ce CV n&apos;a pas l&apos;option cinématique — réservée à
            l&apos;offre Pro (79&nbsp;€, paiement unique).
          </p>
          <Link
            href="/tarifs"
            className="font-display mt-6 inline-block rounded-xl bg-accent px-6 py-3 text-sm font-bold text-brand-bg transition hover:opacity-90"
          >
            Passer au Pro
          </Link>
        </div>
      </section>
    );
  }

  // Résolution robuste des vidéos (depuis cv.videos ou showSections._videos)
  const videosList = useMemo(() => {
    const raw = (Array.isArray(cv.videos) && cv.videos.length > 0)
      ? cv.videos
      : (cv.showSections && typeof cv.showSections === 'object' && Array.isArray((cv.showSections as Record<string, unknown>)._videos)
          ? (cv.showSections as Record<string, unknown>)._videos as Array<{ title: string; url: string }>
          : []);

    return raw.map(vid => {
      const urlRaw = (vid.url || '').trim();
      const titleRaw = (vid.title || '').trim();
      const videoUrl = urlRaw || (titleRaw.startsWith('http') || titleRaw.includes('youtu') || titleRaw.includes('vimeo') ? titleRaw : '');
      const videoTitle = videoUrl === titleRaw ? '' : titleRaw;
      return videoUrl ? { url: videoUrl, title: videoTitle } : null;
    }).filter(Boolean) as Array<{ url: string; title: string }>;
  }, [cv.videos, cv.showSections]);

  const hasVideos = videosList.length > 0;
  const hasDetails =
    data.stats.length > 0 || data.palmares.length > 0 || data.career.length > 0 || hasVideos;

  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-bg text-text-main">
      {/* ---- Bouton retour vers Athlete CV ---- */}
      {!panelOpen && (
        <Link href="/dashboard" className="cv-back-to-site" aria-label="Retour au site">
          ← CVATHLETE
        </Link>
      )}

      {/* ---- Encoche Classique / Cinématique (même logique que le CV de Noa) -- */}
      {!panelOpen && classicHref && (
        <nav className="cv-mode-switch" aria-label="Mode de visualisation">
          <Link href={classicHref}>📄 Classique</Link>
          <span className="on" aria-current="page">🎬 Cinématique</span>
        </nav>
      )}

      {/* ---- Fond : photo plein écran (comme Noa) ou dégradés de la charte -- */}
      {hasGallery ? (
        <div aria-hidden className="absolute inset-0" style={{ overflow: "hidden" }}>
          <Image
            src={(photos[photoIndex] ?? photos[0]).src}
            alt=""
            fill
            priority
            unoptimized
            style={{
              objectFit: "cover",
              transform: (photos[photoIndex] ?? photos[0]).position
                ? undefined
                : cropTf((photos[photoIndex] ?? photos[0]).posX, (photos[photoIndex] ?? photos[0]).posY, (photos[photoIndex] ?? photos[0]).zoom),
              transformOrigin: "center",
              objectPosition: (photos[photoIndex] ?? photos[0]).position || undefined,
              filter: "brightness(.92) contrast(1.06)",
            }}
          />
          {/* Scrim : garantit la lisibilité du texte sur la photo */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(0deg, rgba(0,12,28,.95) 0%, rgba(0,12,28,.55) 32%, rgba(0,12,28,.05) 62%, transparent 100%), radial-gradient(ellipse 130% 90% at 50% 100%, rgba(0,0,0,.45) 0%, transparent 60%)",
            }}
          />
          {/* Voile de fondu noir entre deux photos */}
          <div
            className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-[380ms] ${fading ? "opacity-100" : "opacity-0"}`}
          />
        </div>
      ) : (
        <GradientBackdrop />
      )}

      {/* Clic n'importe où sur l'interface = photo suivante (pattern Noa) + support swipe */}
      {photos.length > 1 && (
        <button
          type="button"
          onClick={handleClickBackground}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-label="Photo suivante"
          className="absolute inset-0 z-[5] cursor-pointer border-0 bg-transparent"
        />
      )}

      {/* ---- Overlays 2D (Framer Motion) ------------------------------------ */}
      {/* pointer-events-none : les clics traversent le texte jusqu'à la galerie ;
          seule la rangée de boutons (pointer-events-auto) reste interactive */}
      <motion.section
        variants={containerVariants}
        initial={reducedMotion ? false : "hidden"}
        animate="show"
        className="pointer-events-none relative z-10 flex min-h-screen flex-col justify-end p-6 pb-10 sm:p-12"
      >
        <motion.h1
          variants={itemVariants}
          className="font-display text-5xl font-extrabold leading-none tracking-tight sm:text-7xl"
        >
          <span className="block font-light text-text-main/90">{data.first}</span>
          <span
            className="block bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(90deg, ${data.colorA}, ${data.colorB})`,
            }}
          >
            {data.last}
          </span>
        </motion.h1>

        <motion.div
          variants={itemVariants}
          className="font-body mt-4 flex flex-wrap gap-2 text-sm"
        >
          {data.sport && (
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md">
              {data.sport}
            </span>
          )}
          {data.location && (
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-text-muted backdrop-blur-md">
              📍 {data.location}
            </span>
          )}
        </motion.div>

        {data.tagline && (
          <motion.p
            variants={itemVariants}
            className="font-body mt-4 max-w-xl text-lg text-text-muted"
          >
            {data.tagline}
          </motion.p>
        )}

        <motion.div variants={itemVariants} className="pointer-events-auto mt-8 flex flex-wrap gap-3">
          {hasDetails && (
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="font-display rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-brand-bg shadow-[0_0_24px_rgba(139,182,255,0.35)] transition hover:opacity-90"
            >
              📊 Stats &amp; palmarès
            </button>
          )}

          <Link
            href={completHref ?? `/${cv.slug}`}
            className="font-body rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm backdrop-blur-md transition hover:border-accent/50"
          >
            📄 CV complet
          </Link>

          {hasVideos && (
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="font-body flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm backdrop-blur-md transition hover:border-accent/50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-accent" aria-hidden>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Vidéos</span>
            </button>
          )}

          {data.links.map((link) => {
            const labelLower = (link.label || '').toLowerCase();
            const urlLower = (link.url || '').toLowerCase();
            const isInsta = labelLower.includes('insta') || urlLower.includes('instagram');
            const isX = labelLower === 'x' || labelLower.includes('twitter') || urlLower.includes('twitter') || urlLower.includes('x.com');
            
            if (isInsta) {
              return (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="font-body flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 backdrop-blur-md transition hover:border-[#e1306c]/70 hover:bg-white/10 hover:scale-105 active:scale-95"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[#e1306c]" aria-hidden>
                    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zm0 3.68A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4zm6.4-11.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z" />
                  </svg>
                </a>
              );
            }

            return (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-text-muted backdrop-blur-md transition hover:border-accent-2/50 hover:text-text-main"
              >
                {isX && (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-white" aria-hidden>
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                )}
                <span>{link.label}</span>
              </a>
            );
          })}
        </motion.div>
      </motion.section>

      {/* ---- Navigation galerie : compteur + flèches gauche/droite ---------- */}
      {!panelOpen && photos.length > 1 && (
        <>
          <span className="absolute left-5 top-5 z-[15] rounded-full border border-white/15 bg-[#000c1c]/55 px-3.5 py-1.5 text-xs tracking-wider backdrop-blur-md">
            {photoIndex + 1}/{photos.length}
          </span>
          <button
            type="button"
            onClick={() => changePhoto(-1)}
            aria-label="Photo précédente"
            className="absolute left-4 top-1/2 z-[15] grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-[#000c1c]/60 text-text-main backdrop-blur-md transition hover:scale-105 hover:border-accent/60"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => changePhoto(1)}
            aria-label="Photo suivante"
            className="absolute right-4 top-1/2 z-[15] grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-[#000c1c]/60 text-text-main backdrop-blur-md transition hover:scale-105 hover:border-accent/60"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </>
      )}

      {/* ---- Panneau latéral : stats / parcours / palmarès ------------------- */}
      <AnimatePresence>
        {panelOpen && (
          <motion.aside
            initial={{ x: reducedMotion ? 0 : 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: reducedMotion ? 0 : 60, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-[500] w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#001b3d]/95 p-6 sm:p-8 backdrop-blur-2xl"
            role="dialog"
            aria-label="Statistiques et palmarès"
          >
            {/* Header sticky du panneau avec titre et bouton fermer toujours visible */}
            <div className="sticky top-0 z-[550] -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 flex items-center justify-between border-b border-white/10 bg-[#001b3d]/95 p-6 sm:px-8 py-4 backdrop-blur-xl mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <h3 className="font-display text-lg font-bold text-text-main">
                  Statistiques &amp; Palmarès
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label="Fermer le panneau"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/50 text-base font-bold text-white shadow-lg backdrop-blur-xl transition hover:bg-black/90 hover:scale-110 active:scale-95 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {data.stats.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-3">
                {data.stats.map((stat) => (
                  <div
                    key={`${stat.label}-${stat.value}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
                  >
                    <div className="font-display text-2xl font-bold text-accent">
                      {stat.value}
                      {stat.unit && (
                        <span className="ml-1 text-sm text-accent-2">{stat.unit}</span>
                      )}
                    </div>
                    <div className="font-body mt-1 text-xs text-text-muted">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {data.career.length > 0 && (
              <>
                <h4 className="font-display mt-8 text-sm font-semibold uppercase tracking-widest text-text-muted">
                  Parcours
                </h4>
                <div className="mt-3 space-y-2">
                  {data.career.map((step) => (
                    <div
                      key={`${step.year}-${step.club}`}
                      className="font-body flex items-baseline gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-2.5 text-sm"
                    >
                      <span className="shrink-0 font-semibold text-accent">{step.year}</span>
                      <span className="text-text-main">{step.club}</span>
                      <span className="ml-auto text-right text-text-muted">{step.detail}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {data.palmares.length > 0 && (
              <>
                <h4 className="font-display mt-8 text-sm font-semibold uppercase tracking-widest text-text-muted">
                  Palmarès
                </h4>
                <div className="mt-3 space-y-2">
                  {data.palmares.map((item) => (
                    <div
                      key={item.name}
                      className="font-body flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-2.5 text-sm"
                    >
                      <span>{item.icon}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-text-main">{item.name}</span>
                        {item.detail && <span className="text-xs text-text-muted">{item.detail}</span>}
                      </div>
                      <span className="ml-auto font-semibold text-gold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {cv.showSections?.videos !== false && cv.videos && cv.videos.length > 0 && (
              <>
                <h4 className="font-display mt-8 text-sm font-semibold uppercase tracking-widest text-text-muted mb-3">
                  Vidéos
                </h4>
                <div className="space-y-4">
                  {cv.videos.map((vid, i) => {
                    const videoUrl = vid.url || (vid.title?.startsWith('http') || vid.title?.includes('youtu') || vid.title?.includes('vimeo') ? vid.title : '');
                    const videoTitle = videoUrl === vid.title ? '' : vid.title;
                    return videoUrl ? <PlayerVideo key={i} src={videoUrl} title={videoTitle} /> : null;
                  })}
                </div>
              </>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
