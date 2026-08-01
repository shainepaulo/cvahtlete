-- ==========================================================================
-- ATHLETE CV — Migration 00011
-- Mise à jour du trigger d'inscription pour l'essai gratuit de 3 jours sans carte.
-- ==========================================================================

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
  declared_role text := coalesce(new.raw_user_meta_data->>'user_role', 'athlete');
begin
  -- Toute valeur inattendue retombe sur 'athlete'
  if declared_role not in ('athlete', 'agent') then
    declared_role := 'athlete';
  end if;

  -- Création du profil : le owner est en plan 'club', l'utilisateur normal commence en plan 'pro' (essai)
  insert into public.profiles (id, email, full_name, is_owner, is_super_admin, plan, user_role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    is_the_owner,
    is_the_super_admin,
    case when is_the_owner then 'club' else 'pro' end,
    declared_role
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        is_owner = excluded.is_owner,
        is_super_admin = excluded.is_super_admin,
        plan = excluded.plan,
        user_role = excluded.user_role;

  -- Création de l'abonnement initial : le owner est actif en plan 'club',
  -- l'utilisateur normal commence en statut 'trialing' plan 'pro' pour 3 jours (sans carte)
  insert into public.subscriptions (user_id, status, plan, trial_ends_at)
  values (
    new.id,
    case when is_the_owner then 'active' else 'trialing' end,
    case when is_the_owner then 'club'   else 'pro' end,
    case when is_the_owner then null     else now() + interval '3 days' end
  )
  on conflict (user_id) do update
    set status = excluded.status,
        plan = excluded.plan,
        trial_ends_at = excluded.trial_ends_at;

  return new;
end;
$$;
