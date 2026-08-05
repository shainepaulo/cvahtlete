-- ==========================================================================
-- ATHLETE CV — Création manuelle du compte administrateur Marco
--
-- Exécutez ce script dans l'éditeur SQL de votre Dashboard Supabase.
-- Il insère l'utilisateur en hashant le mot de passe "Tango2018" via bcrypt,
-- et lui attribue les rôles Owner et Super Admin (plan Club).
-- ==========================================================================

do $$
declare
  new_user_id uuid := gen_random_uuid();
  admin_email constant text := 'marco@athletecv.com'; -- Vous pouvez modifier l'e-mail ici si nécessaire
begin
  -- 1. Création de l'utilisateur d'authentification Supabase Auth (mot de passe : Tango2018)
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, last_sign_in_at, confirmation_token, 
    email_change, email_change_token_new, recovery_token
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    admin_email,
    crypt('Tango2018', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Marco"}',
    now(),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- 2. Attribution des privilèges Super Admin & Owner (plan club)
  update public.profiles
  set is_owner = true,
      is_super_admin = true,
      plan = 'club'
  where id = new_user_id;

  -- 3. Activation de la souscription illimitée
  update public.subscriptions
  set status = 'active',
      plan = 'club',
      trial_ends_at = null
  where user_id = new_user_id;
  
  raise notice 'Utilisateur Admin créé avec succès avec ID %', new_user_id;
end $$;
