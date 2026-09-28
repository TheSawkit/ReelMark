-- Schéma de référence de ReelMark, reconstitué le 2026-09-28 depuis le catalogue du projet de
-- production (lecture seule) : l'état de la base juste avant la migration 20260928010006.
--
-- Jusque-là le schéma était appliqué à la main ou via MCP, sans fichier versionné. Ce fichier
-- permet de recréer une base identique (projet de test, `supabase start`) ; il ne doit jamais
-- être rejoué sur la production, qui porte déjà tout ce qu'il contient.
--
-- Reproduit tel quel, y compris ce qui mériterait un nettoyage (contrainte CHECK en double sur
-- friendships, droits `anon` = MAINTAIN seul sur watchlist / privacy_settings, droits par défaut
-- complets pour anon sur trois tables) : une base de test doit se comporter comme la prod.

-- ─── Extensions ────────────────────────────────────────────────────────────────────────────
-- pgcrypto, uuid-ossp, pg_stat_statements et supabase_vault sont présentes sur tout projet
-- Supabase ; pg_graphql l'est sur un projet hébergé, pas sous `supabase start`. moddatetime sert
-- au trigger de notification_preferences ; wrappers est installée en prod sans serveur distant.
create extension if not exists pg_graphql with schema graphql;
create extension if not exists moddatetime with schema extensions;
create extension if not exists wrappers with schema extensions;

-- ─── Schéma privé ──────────────────────────────────────────────────────────────────────────
-- Aucun droit d'usage pour les rôles d'API : ses fonctions ne sont appelées que depuis des
-- policies, résolues à leur création.
create schema if not exists private;
revoke all on schema private from public;

-- ─── Tables ────────────────────────────────────────────────────────────────────────────────
create table public.episode_watches (
	id uuid default gen_random_uuid() not null,
	user_id uuid not null,
	tv_id integer not null,
	season_number integer not null,
	episode_number integer not null,
	watched_at timestamp with time zone default now()
);

create table public.friendships (
	id uuid default gen_random_uuid() not null,
	requester_id uuid not null,
	addressee_id uuid not null,
	status text default 'pending'::text not null,
	created_at timestamp with time zone default now() not null,
	updated_at timestamp with time zone default now() not null
);

create table public.mcp_keys (
	user_id uuid not null,
	key_hash text not null,
	created_at timestamp with time zone default now() not null,
	last_used_at timestamp with time zone
);

create table public.notification_preferences (
	user_id uuid not null,
	friend_requests boolean default true not null,
	friend_accepted boolean default true not null,
	new_episodes boolean default true not null,
	suggestions boolean default true not null,
	created_at timestamp with time zone default now() not null,
	updated_at timestamp with time zone default now() not null
);

create table public.notifications (
	id uuid default gen_random_uuid() not null,
	user_id uuid not null,
	type text not null,
	sender_id uuid not null,
	sender_username text,
	media_id integer,
	media_type text,
	media_title text,
	poster_path text,
	season_number integer,
	episode_number integer,
	url text,
	read_at timestamp with time zone,
	created_at timestamp with time zone default now() not null
);

create table public.playlists (
	id uuid default gen_random_uuid() not null,
	user_id uuid not null,
	name text not null,
	description text,
	created_at timestamp with time zone default now() not null,
	updated_at timestamp with time zone default now() not null,
	visibility text default 'private'::text not null
);

create table public.playlist_items (
	id uuid default gen_random_uuid() not null,
	playlist_id uuid not null,
	media_id integer not null,
	media_type text not null,
	media_title text not null,
	poster_path text,
	added_at timestamp with time zone default now() not null,
	release_date text,
	genre_ids integer[]
);

create table public.privacy_settings (
	user_id uuid not null,
	watchlist_visibility text default 'public'::text not null,
	watched_visibility text default 'public'::text not null,
	reviews_visibility text default 'public'::text not null,
	playlists_visibility text default 'public'::text not null,
	friends_visibility text default 'public'::text not null
);

create table public.push_subscriptions (
	id uuid default gen_random_uuid() not null,
	user_id uuid not null,
	endpoint text not null,
	p256dh text not null,
	auth text not null,
	user_agent text,
	created_at timestamp with time zone default now() not null
);

create table public.rate_limits (
	key text not null,
	count integer not null,
	reset_at timestamp with time zone not null
);

create table public.recommendation_dismissals (
	id uuid default gen_random_uuid() not null,
	user_id uuid not null,
	media_id integer not null,
	media_type text not null,
	genre_ids integer[] default '{}'::integer[] not null,
	created_at timestamp with time zone default now() not null
);

create table public.reviews (
	id uuid default gen_random_uuid() not null,
	user_id uuid not null,
	media_id integer not null,
	media_type text not null,
	media_title text not null,
	poster_path text,
	rating integer,
	content text,
	created_at timestamp with time zone default now() not null,
	updated_at timestamp with time zone default now() not null,
	tv_id integer,
	season_number integer
);

