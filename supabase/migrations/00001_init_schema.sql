-- ============================================================================
-- ATHLETE CV — Migration 00001 : Schéma initial
-- Cible : Supabase (PostgreSQL 15+)
-- Convention : snake_case en base, mapping camelCase côté TypeScript (Étape 2).
--   planName            -> plan_name
--   planExpires         -> plan_expires
--   modificationsLeft   -> modifications_left
--   cineBg_url          -> cine_bg_url
--   photoPosX/Y         -> photo_pos_x / photo_pos_y
--   cropZoomAvatar      -> crop_zoom_avatar
-- Sémantique quota : modifications_left = NULL  => illimité (plan Pro/Club)
--                    modifications_left = N >= 0 => N modifications restantes
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- 1. Table public.users — extension métier de auth.users
-- ----------------------------------------------------------------------------
create table public.users (
  id                     uuid primary key references auth.users (id) on delete cascade,
  email                  text,
  plan                   text not null default 'free'
                         check (plan in ('free', 'starter', 'pro', 'club')),
  plan_name              text,
  plan_expires           timestamptz,                -- NULL = paiement unique, pas d'expiration
  modifications_left     integer default 0
                         check (modifications_left is null or modifications_left >= 0),
  entitlements_cinematic boolean not null default false,
  entitlements_multi     boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

comment on table public.users is
  'Profil métier 1:1 avec auth.users. Plan/quota/entitlements modifiables uniquement par le service_role (webhook de paiement).';

-- ----------------------------------------------------------------------------
-- 2. Table public.cv_data
-- ----------------------------------------------------------------------------
create table public.cv_data (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users (id) on delete cascade,

  -- Identité publique
  slug             text not null unique
                   check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$'), -- 1..40, kebab-case
  visibility       text not null default 'private'
                   check (visibility in ('private', 'public')),

  -- Identité athlète
  first            text not null default '',
  last             text not null default '',
  sport            text not null default '',
  location         text not null default '',

  -- Médias
  avatar_url       text,
  cine_bg_url      text,

  -- Recadrage avatar (formule front :
  --   m = (z - 1) / 2 * 100
  --   transform: translate(m*(1-x/50)%, m*(1-y/50)%) scale(z) )
  photo_pos_x      numeric(5,2) not null default 50 check (photo_pos_x between 0 and 100),
  photo_pos_y      numeric(5,2) not null default 50 check (photo_pos_y between 0 and 100),
  crop_zoom_avatar numeric(4,2) not null default 1  check (crop_zoom_avatar between 1 and 4),

  -- Données complexes
  stats            jsonb not null default '[]'::jsonb,
  palmares         jsonb not null default '[]'::jsonb,
  career           jsonb not null default '[]'::jsonb,
  links            jsonb not null default '[]'::jsonb,
  colors           jsonb not null default '{}'::jsonb,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index cv_data_user_id_idx on public.cv_data (user_id);
create index cv_data_public_idx  on public.cv_data (slug) where visibility = 'public';

-- Slugs réservés (routes de l'app)
alter table public.cv_data add constraint cv_data_slug_reserved check (
  slug not in ('admin','api','app','auth','builder','login','signup','pricing',
               'dashboard','settings','www','cv','premium','checkout')
);

-- ----------------------------------------------------------------------------
-- 3. Triggers utilitaires
-- ----------------------------------------------------------------------------

-- 3a. updated_at automatique
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger cv_data_set_updated_at
  before update on public.cv_data
  for each row execute function public.set_updated_at();

-- 3b. Création automatique du profil métier à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3c. Limite multi-profils : 1 CV max sans entitlement 'multi' (offre Club)
create or replace function public.enforce_single_cv()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.users u
    where u.id = new.user_id and u.entitlements_multi
  )
  and (select count(*) from public.cv_data c where c.user_id = new.user_id) >= 1
  then
    raise exception 'MULTI_PROFILE_NOT_ALLOWED'
      using hint = 'L''offre Club est requise pour créer plusieurs profils.';
  end if;
  return new;
end;
$$;

create trigger cv_data_enforce_single_cv
  before insert on public.cv_data
  for each row execute function public.enforce_single_cv();

-- 3d. QUOTA : chaque UPDATE de cv_data initié par l'owner consomme 1 modification.
--     - service_role (webhooks, admin) : auth.uid() IS NULL -> bypass total
--     - modifications_left NULL        : illimité (Pro/Club) -> pas de décrément
--     - modifications_left = 0         : exception QUOTA_EXCEEDED, l'UPDATE échoue
--     Le décrément est atomique (même transaction que l'UPDATE) : pas de course
--     possible entre vérification et consommation.
create or replace function public.consume_modification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining integer;
  unlimited boolean;
begin
  -- Hors contexte utilisateur (service_role / SQL direct) : ne pas compter.
  if auth.uid() is null or auth.uid() <> new.user_id then
    return new;
  end if;

  select u.modifications_left is null, coalesce(u.modifications_left, 0)
    into unlimited, remaining
  from public.users u
  where u.id = new.user_id
  for update; -- verrouille la ligne : décrément concurrent impossible

  if unlimited then
    return new;
  end if;

  if remaining <= 0 then
    raise exception 'QUOTA_EXCEEDED'
      using hint = 'Aucune modification restante. Passez au plan Pro pour des modifications illimitées.';
  end if;

  update public.users
  set modifications_left = remaining - 1
  where id = new.user_id;

  return new;
end;
$$;

create trigger cv_data_consume_modification
  before update on public.cv_data
  for each row
  when (old.* is distinct from new.*) -- un save sans changement ne consomme rien
  execute function public.consume_modification();

-- ----------------------------------------------------------------------------
-- 4. Row Level Security
-- ----------------------------------------------------------------------------
alter table public.users   enable row level security;
alter table public.cv_data enable row level security;

-- ---- public.users ----
-- Lecture : uniquement sa propre ligne.
create policy "users_select_own"
  on public.users for select
  to authenticated
  using (id = (select auth.uid()));

-- Aucune policy INSERT/UPDATE/DELETE pour authenticated :
--   - INSERT se fait via le trigger on_auth_user_created (security definer)
--   - plan / quota / entitlements ne sont modifiables que par service_role
--     (qui bypass RLS), donc un utilisateur ne peut PAS se ré-créditer
--     ni s'auto-attribuer la cinématique.
-- Ceinture + bretelles : on retire aussi le privilège UPDATE au niveau GRANT.
revoke update, insert, delete on public.users from authenticated, anon;

-- ---- public.cv_data ----
-- Lecture : CV publics pour tout le monde (anon inclus), CV privés pour l'owner.
create policy "cv_select_public_or_own"
  on public.cv_data for select
  to anon, authenticated
  using (
    visibility = 'public'
    or user_id = (select auth.uid())
  );

-- Création : uniquement pour soi-même (le trigger 3c limite à 1 CV hors Club).
create policy "cv_insert_own"
  on public.cv_data for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- Modification : uniquement l'owner, sans pouvoir réassigner le CV à autrui.
-- Le trigger 3d consomme/contrôle le quota dans la même transaction.
create policy "cv_update_own"
  on public.cv_data for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Suppression : uniquement l'owner.
create policy "cv_delete_own"
  on public.cv_data for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- 5. Storage : buckets médias (avatars + fonds cinématiques)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true),
       ('cinematics', 'cinematics', true)
on conflict (id) do nothing;

-- Chaque user écrit uniquement dans son dossier {uid}/...
create policy "storage_write_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('avatars', 'cinematics')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "storage_update_own_folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('avatars', 'cinematics')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "storage_delete_own_folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('avatars', 'cinematics')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "storage_read_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('avatars', 'cinematics'));

-- ----------------------------------------------------------------------------
-- 6. Helper paiement (appelé par le webhook via service_role uniquement)
--    Starter 79€  -> 3 modifications, pas de cinématique
--    Pro     149€ -> illimité + cinématique
--    Club         -> illimité + cinématique + multi-profils
-- ----------------------------------------------------------------------------
create or replace function public.apply_plan(p_user_id uuid, p_plan text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) is not null then
    raise exception 'FORBIDDEN' using hint = 'apply_plan est réservé au service_role.';
  end if;

  update public.users
  set plan                   = p_plan,
      plan_name              = case p_plan
                                 when 'starter' then 'Starter'
                                 when 'pro'     then 'Pro'
                                 when 'club'    then 'Club'
                                 else plan_name
                               end,
      modifications_left     = case p_plan
                                 when 'starter' then 3
                                 else null            -- pro / club : illimité
                               end,
      entitlements_cinematic = p_plan in ('pro', 'club'),
      entitlements_multi     = p_plan = 'club'
  where id = p_user_id;

  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;
end;
$$;

revoke execute on function public.apply_plan(uuid, text) from public, anon, authenticated;
