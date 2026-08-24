-- ==========================================================================
-- ATHLETE CV — Migration 00019
-- Support multi-images dans le mode cinématique (cine_images).
-- ==========================================================================

ALTER TABLE public.cvs
  ADD COLUMN IF NOT EXISTS cine_images JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.cvs.cine_images IS 'Liste des images de fond du mode cinématique. Tableau d''objets {url: string, posX: number, posY: number, zoom: number}.';