create table public.user_profiles (
	user_id uuid not null,
	username text not null,
	bio text,
	instagram text,
	tiktok text,
	letterboxd text,
	twitter text,
	website text,
	created_at timestamp with time zone default now() not null,
	updated_at timestamp with time zone default now() not null,
	avatar_url text,
	onboarding_completed boolean default false not null,
	full_name text
);

create table public.user_prompts (
	user_id uuid not null,
	prompt_key text not null,
	state text not null,
	updated_at timestamp with time zone default now() not null
);

create table public.user_streaming_providers (
	user_id uuid not null,
	provider_ids integer[] default '{}'::integer[] not null,
	updated_at timestamp with time zone default now() not null
);

create table public.watchlist (
	id uuid default gen_random_uuid() not null,
	user_id uuid not null,
	media_id integer not null,
	media_title text not null,
	poster_path text,
	status text not null,
	created_at timestamp with time zone default now(),
	media_type text default 'movie'::text not null,
	total_episodes integer,
	release_date text,
	genre_ids integer[]
);

-- ─── Clés primaires, unicités, CHECK ───────────────────────────────────────────────────────
alter table public.episode_watches
	add constraint episode_watches_pkey primary key (id),
	add constraint episode_watches_user_id_tv_id_season_number_episode_number_key unique (user_id, tv_id, season_number, episode_number);

alter table public.friendships
	add constraint friendships_pkey primary key (id),
	add constraint friendships_requester_id_addressee_id_key unique (requester_id, addressee_id),
	add constraint friendships_check check ((requester_id <> addressee_id)),
	add constraint friendships_no_self_friendship check ((requester_id <> addressee_id)),
	add constraint friendships_status_check check ((status = any (array['pending'::text, 'accepted'::text, 'rejected'::text])));

alter table public.mcp_keys
	add constraint mcp_keys_pkey primary key (user_id),
	add constraint mcp_keys_key_hash_key unique (key_hash);

alter table public.notification_preferences
	add constraint notification_preferences_pkey primary key (user_id);

alter table public.notifications
	add constraint notifications_pkey primary key (id),
	add constraint notifications_media_type_check check ((media_type = any (array['movie'::text, 'tv'::text]))),
	add constraint notifications_type_check check ((type = any (array['friend_request'::text, 'friend_accepted'::text, 'new_episode'::text, 'suggestion'::text])));

alter table public.playlists
	add constraint playlists_pkey primary key (id),
	add constraint playlists_visibility_check check ((visibility = any (array['public'::text, 'friends'::text, 'private'::text])));

alter table public.playlist_items
	add constraint playlist_items_pkey primary key (id),
	add constraint playlist_items_playlist_id_media_id_media_type_key unique (playlist_id, media_id, media_type),
	add constraint playlist_items_media_type_check check ((media_type = any (array['movie'::text, 'tv'::text])));

alter table public.privacy_settings
	add constraint privacy_settings_pkey primary key (user_id),
	add constraint privacy_settings_friends_visibility_check check ((friends_visibility = any (array['public'::text, 'friends'::text, 'private'::text]))),
	add constraint privacy_settings_playlists_visibility_check check ((playlists_visibility = any (array['public'::text, 'friends'::text, 'private'::text]))),
	add constraint privacy_settings_reviews_visibility_check check ((reviews_visibility = any (array['public'::text, 'friends'::text, 'private'::text]))),
	add constraint privacy_settings_watched_visibility_check check ((watched_visibility = any (array['public'::text, 'friends'::text, 'private'::text]))),
	add constraint privacy_settings_watchlist_visibility_check check ((watchlist_visibility = any (array['public'::text, 'friends'::text, 'private'::text])));

alter table public.push_subscriptions
	add constraint push_subscriptions_pkey primary key (id),
	add constraint push_subscriptions_endpoint_key unique (endpoint);

alter table public.rate_limits
	add constraint rate_limits_pkey primary key (key);

alter table public.recommendation_dismissals
	add constraint recommendation_dismissals_pkey primary key (id),
	add constraint recommendation_dismissals_user_id_media_id_media_type_key unique (user_id, media_id, media_type),
	add constraint recommendation_dismissals_media_type_check check ((media_type = any (array['movie'::text, 'tv'::text])));

alter table public.reviews
	add constraint reviews_pkey primary key (id),
	add constraint reviews_user_id_media_id_media_type_key unique (user_id, media_id, media_type),
	add constraint reviews_media_type_check check ((media_type = any (array['movie'::text, 'tv'::text, 'episode'::text]))),
	add constraint reviews_rating_check check (((rating >= 1) and (rating <= 10)));

