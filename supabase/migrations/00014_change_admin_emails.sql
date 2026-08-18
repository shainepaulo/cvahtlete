-- ==========================================================================
-- ATHLETE CV — Migration 00014
-- Changement du super admin : mpika.toshiro@talaref.co remplace toshirompika@gmail.com
-- ==========================================================================

-- Redéfinition du trigger d'inscription pour utiliser le nouvel e-mail
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  super_admin_emails CONSTANT text[] := ARRAY[
    'mpika.toshiro@talaref.co',
    'shaine.paulo@gmail.com'
  ];
  is_the_super_admin boolean := (lower(new.email) = ANY (super_admin_emails));
  is_the_owner boolean := is_the_super_admin;
  declared_role text := coalesce(new.raw_user_meta_data->>'user_role', 'athlete');
BEGIN
  -- Toute valeur inattendue retombe sur 'athlete'
  IF declared_role NOT IN ('athlete', 'agent') THEN
    declared_role := 'athlete';
  END IF;

  -- Création du profil : le owner est en plan 'club', l'utilisateur normal commence en plan 'free'
  INSERT INTO public.profiles (id, email, full_name, is_owner, is_super_admin, plan, user_role)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    is_the_owner,
    is_the_super_admin,
    CASE WHEN is_the_owner THEN 'club' ELSE 'free' END,
    declared_role
  )
  ON CONFLICT (id) DO UPDATE
    SET email = excluded.email,
        full_name = excluded.full_name,
        is_owner = excluded.is_owner,
        is_super_admin = excluded.is_super_admin,
        plan = excluded.plan,
        user_role = excluded.user_role;

  -- Création de l'abonnement initial : le owner est actif en plan 'club',
  -- l'utilisateur normal commence en statut 'free' (sans essai / trial 3 jours automatique)
  INSERT INTO public.subscriptions (user_id, status, plan, trial_ends_at)
  VALUES (
    new.id,
    CASE WHEN is_the_owner THEN 'active' ELSE 'free' END,
    CASE WHEN is_the_owner THEN 'club'   ELSE 'free' END,
    NULL
  )
  ON CONFLICT (user_id) DO UPDATE
    SET status = excluded.status,
        plan = excluded.plan,
        trial_ends_at = NULL;

  RETURN new;
END;
$$;
