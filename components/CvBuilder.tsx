"use client";

import {
  useMemo,
  useRef,
  useState,
  useTransition,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { updateAthleteCv, type CvData } from "@/app/actions/cv";

// ===========================================================================
// COUCHE 1/3 — FILETS DE SÉCURITÉ CLIENT (miroir exact des règles serveur)
// Rappel d'architecture : le client valide pour l'UX, la Server Action
// (app/actions/cv.ts) fait autorité, Postgres (CHECK + RLS + triggers) est
// la loi. Rien de ce qui sort de ce composant n'est considéré comme sûr.
// ===========================================================================

const TEXT_MAX = 80;

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** Supprime les caractères de contrôle ASCII (codes < 32 et 127). */
function stripControlChars(raw: string): string {
  let out = "";
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    if (code >= 32 && code !== 127) out += raw[i];
  }
  return out;
}

/** Nettoyage final d'un champ texte juste avant l'envoi. */
function sanitizeText(raw: string): string {
  return stripControlChars(raw).slice(0, TEXT_MAX).trim();
}

/** Nombre fini borné, sinon valeur de secours — jamais de NaN dans l'état. */
function safeNumber(raw: unknown, min: number, max: number, fallback: number): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? clamp(n, min, max) : fallback;
}

/** Arrondi à 2 décimales : aligné sur numeric(5,2)/numeric(4,2) en base. */
const round2 = (n: number) => Math.round(n * 100) / 100;

interface IdentityDraft {
  first: string;
  last: string;
  sport: string;
  location: string;
}

interface CropDraft {
  x: number;    // photo_pos_x      0..100
  y: number;    // photo_pos_y      0..100
  zoom: number; // crop_zoom_avatar 1..4
}

/** Validation stricte du brouillon. Liste vide = OK. */
function validateDraft(identity: IdentityDraft, crop: CropDraft): string[] {
  const issues: string[] = [];
  const labels: Record<keyof IdentityDraft, string> = {
    first: "Prénom",
    last: "Nom",
    sport: "Sport",
    location: "Localisation",
  };
  (Object.keys(labels) as (keyof IdentityDraft)[]).forEach((field) => {
    const value = identity[field];
    if (typeof value !== "string") issues.push(`${labels[field]} : valeur invalide.`);
    else if (value.length > TEXT_MAX) issues.push(`${labels[field]} : ${TEXT_MAX} caractères max.`);
  });
  if (!Number.isFinite(crop.x) || crop.x < 0 || crop.x > 100) issues.push("Position X hors limites (0-100).");
  if (!Number.isFinite(crop.y) || crop.y < 0 || crop.y > 100) issues.push("Position Y hors limites (0-100).");
  if (!Number.isFinite(crop.zoom) || crop.zoom < 1 || crop.zoom > 4) issues.push("Zoom hors limites (1-4).");
  return issues;
}

// ===========================================================================
// FORMULE DE RECADRAGE 2D (exacte, cf. cahier des charges)
// m = ((zoom - 1) / 2) * 100
// transform: translate(m*(1 - x/50)%, m*(1 - y/50)%) scale(zoom)
// x=50, y=50, zoom=1 => transform neutre (image centrée, non zoomée).
// ===========================================================================

function cropTransform({ x, y, zoom }: CropDraft): string {
  const m = ((zoom - 1) / 2) * 100;
  return `translate(${m * (1 - x / 50)}%, ${m * (1 - y / 50)}%) scale(${zoom})`;
}

// ===========================================================================
// COMPOSANT PRINCIPAL
// ===========================================================================

type SaveState =
  | { status: "idle" }
  | { status: "saved"; message: string }
  | { status: "error"; message: string };