alter table public.user_profiles
	add constraint user_profiles_pkey primary key (user_id),
	add constraint user_profiles_username_key unique (username);

alter table public.user_prompts
	add constraint user_prompts_pkey primary key (user_id, prompt_key),
	add constraint user_prompts_state_check check ((state = any (array['done'::text, 'dismissed'::text])));

alter table public.user_streaming_providers
	add constraint user_streaming_providers_pkey primary key (user_id);

alter table public.watchlist
	add constraint watchlist_pkey primary key (id),
	add constraint watchlist_user_id_media_id_media_type_key unique (user_id, media_id, media_type),
	add constraint watchlist_status_check check ((status = any (array['to_watch'::text, 'watched'::text, 'abandoned'::text])));

-- ─── Clés étrangères — toutes en cascade : supprimer un compte ne laisse aucune ligne ──────
alter table public.episode_watches
	add constraint episode_watches_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.friendships
	add constraint friendships_addressee_id_fkey foreign key (addressee_id) references auth.users(id) on delete cascade,
	add constraint friendships_requester_id_fkey foreign key (requester_id) references auth.users(id) on delete cascade;
alter table public.mcp_keys
	add constraint mcp_keys_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.notification_preferences
	add constraint notification_preferences_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.notifications
	add constraint notifications_sender_id_fkey foreign key (sender_id) references auth.users(id) on delete cascade,
	add constraint notifications_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.playlists
	add constraint playlists_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.playlist_items
	add constraint playlist_items_playlist_id_fkey foreign key (playlist_id) references public.playlists(id) on delete cascade;
alter table public.privacy_settings
	add constraint privacy_settings_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.push_subscriptions
	add constraint push_subscriptions_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.recommendation_dismissals
	add constraint recommendation_dismissals_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.reviews
	add constraint reviews_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.user_profiles
	add constraint user_profiles_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.user_prompts
	add constraint user_prompts_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.user_streaming_providers
	add constraint user_streaming_providers_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.watchlist
	add constraint watchlist_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

-- ─── Index ─────────────────────────────────────────────────────────────────────────────────
create index friendships_addressee_idx on public.friendships using btree (addressee_id);
create index friendships_addressee_pending_idx on public.friendships using btree (addressee_id) where (status = 'pending'::text);
create index notifications_actor_idx on public.notifications using btree (sender_id) where (sender_id is not null);
create index notifications_user_created_idx on public.notifications using btree (user_id, created_at desc);
create index notifications_user_unread_idx on public.notifications using btree (user_id) where (read_at is null);
create index idx_playlists_user_visibility on public.playlists using btree (user_id, visibility);
create index playlists_user_id_idx on public.playlists using btree (user_id);
create index push_subscriptions_user_idx on public.push_subscriptions using btree (user_id);
create index recommendation_dismissals_user_idx on public.recommendation_dismissals using btree (user_id);
create index idx_reviews_episode_rating on public.reviews using btree (media_id) where ((media_type = 'episode'::text) and (rating is not null));
create index idx_reviews_media_rating on public.reviews using btree (media_id, media_type) where (rating is not null);
create index idx_reviews_season_rating on public.reviews using btree (tv_id, season_number) where ((media_type = 'episode'::text) and (rating is not null));
create index idx_reviews_show_rating on public.reviews using btree (tv_id) where ((media_type = 'episode'::text) and (rating is not null));
create unique index user_profiles_username_idx on public.user_profiles using btree (lower(username));
create index watchlist_user_created_idx on public.watchlist using btree (user_id, created_at desc);

-- ─── Realtime : identité de réplication complète pour que DELETE porte la ligne entière ────
alter table public.episode_watches replica identity full;
alter table public.friendships replica identity full;
alter table public.notifications replica identity full;
alter table public.watchlist replica identity full;

-- ─── RLS sur chaque table ──────────────────────────────────────────────────────────────────
alter table public.episode_watches enable row level security;
alter table public.friendships enable row level security;
alter table public.mcp_keys enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notifications enable row level security;
alter table public.playlist_items enable row level security;
alter table public.playlists enable row level security;
alter table public.privacy_settings enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.rate_limits enable row level security;
alter table public.recommendation_dismissals enable row level security;
alter table public.reviews enable row level security;
alter table public.user_profiles enable row level security;
alter table public.user_prompts enable row level security;
alter table public.user_streaming_providers enable row level security;
alter table public.watchlist enable row level security;

-- ─── Fonctions ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION private.can_view_section(p_owner uuid, p_visibility text)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select p_owner = (select auth.uid())
      or coalesce(p_visibility, 'public') = 'public'
      or (
        coalesce(p_visibility, 'public') = 'friends'
        and exists (
          select 1 from public.friendships f
          where f.status = 'accepted'
            and ((f.requester_id = (select auth.uid()) and f.addressee_id = p_owner)
              or (f.addressee_id = (select auth.uid()) and f.requester_id = p_owner))
        )
      );
