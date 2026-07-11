-- ==========================================================================
-- ATHLETE CV — Migration 00008
-- Nouvelles routes réservées : /bibliotheque (Tâche 4) et /cv (CV de Noa,
-- Tâche 3). Un CV utilisateur ne doit jamais pouvoir prendre ce slug.
-- ==========================================================================

alter table public.cvs drop constraint if exists cvs_slug_reserved;
alter table public.cvs add constraint cvs_slug_reserved
  check (slug not in (
    'admin','api','app','auth','builder','login','signup','dashboard',
    'cine','profil','exemples','sports','tarifs','cgv','checkout','concept',
    'mentions-legales','mot-de-passe-oublie','bibliotheque','cv'
  ));
