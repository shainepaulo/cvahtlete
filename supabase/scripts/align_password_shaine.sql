-- ==========================================================================
-- ATHLETE CV — Script MANUEL (hors migrations : ne s'exécute jamais tout seul)
-- Donne à shaine.paulo@gmail.com exactement le même mot de passe que
-- toshirompika@gmail.com en copiant le hash bcrypt dans auth.users.
--
-- À exécuter UNIQUEMENT à la main, dans le SQL Editor du dashboard Supabase,
-- quand tu décides d'appliquer l'alignement. Prérequis : les deux comptes
-- existent déjà (inscription via /signup).
-- Alternative sans SQL : dashboard → Authentication → Users →
-- shaine.paulo@gmail.com → « Reset password » et saisir le même mot de passe.
-- ==========================================================================

update auth.users
set encrypted_password = src.encrypted_password
from (
  select encrypted_password
  from auth.users
  where lower(email) = 'toshirompika@gmail.com'
) as src
where lower(auth.users.email) = 'shaine.paulo@gmail.com';
