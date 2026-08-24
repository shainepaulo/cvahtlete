-- ============================================================================
-- ATHLETE CV — Migration Consolidée (00007 à 00019)
-- À exécuter en 1 seul clic dans le SQL Editor de Supabase
-- ============================================================================

-- ── 00007 : Privacy Lock ───────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_force_contact_mask BOOLEAN NOT NULL DEFAULT TRUE;

-- ── 00008 : Reserved Slugs ────────────────────────────────────────────────
ALTER TABLE public.cvs DROP CONSTRAINT IF EXISTS cvs_slug_reserved;
ALTER TABLE public.cvs ADD CONSTRAINT cvs_slug_reserved
  CHECK (slug NOT IN (
    'admin','api','app','auth','builder','login','signup','dashboard',
    'cine','profil','exemples','sports','tarifs','cgv','checkout','concept',
    'mentions-legales','mot-de-passe-oublie','bibliotheque','cv'
  ));

-- ── 00010 : User Role & Stripe Trial ──────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_role TEXT NOT NULL DEFAULT 'athlete'
  CHECK (user_role IN ('athlete', 'agent'));

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- ── 00012 : Characteristics ───────────────────────────────────────────────
ALTER TABLE public.cvs
  ADD COLUMN IF NOT EXISTS characteristics JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS show_characteristics BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 00013 : Pricing Refactor & Season Expires & Leads ────────────────────
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'starter', 'pro', 'club', 'season'));

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('free', 'starter', 'pro', 'club', 'season'));

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS season_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.leads_sur_mesure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  nom TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT NOT NULL,
  sport TEXT NOT NULL,
  club TEXT NOT NULL,
  ville TEXT NOT NULL,
  niveau TEXT NOT NULL,
  besoin TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'won', 'lost')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.leads_sur_mesure ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leads_sur_mesure_insert_all" ON public.leads_sur_mesure;
CREATE POLICY "leads_sur_mesure_insert_all" ON public.leads_sur_mesure FOR INSERT WITH CHECK (true);

-- ── 00015 : Show Sections ─────────────────────────────────────────────────
ALTER TABLE public.cvs 
  ADD COLUMN IF NOT EXISTS show_sections JSONB NOT NULL DEFAULT '{"stats": true, "palmares": true, "career": true, "bio": true}'::jsonb;

-- ── 00016 : Contact Info ──────────────────────────────────────────────────
ALTER TABLE public.cvs
  ADD COLUMN IF NOT EXISTS birth_date     TEXT,
  ADD COLUMN IF NOT EXISTS nationality    TEXT,
  ADD COLUMN IF NOT EXISTS eligibility    TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone  TEXT,
  ADD COLUMN IF NOT EXISTS contact_email  TEXT;

-- ── 00017 : Cinematic Enabled Flag ────────────────────────────────────────
ALTER TABLE public.cvs
  ADD COLUMN IF NOT EXISTS cinematic_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 00018 : Multi-CV & Label ──────────────────────────────────────────────
DROP INDEX IF EXISTS public.cvs_user_id_unique;
ALTER TABLE public.cvs
  ADD COLUMN IF NOT EXISTS label TEXT;

-- ── 00019 : Cine Images ───────────────────────────────────────────────────
ALTER TABLE public.cvs
  ADD COLUMN IF NOT EXISTS cine_images JSONB NOT NULL DEFAULT '[]'::jsonb;

-- ── 00021 : Videos ────────────────────────────────────────────────────────
ALTER TABLE public.cvs
  ADD COLUMN IF NOT EXISTS videos JSONB NOT NULL DEFAULT '[]'::jsonb;

-- ── Rechargement du cache PostgREST ────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
