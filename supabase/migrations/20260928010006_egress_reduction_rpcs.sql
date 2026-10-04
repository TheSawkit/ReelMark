-- Réduction de l'egress et du nombre de requêtes (septembre 2026).
-- Quatre fonctions additives : aucune table, aucune fonction existante n'est modifiée.

-- Compteurs de la bibliothèque agrégés en base : au plus 6 lignes au lieu de toute la
-- watchlist rapatriée par pages de 1000 pour être comptée en JS.
create or replace function public.watchlist_counts()
returns table (media_type text, status text, count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
	select w.media_type, w.status, count(*)::bigint
	from public.watchlist w
	where w.user_id = (select auth.uid())
	group by w.media_type, w.status
$$;

-- Épisodes vus et dernier visionnage par série, pour les seules séries demandées : remplace
-- episode_watch_counts() + episode_last_watches(), qui renvoyaient toutes les séries du
-- compte en deux allers-retours pour être filtrées en JS.
create or replace function public.my_tv_progress(p_tv_ids integer[])
returns table (tv_id integer, watched_count bigint, last_watched_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
	select ew.tv_id, count(*)::bigint, max(ew.watched_at)
	from public.episode_watches ew
	where ew.user_id = (select auth.uid())
		and ew.tv_id = any (p_tv_ids)
	group by ew.tv_id
$$;

-- Tout ce que la barre de navigation et le slot d'invitations lisent à chaque rendu du
-- layout, en un aller-retour au lieu de cinq. Une ligne même sans profil ni session.
create or replace function public.my_shell_state()
returns table (
	unread_notifications bigint,
	avatar_url text,
	profile_created_at timestamptz,
	watchlist_count bigint,
	has_streaming_providers boolean,
	prompts jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
	select
		(
			select count(*)
			from public.notifications n
			where n.user_id = (select auth.uid()) and n.read_at is null
		)::bigint,
		p.avatar_url,
		p.created_at,
		(
			select count(*)
			from public.watchlist w
			where w.user_id = (select auth.uid())
		)::bigint,
		coalesce(
			(
				select cardinality(s.provider_ids) > 0
				from public.user_streaming_providers s
				where s.user_id = (select auth.uid())
			),
			false
		),
		coalesce(
			(
				select jsonb_object_agg(up.prompt_key, up.state)
				from public.user_prompts up
				where up.user_id = (select auth.uid())
			),
			'{}'::jsonb
		)
	from (select 1) as one
	left join public.user_profiles p on p.user_id = (select auth.uid())
$$;

-- Titres ayant au moins une note ou une critique. Lu par le serveur (service role, mis en
-- cache) pour ne plus interroger la base au rendu anonyme d'une fiche que personne n'a notée
-- — l'écrasante majorité des pages vues par les robots d'indexation. Une seule ligne : le
-- plafond de 1000 lignes de PostgREST ne peut pas la tronquer.
create or replace function public.reviewed_media_index()
returns table (movie_ids integer[], tv_ids integer[], episode_tv_ids integer[])
language sql
stable
security invoker
set search_path = ''
as $$
	select
		coalesce(array_agg(distinct r.media_id) filter (where r.media_type = 'movie'), '{}'),
		coalesce(array_agg(distinct r.media_id) filter (where r.media_type = 'tv'), '{}'),
		coalesce(
			array_agg(distinct r.tv_id) filter (where r.media_type = 'episode' and r.tv_id is not null),
			'{}'
		)
	from public.reviews r
	where r.rating is not null or r.content is not null
$$;

revoke all on function public.watchlist_counts() from public, anon;
revoke all on function public.my_tv_progress(integer[]) from public, anon;
revoke all on function public.my_shell_state() from public, anon;
revoke all on function public.reviewed_media_index() from public, anon, authenticated;

grant execute on function public.watchlist_counts() to authenticated, service_role;
grant execute on function public.my_tv_progress(integer[]) to authenticated, service_role;
grant execute on function public.my_shell_state() to authenticated, service_role;
grant execute on function public.reviewed_media_index() to service_role;
