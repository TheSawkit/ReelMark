-- Le lecteur des critiques vient du JWT, plus d'un paramètre (septembre 2026).
-- Ces deux fonctions sont SECURITY DEFINER et exécutables par anon : elles faisaient confiance à
-- p_viewer_id, fourni par l'appelant. Il suffisait de passer l'UUID d'un membre (renvoyé dans
-- chaque critique publique, colonne user_id) pour lire ses critiques privées et les critiques
-- « amis » de ses amis. Le lecteur est désormais auth.uid() ; p_viewer_id reste dans la
-- signature pour les clients déjà déployés, et n'est plus lu.

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
            OR r.user_id = (select auth.uid())
            OR (
                COALESCE(ps.reviews_visibility, 'public') = 'friends'
                AND (select auth.uid()) IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM friendships f
                    WHERE f.status = 'accepted'
                    AND (
                        (f.requester_id = r.user_id AND f.addressee_id = (select auth.uid()))
                        OR (f.requester_id = (select auth.uid()) AND f.addressee_id = r.user_id)
                    )
                )
            )
        )
    ORDER BY r.created_at DESC
    LIMIT 50;
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
            OR r.user_id = (select auth.uid())
            OR (
                COALESCE(ps.reviews_visibility, 'public') = 'friends'
                AND (select auth.uid()) IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM friendships f
                    WHERE f.status = 'accepted'
                    AND (
                        (f.requester_id = r.user_id AND f.addressee_id = (select auth.uid()))
                        OR (f.requester_id = (select auth.uid()) AND f.addressee_id = r.user_id)
                    )
                )
            )
        )
    ORDER BY r.media_id, r.created_at DESC;
$function$;

comment on function public.get_public_reviews(integer, text, uuid) is
	'Reviews of a title visible to the caller (auth.uid()). p_viewer_id is ignored, kept for deployed clients.';
comment on function public.get_public_episode_reviews(integer[], uuid) is
	'Episode reviews visible to the caller (auth.uid()). p_viewer_id is ignored, kept for deployed clients.';
