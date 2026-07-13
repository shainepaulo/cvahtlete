-- ==========================================================================
-- ATHLETE CV — Migration 00010
-- 1) Rôle utilisateur capturé à l'inscription : athlète ou agent/club/sponsor.
-- 2) Colonnes Stripe pour l'essai Pro 3 jours (PAIEMENT UNIQUE différé,
--    autorisation carte à J0, capture à J+3 — AUCUN abonnement récurrent).
-- ==========================================================================

-- ── 1) Rôle utilisateur ───────────────────────────────────────────────────
alter table public.profiles
  add column if not exists user_role text not null default 'athlete'
  check (user_role in ('athlete', 'agent'));

comment on column public.profiles.user_role is
  'Profil déclaré à l''inscription : athlete = sportif, agent = agent/club/sponsor.';

-- Le trigger d'inscription lit le rôle transmis dans raw_user_meta_data.
-- (Reprend la version 00009 : deux super admins + subscriptions.)
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
  -- Filet : toute valeur inattendue retombe sur 'athlete'.
  if declared_role not in ('athlete', 'agent') then
    declared_role := 'athlete';
  end if;

  insert into public.profiles (id, email, full_name, is_owner, is_super_admin, plan, user_role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    is_the_owner,
    is_the_super_admin,
    case when is_the_owner then 'club' else 'free' end,
    declared_role
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        is_owner = excluded.is_owner,
        is_super_admin = excluded.is_super_admin,
        plan = excluded.plan,
        user_role = excluded.user_role;

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

-- ── 2) Essai Pro 3 jours (paiement unique différé) ────────────────────────
alter table public.subscriptions
  add column if not exists stripe_payment_intent_id text,
  add column if not exists trial_ends_at timestamptz;

comment on column public.subscriptions.stripe_payment_intent_id is
  'PaymentIntent Stripe en capture manuelle : autorisé à J0, capturé à J+3 si non annulé. Paiement UNIQUE, jamais récurrent.';
comment on column public.subscriptions.trial_ends_at is
  'Fin de l''essai Pro : date de capture du paiement unique différé.';

create index if not exists subscriptions_trial_due_idx
  on public.subscriptions (trial_ends_at)
  where status = 'trialing';
