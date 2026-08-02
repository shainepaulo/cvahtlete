-- ============================================================================
-- ATHLETE CV — Migration 00012
-- Ajout des caractéristiques physiques / biographiques et de leur affichage.
-- À exécuter dans Supabase → SQL Editor.
-- ============================================================================

alter table public.cvs
  add column if not exists characteristics      jsonb   not null default '{}'::jsonb,
  add column if not exists show_characteristics boolean not null default false;
