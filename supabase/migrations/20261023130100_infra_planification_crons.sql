-- Planification des 3 tâches, exécutées depuis Supabase (pg_cron + pg_net)
-- au lieu de GitHub Actions. Les deux appels vers gest-224.onrender.com
-- réutilisent le CRON_SECRET déjà configuré sur Render (même valeur que
-- la variable d'environnement CRON_SECRET du service web) ; la sauvegarde
-- appelle l'edge function sauvegarde-base avec la clé anon du projet
-- (authentification standard verify_jwt des edge functions).
--
-- Déjà appliquée en production via l'outil Supabase (apply_migration), avec
-- les vraies valeurs de secret - jamais commitées ici. Ce fichier est une
-- copie pour traçabilité, avec des placeholders à la place des secrets ;
-- ne pas rejouer tel quel sans les remplacer.

select cron.schedule(
  'gest224-factures-recurrentes',
  '0 6 * * *',
  $$
  select net.http_get(
    url := 'https://gest-224.onrender.com/api/cron/factures-recurrentes',
    headers := jsonb_build_object('x-cron-secret', '<CRON_SECRET_RENDER>')
  );
  $$
);

select cron.schedule(
  'gest224-relances-factures',
  '0 7 * * *',
  $$
  select net.http_get(
    url := 'https://gest-224.onrender.com/api/cron/relances',
    headers := jsonb_build_object('x-cron-secret', '<CRON_SECRET_RENDER>')
  );
  $$
);

select cron.schedule(
  'gest224-sauvegarde-base',
  '0 3 * * *',
  $$
  select net.http_post(
    url := 'https://tjlxwuzwmepvbjkzugyu.supabase.co/functions/v1/sauvegarde-base',
    headers := jsonb_build_object('Authorization', 'Bearer <SUPABASE_ANON_KEY>')
  );
  $$
);
