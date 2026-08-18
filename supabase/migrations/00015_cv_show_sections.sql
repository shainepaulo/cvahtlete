-- ==========================================================================
-- ATHLETE CV — Migration 00015
-- Ajout de show_sections à la table cvs pour masquer/afficher des rubriques
-- ==========================================================================

ALTER TABLE public.cvs 
ADD COLUMN IF NOT EXISTS show_sections jsonb NOT NULL DEFAULT '{"stats": true, "palmares": true, "career": true, "bio": true}'::jsonb;

COMMENT ON COLUMN public.cvs.show_sections IS 'Toggles de visibilité des rubriques : stats, palmares, career, bio.';
