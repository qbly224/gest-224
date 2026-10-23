-- Infra de remplacement des 3 workflows GitHub Actions cassés (secrets
-- jamais configurés côté dépôt) par un déclenchement interne à Supabase.
--
-- Déjà appliquée en production via l'outil Supabase (apply_migration) -
-- ce fichier est une copie pour traçabilité dans le dépôt, pas à rejouer
-- tel quel.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Bucket de stockage pour la sauvegarde JSON quotidienne (plan Supabase
-- gratuit = pas de pg_dump/PITR natif).
insert into storage.buckets (id, name, public)
values ('backups', 'backups', false)
on conflict (id) do nothing;

-- Utilisée par l'edge function sauvegarde-base pour énumérer les tables
-- à exporter sans avoir à les coder en dur.
create or replace function public.lister_tables_public()
returns table (table_name text)
language sql
security definer
set search_path = public
as $$
  select tablename::text
  from pg_tables
  where schemaname = 'public'
  order by tablename;
$$;