$function$;

CREATE OR REPLACE FUNCTION public.can_view_watch_activity(p_owner uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
	v_viewer uuid := auth.uid();
	v_watchlist text;
	v_watched text;
begin
	if v_viewer is null then
		return false;
	end if;

	if v_viewer = p_owner then
		return true;
	end if;

	select watchlist_visibility, watched_visibility
	into v_watchlist, v_watched
	from public.privacy_settings
	where user_id = p_owner;

	if not found then
		return true;
	end if;

	if v_watchlist = 'public' or v_watched = 'public' then
		return true;
	end if;

	if v_watchlist = 'friends' or v_watched = 'friends' then
		return exists (
			select 1
			from public.friendships
			where status = 'accepted'
				and (
					(requester_id = v_viewer and addressee_id = p_owner)
					or (requester_id = p_owner and addressee_id = v_viewer)
				)
		);
	end if;

	return false;
end;
$function$;

CREATE OR REPLACE FUNCTION public.consume_rate_limits(p_keys text[], p_limits integer[], p_window_seconds integer[], p_cost integer)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
	v_count integer;
	v_reset_at timestamptz;
begin
	if p_cost <= 0 then
		return null;
	end if;
	for i in 1 .. coalesce(array_length(p_keys, 1), 0) loop
		insert into public.rate_limits as r (key, count, reset_at)
		values (p_keys[i], 0, now() + make_interval(secs => p_window_seconds[i]))
		on conflict (key) do update
			set count = case when r.reset_at <= now() then 0 else r.count end,
				reset_at = case when r.reset_at <= now() then excluded.reset_at else r.reset_at end
		returning r.count, r.reset_at into v_count, v_reset_at;
		if v_count + p_cost > p_limits[i] then
			return v_reset_at;
		end if;
	end loop;
	update public.rate_limits set count = count + p_cost where key = any (p_keys);
	return null;
end;
$function$;

CREATE OR REPLACE FUNCTION public.episode_last_watches()
 RETURNS TABLE(tv_id integer, last_watched_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select tv_id, max(watched_at) as last_watched_at
  from public.episode_watches
  where user_id = (select auth.uid())
  group by tv_id
$function$;

CREATE OR REPLACE FUNCTION public.episode_watch_counts()
 RETURNS TABLE(tv_id integer, watched_count bigint)
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select tv_id, count(*) as watched_count
  from public.episode_watches
  where user_id = (select auth.uid())
  group by tv_id
$function$;

CREATE OR REPLACE FUNCTION public.episode_watch_counts_for(p_user_id uuid)
 RETURNS TABLE(tv_id integer, watched_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
	select ew.tv_id, count(*)::bigint as watched_count
	from public.episode_watches ew
	where ew.user_id = p_user_id
		and public.can_view_watch_activity(p_user_id)
	group by ew.tv_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_episodes_rating(p_episode_ids integer[])
 RETURNS TABLE(avg numeric, count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
    SELECT
        ROUND(AVG(rating)::numeric, 4) AS avg,
        COUNT(*)::bigint               AS count
    FROM reviews
    WHERE media_id  = ANY(p_episode_ids)
      AND media_type = 'episode'
      AND rating IS NOT NULL
$function$;

CREATE OR REPLACE FUNCTION public.get_media_rating(p_media_id integer, p_media_type text)
 RETURNS TABLE(avg numeric, count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT
        ROUND(AVG(rating)::numeric, 4) AS avg,
        COUNT(*)::bigint               AS count
    FROM reviews
    WHERE media_id  = p_media_id
      AND media_type = p_media_type
      AND rating IS NOT NULL
$function$;

CREATE OR REPLACE FUNCTION public.get_public_episode_reviews(p_episode_ids integer[], p_viewer_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, user_id uuid, media_id integer, username text, avatar_url text, rating integer, content text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT
        r.id,
        r.user_id,
        r.media_id,
        COALESCE(p.username, 'User') AS username,
        COALESCE(p.avatar_url, au.raw_user_meta_data->>'avatar_url')::text AS avatar_url,
        r.rating,
        r.content,
        r.created_at
    FROM reviews r
    LEFT JOIN privacy_settings ps ON ps.user_id = r.user_id
    LEFT JOIN user_profiles p ON p.user_id = r.user_id
    LEFT JOIN auth.users au ON au.id = r.user_id
    WHERE
        r.media_id = ANY(p_episode_ids)
        AND r.media_type = 'episode'
        AND (r.rating IS NOT NULL OR r.content IS NOT NULL)
        AND (
            COALESCE(ps.reviews_visibility, 'public') = 'public'
            OR r.user_id = p_viewer_id
            OR (
                COALESCE(ps.reviews_visibility, 'public') = 'friends'
                AND p_viewer_id IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM friendships f
                    WHERE f.status = 'accepted'
                    AND (
                        (f.requester_id = r.user_id AND f.addressee_id = p_viewer_id)
                        OR (f.requester_id = p_viewer_id AND f.addressee_id = r.user_id)
                    )
                )
            )
        )
    ORDER BY r.media_id, r.created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_reviews(p_media_id integer, p_media_type text, p_viewer_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, user_id uuid, media_id integer, username text, avatar_url text, rating integer, content text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT
        r.id,
        r.user_id,
        r.media_id,
        COALESCE(p.username, 'User') AS username,
        COALESCE(p.avatar_url, au.raw_user_meta_data->>'avatar_url')::text AS avatar_url,
        r.rating,
        r.content,
        r.created_at
    FROM reviews r
    LEFT JOIN privacy_settings ps ON ps.user_id = r.user_id
    LEFT JOIN user_profiles p ON p.user_id = r.user_id
    LEFT JOIN auth.users au ON au.id = r.user_id
    WHERE
        r.media_id = p_media_id
        AND r.media_type = p_media_type
        AND (r.rating IS NOT NULL OR r.content IS NOT NULL)
        AND (
            COALESCE(ps.reviews_visibility, 'public') = 'public'
            OR r.user_id = p_viewer_id
            OR (
                COALESCE(ps.reviews_visibility, 'public') = 'friends'
                AND p_viewer_id IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM friendships f
                    WHERE f.status = 'accepted'
                    AND (
                        (f.requester_id = r.user_id AND f.addressee_id = p_viewer_id)
                        OR (f.requester_id = p_viewer_id AND f.addressee_id = r.user_id)
                    )
                )
            )
        )
    ORDER BY r.created_at DESC
    LIMIT 50;
$function$;

CREATE OR REPLACE FUNCTION public.get_season_rating(p_tv_id integer, p_season_number integer)
 RETURNS TABLE(avg numeric, count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
    SELECT
        ROUND(AVG(rating)::numeric, 4) AS avg,
        COUNT(*)::bigint               AS count
    FROM reviews
    WHERE tv_id          = p_tv_id
      AND season_number  = p_season_number
      AND media_type     = 'episode'
      AND rating IS NOT NULL
$function$;

CREATE OR REPLACE FUNCTION public.get_show_rating(p_tv_id integer)
 RETURNS TABLE(avg numeric, count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
    SELECT
        ROUND(AVG(rating)::numeric, 4) AS avg,
        COUNT(*)::bigint               AS count
    FROM reviews
    WHERE tv_id     = p_tv_id
      AND media_type = 'episode'
      AND rating IS NOT NULL
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if coalesce(new.raw_user_meta_data->>'username', '') <> '' then
    insert into public.user_profiles (user_id, username, full_name, avatar_url)
    values (
      new.id,
      new.raw_user_meta_data->>'username',
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'avatar_url', '')
    )
    on conflict do nothing;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.notify_friend_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_sender_username text;
  v_pref boolean;
begin
  if (tg_op = 'INSERT' and new.status = 'pending') then
    v_pref := coalesce((select friend_requests from public.notification_preferences where user_id = new.addressee_id), true);
    if v_pref is false then return new; end if;
    select username into v_sender_username from public.user_profiles where user_id = new.requester_id;
    insert into public.notifications (user_id, type, sender_id, sender_username, url)
    values (new.addressee_id, 'friend_request', new.requester_id, v_sender_username,
            '/profile/' || coalesce(v_sender_username, ''));
    return new;
  end if;

  if (tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'accepted') then
    v_pref := coalesce((select friend_accepted from public.notification_preferences where user_id = new.requester_id), true);
    if v_pref is false then return new; end if;
    select username into v_sender_username from public.user_profiles where user_id = new.addressee_id;
    insert into public.notifications (user_id, type, sender_id, sender_username, url)
    values (new.requester_id, 'friend_accepted', new.addressee_id, v_sender_username,
            '/profile/' || coalesce(v_sender_username, ''));
    return new;
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_tv_watchlist_status(p_tv_id integer, p_total integer, p_title text DEFAULT NULL::text, p_poster text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
	v_uid uuid := auth.uid();
	v_status text;
begin
	if v_uid is null or p_total is null or p_total <= 0 then
		return;
	end if;

	select case when count(*) >= p_total then 'watched' else 'to_watch' end
	into v_status
	from public.episode_watches
	where user_id = v_uid and tv_id = p_tv_id and season_number > 0;

	update public.watchlist
	set status = v_status, total_episodes = p_total
	where user_id = v_uid and media_id = p_tv_id and media_type = 'tv';

	if not found and p_title is not null then
		insert into public.watchlist
			(user_id, media_id, media_type, media_title, poster_path, status, total_episodes)
		values (v_uid, p_tv_id, 'tv', p_title, p_poster, v_status, p_total)
		on conflict (user_id, media_id, media_type) do update
			set status = excluded.status, total_episodes = excluded.total_episodes;
	end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.user_episode_watch_counts(p_user_id uuid, p_tv_ids integer[])
 RETURNS TABLE(tv_id integer, watched_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select ew.tv_id, count(*)::bigint as watched_count
  from public.episode_watches ew
  where ew.user_id = p_user_id
    and ew.tv_id = any (p_tv_ids)
  group by ew.tv_id
$function$;

comment on function public.can_view_watch_activity(uuid) is 'True when auth.uid() may see p_owner watch activity (watchlist OR watched section visible). No privacy row = all-public default, mirroring getPrivacySettings.';
comment on function public.episode_last_watches() is 'Most recent watched_at per show for the calling user — lets the dashboard rank shows by real recency instead of sampling recent rows.';
comment on function public.episode_watch_counts_for(uuid) is 'Watched episode count per show for p_user_id, gated by that user privacy settings. Empty when the viewer may not look.';

-- ─── Policies ──────────────────────────────────────────────────────────────────────────────
create policy episode_watches_delete_own on public.episode_watches as permissive for delete to public
	using ((( select auth.uid() as uid) = user_id));
create policy episode_watches_insert_own on public.episode_watches as permissive for insert to public
	with check ((( select auth.uid() as uid) = user_id));
create policy episode_watches_read_own on public.episode_watches as permissive for select to public
	using ((( select auth.uid() as uid) = user_id));

create policy friendships_delete_own on public.friendships as permissive for delete to public
	using (((( select auth.uid() as uid) = requester_id) or (( select auth.uid() as uid) = addressee_id)));
create policy friendships_insert_own on public.friendships as permissive for insert to public
	with check ((( select auth.uid() as uid) = requester_id));
create policy friendships_read_own on public.friendships as permissive for select to public
	using (((( select auth.uid() as uid) = requester_id) or (( select auth.uid() as uid) = addressee_id)));
create policy friendships_update_addressee on public.friendships as permissive for update to public
	using ((addressee_id = ( select auth.uid() as uid)))
	with check ((addressee_id = ( select auth.uid() as uid)));

create policy mcp_keys_manage_own on public.mcp_keys as permissive for all to authenticated
	using ((( select auth.uid() as uid) = user_id))
	with check ((( select auth.uid() as uid) = user_id));

create policy notif_prefs_insert_own on public.notification_preferences as permissive for insert to public
	with check ((( select auth.uid() as uid) = user_id));
create policy notif_prefs_select_own on public.notification_preferences as permissive for select to public
	using ((( select auth.uid() as uid) = user_id));
create policy notif_prefs_update_own on public.notification_preferences as permissive for update to public
	using ((( select auth.uid() as uid) = user_id))
	with check ((( select auth.uid() as uid) = user_id));

create policy notifications_delete_own on public.notifications as permissive for delete to public
	using ((( select auth.uid() as uid) = user_id));
create policy notifications_select_own on public.notifications as permissive for select to public
	using ((( select auth.uid() as uid) = user_id));
create policy notifications_update_own on public.notifications as permissive for update to public
	using ((( select auth.uid() as uid) = user_id))
	with check ((( select auth.uid() as uid) = user_id));

create policy playlist_items_delete_own on public.playlist_items as permissive for delete to public
	using ((( select auth.uid() as uid) = ( select playlists.user_id
	   from playlists
	  where (playlists.id = playlist_items.playlist_id))));
create policy playlist_items_insert_own on public.playlist_items as permissive for insert to public
	with check ((( select auth.uid() as uid) = ( select playlists.user_id
	   from playlists
	  where (playlists.id = playlist_items.playlist_id))));
create policy playlist_items_select on public.playlist_items as permissive for select to public
	using ((exists ( select 1
	   from playlists p
	  where ((p.id = playlist_items.playlist_id) and ((p.user_id = ( select auth.uid() as uid)) or (p.visibility = 'public'::text) or ((p.visibility = 'friends'::text) and (exists ( select 1
	           from friendships f
	          where ((f.status = 'accepted'::text) and (((f.requester_id = ( select auth.uid() as uid)) and (f.addressee_id = p.user_id)) or ((f.addressee_id = ( select auth.uid() as uid)) and (f.requester_id = p.user_id))))))))))));
create policy playlist_items_update_own on public.playlist_items as permissive for update to public
	using ((( select auth.uid() as uid) = ( select playlists.user_id
	   from playlists
	  where (playlists.id = playlist_items.playlist_id))));

create policy playlists_delete_own on public.playlists as permissive for delete to public
	using ((( select auth.uid() as uid) = user_id));
create policy playlists_insert_own on public.playlists as permissive for insert to public
	with check ((( select auth.uid() as uid) = user_id));
create policy playlists_select on public.playlists as permissive for select to public
	using (((user_id = ( select auth.uid() as uid)) or (visibility = 'public'::text) or ((visibility = 'friends'::text) and (exists ( select 1
	   from friendships f
	  where ((f.status = 'accepted'::text) and (((f.requester_id = ( select auth.uid() as uid)) and (f.addressee_id = playlists.user_id)) or ((f.addressee_id = ( select auth.uid() as uid)) and (f.requester_id = playlists.user_id)))))))));
create policy playlists_update_own on public.playlists as permissive for update to public
	using ((( select auth.uid() as uid) = user_id));

create policy privacy_settings_delete_own on public.privacy_settings as permissive for delete to public
	using ((( select auth.uid() as uid) = user_id));
create policy privacy_settings_insert_own on public.privacy_settings as permissive for insert to public
	with check ((( select auth.uid() as uid) = user_id));
create policy privacy_settings_read_authenticated on public.privacy_settings as permissive for select to public
	using ((( select auth.role() as role) = 'authenticated'::text));
create policy privacy_settings_update_own on public.privacy_settings as permissive for update to public
	using ((( select auth.uid() as uid) = user_id));

create policy push_subs_delete_own on public.push_subscriptions as permissive for delete to public
	using ((( select auth.uid() as uid) = user_id));
create policy push_subs_insert_own on public.push_subscriptions as permissive for insert to public
	with check ((( select auth.uid() as uid) = user_id));
create policy push_subs_select_own on public.push_subscriptions as permissive for select to public
	using ((( select auth.uid() as uid) = user_id));
create policy push_subs_update_own on public.push_subscriptions as permissive for update to public
	using ((( select auth.uid() as uid) = user_id))
	with check ((( select auth.uid() as uid) = user_id));

create policy recommendation_dismissals_manage_own on public.recommendation_dismissals as permissive for all to authenticated
	using ((( select auth.uid() as uid) = user_id))
	with check ((( select auth.uid() as uid) = user_id));

create policy reviews_delete_own on public.reviews as permissive for delete to public
	using ((( select auth.uid() as uid) = user_id));
create policy reviews_insert_own on public.reviews as permissive for insert to public
	with check ((( select auth.uid() as uid) = user_id));
create policy reviews_select_visible on public.reviews as permissive for select to authenticated
	using (((user_id = ( select auth.uid() as uid)) or private.can_view_section(user_id, ( select ps.reviews_visibility
	   from privacy_settings ps
	  where (ps.user_id = reviews.user_id)))));
create policy reviews_update_own on public.reviews as permissive for update to public
	using ((( select auth.uid() as uid) = user_id));

create policy user_profiles_delete_own on public.user_profiles as permissive for delete to public
	using ((( select auth.uid() as uid) = user_id));
create policy user_profiles_insert_own on public.user_profiles as permissive for insert to public
	with check ((( select auth.uid() as uid) = user_id));
create policy user_profiles_read_all on public.user_profiles as permissive for select to public
	using (true);
create policy user_profiles_update_own on public.user_profiles as permissive for update to public
	using ((( select auth.uid() as uid) = user_id));

create policy user_prompts_manage_own on public.user_prompts as permissive for all to public
	using ((( select auth.uid() as uid) = user_id))
	with check ((( select auth.uid() as uid) = user_id));

create policy user_streaming_providers_manage_own on public.user_streaming_providers as permissive for all to authenticated
	using ((( select auth.uid() as uid) = user_id))
	with check ((( select auth.uid() as uid) = user_id));

create policy watchlist_delete_own on public.watchlist as permissive for delete to public
	using ((( select auth.uid() as uid) = user_id));
create policy watchlist_insert_own on public.watchlist as permissive for insert to public
	with check ((( select auth.uid() as uid) = user_id));
create policy watchlist_select_visible on public.watchlist as permissive for select to authenticated
	using (((user_id = ( select auth.uid() as uid)) or ((status = 'to_watch'::text) and private.can_view_section(user_id, ( select ps.watchlist_visibility
	   from privacy_settings ps
	  where (ps.user_id = watchlist.user_id)))) or ((status = 'watched'::text) and private.can_view_section(user_id, ( select ps.watched_visibility
	   from privacy_settings ps
	  where (ps.user_id = watchlist.user_id))))));
create policy watchlist_update_own on public.watchlist as permissive for update to public
	using ((( select auth.uid() as uid) = user_id));

-- ─── Triggers ──────────────────────────────────────────────────────────────────────────────
create trigger friendships_notify_insert after insert on public.friendships
	for each row execute function public.notify_friend_event();
create trigger friendships_notify_update after update on public.friendships
	for each row execute function public.notify_friend_event();
create trigger notification_preferences_set_updated_at before update on public.notification_preferences
	for each row execute function extensions.moddatetime('updated_at');
create trigger on_auth_user_created after insert on auth.users
	for each row execute function public.handle_new_user();

-- ─── Droits sur les tables (exactement ceux de la prod) ────────────────────────────────────
revoke all on table
	public.episode_watches, public.friendships, public.mcp_keys, public.notification_preferences,
	public.notifications, public.playlist_items, public.playlists, public.privacy_settings,
	public.push_subscriptions, public.rate_limits, public.recommendation_dismissals, public.reviews,
	public.user_profiles, public.user_prompts, public.user_streaming_providers, public.watchlist
from anon, authenticated, service_role;

grant all on table
	public.episode_watches, public.friendships, public.mcp_keys, public.notification_preferences,
	public.notifications, public.playlist_items, public.playlists, public.privacy_settings,
	public.push_subscriptions, public.rate_limits, public.recommendation_dismissals, public.reviews,
	public.user_profiles, public.user_prompts, public.user_streaming_providers, public.watchlist
to service_role;

grant select, insert, update, delete on table
	public.episode_watches, public.friendships, public.notification_preferences, public.notifications,
	public.playlist_items, public.playlists, public.privacy_settings, public.push_subscriptions,
	public.reviews, public.user_profiles, public.watchlist
to authenticated;
grant all on table
	public.mcp_keys, public.recommendation_dismissals, public.user_prompts, public.user_streaming_providers
to authenticated;

grant select on table public.playlist_items, public.playlists, public.user_profiles to anon;
grant maintain on table public.privacy_settings, public.watchlist to anon;
grant all on table public.recommendation_dismissals, public.user_prompts, public.user_streaming_providers to anon;

-- ─── Droits sur les fonctions ──────────────────────────────────────────────────────────────
revoke all on function
	public.can_view_watch_activity(uuid),
	public.consume_rate_limits(text[], integer[], integer[], integer),
	public.episode_last_watches(),
	public.episode_watch_counts(),
	public.episode_watch_counts_for(uuid),
	public.get_episodes_rating(integer[]),
	public.get_media_rating(integer, text),
	public.get_public_episode_reviews(integer[], uuid),
	public.get_public_reviews(integer, text, uuid),
	public.get_season_rating(integer, integer),
	public.get_show_rating(integer),
	public.handle_new_user(),
	public.notify_friend_event(),
	public.rls_auto_enable(),
	public.sync_tv_watchlist_status(integer, integer, text, text),
	public.user_episode_watch_counts(uuid, integer[])
from public, anon, authenticated, service_role;

-- Tout le monde, rôle PUBLIC compris (historique : créées avant le retrait du droit par défaut).
grant execute on function
	public.episode_last_watches(),
	public.episode_watch_counts(),
	public.get_season_rating(integer, integer),
	public.get_show_rating(integer)
to public, anon, authenticated, service_role;

-- Agrégats et critiques publiques : lisibles sans compte, par design.
grant execute on function
	public.get_episodes_rating(integer[]),
	public.get_media_rating(integer, text),
	public.get_public_episode_reviews(integer[], uuid),
	public.get_public_reviews(integer, text, uuid)
to anon, authenticated, service_role;

grant execute on function
	public.can_view_watch_activity(uuid),
	public.episode_watch_counts_for(uuid),
	public.sync_tv_watchlist_status(integer, integer, text, text)
to authenticated, service_role;

-- Serveur uniquement : triggers, budget MCP, cron.
grant execute on function
	public.consume_rate_limits(text[], integer[], integer[], integer),
	public.handle_new_user(),
	public.notify_friend_event(),
	public.rls_auto_enable(),
	public.user_episode_watch_counts(uuid, integer[])
to service_role;

-- ─── Realtime ──────────────────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table
	public.episode_watches, public.friendships, public.notifications, public.watchlist;

-- ─── Storage : avatars ─────────────────────────────────────────────────────────────────────
-- Bucket public : les images sont servies par URL sans passer par la RLS. Aucune policy SELECT,
-- pour ne pas permettre de lister tous les fichiers ; l'upload et le remplacement ne sont
-- permis qu'à un fichier préfixé par l'id de son auteur. La suppression passe par le service role.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy avatars_insert_own on storage.objects as permissive for insert to authenticated
	with check (((bucket_id = 'avatars'::text) and (name ~~ ((auth.uid())::text || '-%'::text))));
create policy avatars_update_own on storage.objects as permissive for update to authenticated
	using (((bucket_id = 'avatars'::text) and (name ~~ ((auth.uid())::text || '-%'::text))))
	with check (((bucket_id = 'avatars'::text) and (name ~~ ((auth.uid())::text || '-%'::text))));

-- ─── RLS automatique sur toute nouvelle table de public ────────────────────────────────────
create event trigger ensure_rls on ddl_command_end
	when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
	execute function public.rls_auto_enable();
