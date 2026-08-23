-- ==========================================================================
-- ATHLETE CV — Migration 00018
-- Multi-CV par compte : suppression de la contrainte 1:1 user↔CV.
-- Ajout d'un champ `label` (identifiant interne, ex: "Wallem Diop")
-- et d'un champ `slug` modifiable manuellement.
-- ==========================================================================

-- 1. Supprime la contrainte unique cvs_user_id → plusieurs CV par user autorisés
DROP INDEX IF EXISTS public.cvs_user_id_unique;

-- 2. Label interne optionnel (visible uniquement dans le dashboard/admin)
ALTER TABLE public.cvs
  ADD COLUMN IF NOT EXISTS label TEXT;

-- 3. Index non-unique sur user_id pour les perf (remplace le précédent)
-- (cvs_user_id_idx existe déjà en non-unique depuis 00001, rien à faire)

COMMENT ON COLUMN public.cvs.label IS 'Nom interne affiché dans le dashboard multi-CV (ex: "Wallem Diop"). Auto-rempli depuis first+last si vide.';
