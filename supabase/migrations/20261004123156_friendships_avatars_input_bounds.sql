-- Écritures directes par l'API REST bornées comme celles de l'app (octobre 2026).
-- La clé anon et le JWT de l'utilisateur suffisent pour écrire sans passer par les Server Actions :
-- la base doit donc porter elle-même les règles que l'app vérifie.

-- Une demande d'ami naît « en attente ». Avant : INSERT direct en status 'accepted', amitié sans
-- consentement et sans notification, qui ouvrait les données « amis » de la cible.
alter policy friendships_insert_own on public.friendships
  with check ((select auth.uid()) = requester_id and status = 'pending');

-- Le destinataire ne fait que répondre. Avant : il pouvait réécrire requester_id vers un tiers et
-- fabriquer une amitié acceptée entre ce tiers et lui-même.
revoke update on table public.friendships from authenticated, anon;
grant update (status, updated_at) on table public.friendships to authenticated;

-- Avatars : mêmes bornes que validateAvatarFile (5 Mo, jpeg/png/webp). Le bucket est public et
-- l'upload direct contournait la validation de l'app.
update storage.buckets
  set file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
  where id = 'avatars';

-- Champs libres : mêmes limites que les Server Actions (profile.ts, reviews.ts, playlists.ts,
-- validateUsername). Les données existantes les respectent toutes.
alter table public.user_profiles
  add constraint user_profiles_username_format check (username ~ '^[a-zA-Z0-9_]{1,50}$'),
  add constraint user_profiles_bio_length check (char_length(bio) <= 500),
  add constraint user_profiles_socials_length check (
    char_length(instagram) <= 50 and char_length(tiktok) <= 50
    and char_length(letterboxd) <= 50 and char_length(twitter) <= 50
  ),
  add constraint user_profiles_website_format check (website ~ '^https?://' and char_length(website) <= 2000);

alter table public.reviews
  add constraint reviews_content_length check (char_length(content) <= 65000);

alter table public.playlists
  add constraint playlists_name_length check (char_length(btrim(name)) between 1 and 100),
  add constraint playlists_description_length check (char_length(description) <= 500);
