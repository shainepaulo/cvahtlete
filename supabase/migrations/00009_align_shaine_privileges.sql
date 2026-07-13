-- ==========================================================================
-- ATHLETE CV — Migration 00009
-- Alignement des privilèges : shaine.paulo@gmail.com reçoit exactement les
-- mêmes droits que toshirompika@gmail.com (super admin + owner + plan club).
-- NB : ce fichier ne modifie rien tant qu'il n'est pas appliqué au projet
-- Supabase (dashboard SQL editor ou `supabase db push`).
-- ==========================================================================

-- Le trigger d'inscription reconnaît désormais DEUX super admins : les
-- privilèges sont ainsi réappliqués même si le compte est recréé.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  super_admin_emails constant text[] := array[
    'toshirompika@gmail.com',
    'shaine.paulo@gmail.com'
  ];
  is_the_super_admin boolean := (lower(new.email) = any (super_admin_emails));
  is_the_owner boolean := is_the_super_admin;
begin
  insert into public.profiles (id, email, full_name, is_owner, is_super_admin, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    is_the_owner,
    is_the_super_admin,
    case when is_the_owner then 'club' else 'free' end
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        is_owner = excluded.is_owner,
        is_super_admin = excluded.is_super_admin,
        plan = excluded.plan;

  insert into public.subscriptions (user_id, status, plan)
  values (
    new.id,
    case when is_the_owner then 'active' else 'free' end,
    case when is_the_owner then 'club'   else 'free' end
  )
  on conflict (user_id) do update
    set status = excluded.status,
        plan = excluded.plan;

  return new;
end;
$$;

-- Alignement immédiat du profil existant (si le compte est déjà inscrit).
update public.profiles
set is_super_admin = true,
    is_owner = true,
    plan = 'club',
    account_status = 'active'
where lower(email) = 'shaine.paulo@gmail.com';

update public.subscriptions
set status = 'active',
    plan = 'club'
where user_id in (
  select id from public.profiles where lower(email) = 'shaine.paulo@gmail.com'
);
