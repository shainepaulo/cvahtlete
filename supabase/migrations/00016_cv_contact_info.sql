-- ==========================================================================
-- ATHLETE CV — Migration 00016
-- Ajout des coordonnées personnelles du joueur dans la table cvs.
-- Les champs contact_phone et contact_email sont sensibles : ils ne sont
-- jamais exposés en clair aux visiteurs (BlurValue + demande d'accès).
-- ==========================================================================

ALTER TABLE public.cvs
  ADD COLUMN IF NOT EXISTS birth_date     TEXT,
  ADD COLUMN IF NOT EXISTS nationality    TEXT,
  ADD COLUMN IF NOT EXISTS eligibility    TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone  TEXT,
  ADD COLUMN IF NOT EXISTS contact_email  TEXT;

COMMENT ON COLUMN public.cvs.birth_date    IS 'Date de naissance (ex: 20/08/2007) — visible en clair.';
COMMENT ON COLUMN public.cvs.nationality   IS 'Nationalité (ex: Française) — visible en clair.';
COMMENT ON COLUMN public.cvs.eligibility   IS 'Éligibilité internationale (ex: Nouvelle-Calédonie) — visible en clair.';
COMMENT ON COLUMN public.cvs.contact_phone IS 'Téléphone — SENSIBLE, jamais révélé sans demande d''accès.';
COMMENT ON COLUMN public.cvs.contact_email IS 'Email — SENSIBLE, jamais révélé sans demande d''accès.';
