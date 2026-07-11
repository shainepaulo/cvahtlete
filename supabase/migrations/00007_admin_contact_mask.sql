-- ==========================================================================
-- ATHLETE CV — Migration 00007
-- Contrôle admin universel du floutage des coordonnées sensibles
-- (téléphone / e-mail) — Tâche 3.2 « Privacy Lock ».
-- Défaut à true (masquage forcé actif) : rien ne change tant que l'admin
-- ne désactive pas explicitement le masquage depuis /admin.
-- ==========================================================================

alter table public.profiles
  add column if not exists admin_force_contact_mask boolean not null default true;
