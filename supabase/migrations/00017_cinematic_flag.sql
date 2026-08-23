-- ==========================================================================
-- ATHLETE CV — Migration 00017
-- Ajout du drapeau cinematic_enabled sur la table cvs (s'il n'existe pas).
-- Ce champ peut déjà exister (créé dynamiquement par upsertCv), mais on
-- s'assure qu'il a bien une valeur par défaut propre.
-- ==========================================================================

ALTER TABLE public.cvs
  ADD COLUMN IF NOT EXISTS cinematic_enabled BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.cvs.cinematic_enabled IS 'Accès au mode cinématique — géré via le plan ou forcé manuellement par l''admin.';
