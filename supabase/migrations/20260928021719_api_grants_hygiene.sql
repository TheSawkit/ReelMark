-- Droits des rôles d'API resserrés au strict nécessaire (septembre 2026).
-- La RLS protégeait déjà les lignes ; ceci retire ce qu'aucune requête de l'app n'utilise, et fait
-- disparaître ces tables du schéma GraphQL exposé aux visiteurs (advisor 0026).

-- anon n'a rien à faire sur ces tables privées : il y avait TOUS les droits (défaut Supabase).
revoke all on table
	public.recommendation_dismissals,
	public.user_prompts,
	public.user_streaming_providers
from anon;

-- Reste d'une révocation partielle : MAINTAIN (VACUUM, ANALYZE…) seul, pour anon.
revoke all on table public.watchlist, public.privacy_settings from anon;

-- authenticated : lecture et écriture filtrées par la RLS, comme sur les autres tables. TRUNCATE
-- (qui ignore la RLS), REFERENCES, TRIGGER et MAINTAIN ne servent à aucun écran.
revoke truncate, references, trigger, maintain on table
	public.mcp_keys,
	public.recommendation_dismissals,
	public.user_prompts,
	public.user_streaming_providers
from authenticated;

-- CHECK créé deux fois sous deux noms ; friendships_no_self_friendship reste.
alter table public.friendships drop constraint if exists friendships_check;

-- Les tables, séquences et fonctions créées désormais dans public ne sont plus ouvertes à anon
-- par défaut : une lecture publique se décide par un GRANT explicite dans sa migration. Les
-- utilisateurs connectés gardent lecture et écriture, toujours sous RLS.
alter default privileges for role postgres in schema public
	revoke all on tables from anon;
alter default privileges for role postgres in schema public
	revoke truncate, references, trigger, maintain on tables from authenticated;
alter default privileges for role postgres in schema public
	revoke all on sequences from anon;
alter default privileges for role postgres in schema public
	revoke execute on functions from anon;
