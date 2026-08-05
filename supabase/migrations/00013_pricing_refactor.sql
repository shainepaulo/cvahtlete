-- ==========================================================================
-- ATHLETE CV — Migration 00013
-- 1) Mettre à jour les contraintes de plan pour intégrer 'season'
-- 2) Ajouter season_expires_at à subscriptions
-- 3) Créer la table leads_sur_mesure et ses politiques RLS
-- 4) Mettre à jour handle_new_user() pour attribuer le plan 'free' sans essai automatique
-- ==========================================================================

-- ── 1) Mise à jour des contraintes de plan ───────────────────────────────
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'starter', 'pro', 'club', 'season'));

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('free', 'starter', 'pro', 'club', 'season'));

-- ── 2) Colonne season_expires_at dans subscriptions ──────────────────────
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS season_expires_at timestamptz;
COMMENT ON COLUMN public.subscriptions.season_expires_at IS 'Date de fin de validité du pass saisonnier (le 30 juin de la saison en cours).';

-- ── 3) Table leads_sur_mesure ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads_sur_mesure (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  nom text NOT NULL,
  email text NOT NULL,
  telephone text NOT NULL,
  sport text NOT NULL,
  club text NOT NULL,
  ville text NOT NULL,
  niveau text NOT NULL,
  besoin text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'won', 'lost')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS & Grants sur leads_sur_mesure
ALTER TABLE public.leads_sur_mesure ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_sur_mesure_insert_all" ON public.leads_sur_mesure
  FOR INSERT WITH CHECK (true);

CREATE POLICY "leads_sur_mesure_owner_all" ON public.leads_sur_mesure
  FOR ALL USING (public.is_owner(auth.uid())) WITH CHECK (public.is_owner(auth.uid()));

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON public.leads_sur_mesure TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.leads_sur_mesure TO authenticated;

-- ── 4) Mise à jour du trigger d'inscription handle_new_user() ────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  super_admin_emails CONSTANT text[] := ARRAY[
    'toshirompika@gmail.com',
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