export default function CvBuilder({
  cv,
  modificationsLeft, // null = illimité (Pro / Club)
}: {
  cv: CvData;
  modificationsLeft: number | null;
}) {
  // --- État : baseline (dernière version sauvée) vs brouillon ---------------
  const [baseline, setBaseline] = useState(() => ({
    first: cv.first,
    last: cv.last,
    sport: cv.sport,
    location: cv.location,
    photo_pos_x: safeNumber(cv.photo_pos_x, 0, 100, 50),
    photo_pos_y: safeNumber(cv.photo_pos_y, 0, 100, 50),
    crop_zoom_avatar: safeNumber(cv.crop_zoom_avatar, 1, 4, 1),
  }));

  const [identity, setIdentity] = useState<IdentityDraft>({
    first: baseline.first,
    last: baseline.last,
    sport: baseline.sport,
    location: baseline.location,
  });

  const [crop, setCrop] = useState<CropDraft>({
    x: baseline.photo_pos_x,
    y: baseline.photo_pos_y,
    zoom: baseline.crop_zoom_avatar,
  });

  const [save, setSave] = useState<SaveState>({ status: "idle" });
  const [remaining, setRemaining] = useState<number | null>(modificationsLeft);
  const [isPending, startTransition] = useTransition();

  // --- Diff : payload minimal, uniquement les champs réellement modifiés ----
  const changedFields = useMemo(() => {
    const diff: Record<string, string | number> = {};
    if (identity.first !== baseline.first) diff.first = identity.first;
    if (identity.last !== baseline.last) diff.last = identity.last;
    if (identity.sport !== baseline.sport) diff.sport = identity.sport;
    if (identity.location !== baseline.location) diff.location = identity.location;
    if (round2(crop.x) !== baseline.photo_pos_x) diff.photo_pos_x = round2(crop.x);
    if (round2(crop.y) !== baseline.photo_pos_y) diff.photo_pos_y = round2(crop.y);
    if (round2(crop.zoom) !== baseline.crop_zoom_avatar) diff.crop_zoom_avatar = round2(crop.zoom);
    return diff;
  }, [identity, crop, baseline]);

  const isDirty = Object.keys(changedFields).length > 0;
  const quotaExhausted = remaining !== null && remaining <= 0;

  // --- Drag-to-pan sur la prévisualisation -----------------------------------
  const previewRef = useRef<HTMLDivElement>(null);
  const dragOrigin = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragOrigin.current = { px: e.clientX, py: e.clientY, x: crop.x, y: crop.y };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const origin = dragOrigin.current;
    const box = previewRef.current;
    if (!origin || !box) return;
    const rect = box.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dx = ((e.clientX - origin.px) / rect.width) * 100;
    const dy = ((e.clientY - origin.py) / rect.height) * 100;
    setCrop((c) => ({
      ...c,
      x: clamp(origin.x - dx, 0, 100),
      y: clamp(origin.y - dy, 0, 100),
    }));
  };

  const onPointerEnd = () => {
    dragOrigin.current = null;
  };

  // --- Sauvegarde : UN SEUL appel, jamais d'autosave (1 save = 1 modification
  //     consommée côté Starter via le trigger SQL consume_modification) -------
  const handleSave = () => {
    const issues = validateDraft(identity, crop);
    if (issues.length > 0) {
      setSave({ status: "error", message: issues[0] });
      return;
    }
    if (!isDirty) {
      setSave({ status: "error", message: "Aucune modification à enregistrer." });
      return;
    }
    if (quotaExhausted) {
      setSave({
        status: "error",
        message: "Quota atteint. Passez au plan Pro pour des modifications illimitées.",
      });
      return;
    }

    // Payload minimal, re-nettoyé une dernière fois juste avant l'envoi.
    const payload: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(changedFields)) {
      payload[key] = typeof value === "string" ? sanitizeText(value) : value;
    }

    startTransition(async () => {
      try {
        const res = await updateAthleteCv(cv.slug, payload);

        if (!res.success) {
          // Erreurs déjà traduites côté serveur (QUOTA_EXCEEDED, 404, etc.)
          setSave({ status: "error", message: res.error });
          return;
        }

        // Re-synchronise la baseline sur la vérité renvoyée par la DB.
        setBaseline({
          first: res.data.first,
          last: res.data.last,
          sport: res.data.sport,
          location: res.data.location,
          photo_pos_x: safeNumber(res.data.photo_pos_x, 0, 100, 50),
          photo_pos_y: safeNumber(res.data.photo_pos_y, 0, 100, 50),
          crop_zoom_avatar: safeNumber(res.data.crop_zoom_avatar, 1, 4, 1),
        });
        setRemaining((r) => (r === null ? null : Math.max(0, r - 1)));
        setSave({ status: "saved", message: res.message ?? "Profil mis à jour." });
      } catch {
        // Crash réseau / Server Action : l'UI ne tombe jamais, et on n'affiche
        // JAMAIS une erreur brute (aucune fuite d'information interne).
        setSave({
          status: "error",
          message: "Connexion interrompue. Vos données n'ont pas été modifiées.",
        });
      }
    });
  };

  const initials =
    `${identity.first.charAt(0)}${identity.last.charAt(0)}`.toUpperCase() || "CV";

  // =========================================================================
  // RENDU — Tomorrow Night Blue / glassmorphism
  // =========================================================================
  return (
    <section className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-[#001b3d]/70 p-8 shadow-[0_0_60px_rgba(139,182,255,0.08)] backdrop-blur-xl">
      {/* ---- En-tête + quota ------------------------------------------------ */}
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-white">
            Éditer mon profil
          </h2>
          <p className="font-body mt-1 text-sm text-slate-400">
            cvathlete.com/<span className="text-[#8bb6ff]">{cv.slug}</span>
          </p>
        </div>
        <div
          className={`rounded-full border px-4 py-1.5 font-body text-sm ${
            remaining === null
              ? "border-[#79e0cf]/30 bg-[#79e0cf]/10 text-[#79e0cf]"
              : remaining <= 1
                ? "border-[#ffd98a]/40 bg-[#ffd98a]/10 text-[#ffd98a]"
                : "border-[#8bb6ff]/30 bg-[#8bb6ff]/10 text-[#8bb6ff]"
          }`}
        >
          {remaining === null
            ? "Modifications illimitées"
            : `${remaining} modification${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}`}
        </div>
      </header>

      <div className="grid gap-10 md:grid-cols-[260px_1fr]">
        {/* ---- Avatar : prévisualisation + recadrage temps réel ------------- */}
        <div>
          <h3 className="font-display mb-4 text-sm font-semibold uppercase tracking-widest text-slate-300">
            Avatar &amp; recadrage
          </h3>

          <div
            ref={previewRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            className="relative mx-auto h-52 w-52 cursor-grab touch-none select-none overflow-hidden rounded-full border border-white/15 bg-white/5 shadow-[inset_0_0_30px_rgba(0,0,0,0.4)] active:cursor-grabbing"
            role="img"
            aria-label="Prévisualisation du recadrage de l'avatar (glisser pour repositionner)"
          >
            {cv.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element -- transform
                 de crop incompatible avec l'optimiseur next/image */
              <img
                src={cv.avatar_url}
                alt=""
                draggable={false}
                className="h-full w-full object-cover"
                style={{
                  transform: cropTransform(crop),
                  transformOrigin: "center",
                  willChange: "transform",
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-5xl font-extrabold text-[#8bb6ff]/60">
                {initials}
              </div>
            )}
          </div>

          <div className="mt-6 space-y-4">
            <RangeControl
              id="crop-x"
              label="Position X"
              value={crop.x}
              min={0}
              max={100}
              step={1}
              display={`${Math.round(crop.x)}`}
              onChange={(v) => setCrop((c) => ({ ...c, x: safeNumber(v, 0, 100, 50) }))}
            />
            <RangeControl
              id="crop-y"
              label="Position Y"
              value={crop.y}
              min={0}
              max={100}
              step={1}
              display={`${Math.round(crop.y)}`}
              onChange={(v) => setCrop((c) => ({ ...c, y: safeNumber(v, 0, 100, 50) }))}
            />
            <RangeControl
              id="crop-zoom"
              label="Zoom"
              value={crop.zoom}
              min={1}
              max={4}
              step={0.01}
              display={`${crop.zoom.toFixed(2)}×`}
              onChange={(v) => setCrop((c) => ({ ...c, zoom: safeNumber(v, 1, 4, 1) }))}
            />
            <button
              type="button"
              onClick={() => setCrop({ x: 50, y: 50, zoom: 1 })}
              className="font-body w-full rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-400 transition hover:border-[#8bb6ff]/40 hover:text-[#8bb6ff]"
            >
              Réinitialiser le cadrage
            </button>
          </div>
        </div>

        {/* ---- Identité ------------------------------------------------------ */}
        <div>
          <h3 className="font-display mb-4 text-sm font-semibold uppercase tracking-widest text-slate-300">
            Identité
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="first"
              label="Prénom"
              value={identity.first}
              onChange={(v) => setIdentity((d) => ({ ...d, first: v }))}
            />
            <TextField
              id="last"
              label="Nom"
              value={identity.last}
              onChange={(v) => setIdentity((d) => ({ ...d, last: v }))}
            />
            <TextField
              id="sport"
              label="Sport"
              value={identity.sport}
              onChange={(v) => setIdentity((d) => ({ ...d, sport: v }))}
            />
            <TextField
              id="location"
              label="Localisation"
              value={identity.location}
              onChange={(v) => setIdentity((d) => ({ ...d, location: v }))}
            />
          </div>

          {/* ---- Barre d'action ---------------------------------------------- */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !isDirty || quotaExhausted}
              className="font-display rounded-xl bg-[#8bb6ff] px-6 py-3 text-sm font-bold text-[#002451] shadow-[0_0_24px_rgba(139,182,255,0.35)] transition hover:bg-[#a5c6ff] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              {isPending ? "Enregistrement…" : "Enregistrer"}
            </button>

            {/* Zone de statut : aria-live pour l'accessibilité, jamais de crash */}
            <p
              aria-live="polite"
              className={`font-body min-h-5 text-sm ${
                save.status === "saved"
                  ? "text-[#79e0cf]"
                  : save.status === "error"
                    ? "text-[#ffb3c1]"
                    : "text-transparent"
              }`}
            >
              {save.status === "saved" && `✓ ${save.message}`}
              {save.status === "error" && `⚠ ${save.message}`}
            </p>
          </div>

          {quotaExhausted && (
            <p className="font-body mt-4 rounded-xl border border-[#ffd98a]/30 bg-[#ffd98a]/10 px-4 py-3 text-sm text-[#ffd98a]">
              Vos modifications Starter sont épuisées. Le plan Pro (149&nbsp;€,
              paiement unique) débloque les modifications illimitées et le mode
              cinématique.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// ===========================================================================
// SOUS-COMPOSANTS (même fichier : pas de multiplication de fichiers)
// ===========================================================================

function TextField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="font-body mb-1.5 block text-sm text-slate-400">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        maxLength={TEXT_MAX}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => onChange(stripControlChars(e.target.value))}
        className="font-body w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition placeholder:text-slate-600 focus:border-[#8bb6ff]/60 focus:ring-2 focus:ring-[#8bb6ff]/20"
      />
    </div>
  );
}

function RangeControl({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={id} className="font-body text-sm text-slate-400">
          {label}
        </label>
        <span className="font-body text-xs tabular-nums text-[#8bb6ff]">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#8bb6ff]"
      />
    </div>
  );
}
