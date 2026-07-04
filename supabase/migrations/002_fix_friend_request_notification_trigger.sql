-- Fixes friend requests failing with:
--   "column \"actor_id\" of relation \"notifications\" does not exist"
--
-- Root cause: the trigger function attached to public.friendships that
-- creates a notification row on friend-request activity references a
-- notifications column named actor_id, but the notifications table's
-- actual column is sender_id. Since the trigger runs inside the same
-- transaction as the friendships insert/update, the whole request fails
-- and rolls back whenever this fires.
--
-- This patches the existing trigger function(s) in place (renaming the
-- bad column reference) instead of guessing at and re-authoring the
-- whole function from scratch.
DO $$
DECLARE
	trg RECORD;
	fn_src text;
	fixed_src text;
BEGIN
	FOR trg IN
		SELECT DISTINCT p.oid, p.proname
		FROM pg_trigger t
		JOIN pg_proc p ON p.oid = t.tgfoid
		WHERE t.tgrelid = 'public.friendships'::regclass
		  AND NOT t.tgisinternal
	LOOP
		SELECT pg_get_functiondef(trg.oid) INTO fn_src;

		IF fn_src LIKE '%notifications%' AND fn_src LIKE '%actor_id%' THEN
			fixed_src := replace(fn_src, 'actor_id', 'sender_id');
			EXECUTE fixed_src;
			RAISE NOTICE 'Patched trigger function % (actor_id -> sender_id)', trg.proname;
		END IF;
	END LOOP;
END $$;
