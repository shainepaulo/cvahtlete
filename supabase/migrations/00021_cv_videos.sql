-- Migration 00021: Ajout de la colonne videos (JSONB) pour stocker les vidéos du joueur
ALTER TABLE public.cvs 
  ADD COLUMN IF NOT EXISTS videos JSONB NOT NULL DEFAULT '[]'::jsonb;
