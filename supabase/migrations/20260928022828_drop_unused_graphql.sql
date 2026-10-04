-- L'API GraphQL (/graphql/v1) n'est utilisée par aucun client de ReelMark. Tant que pg_graphql
-- est installé, elle décrit à tout visiteur les tables lisibles par son rôle (advisors 0026 et
-- 0027), et la migration disable_public_graphql_endpoint (2026-07-05) n'a jamais pu la couper :
-- postgres n'est pas l'accordeur des droits sur graphql_public.graphql. Supprimer l'extension est
-- la méthode que documente Supabase ; `create extension pg_graphql with schema graphql` la
-- rétablit.
drop extension if exists pg_graphql;
