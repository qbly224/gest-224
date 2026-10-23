import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Sauvegarde logique quotidienne : exporte chaque table du schema public
// en JSON et le dépose dans le bucket de stockage "backups". Le projet
// Supabase est sur le plan gratuit (pas de sauvegarde automatique ni de
// PITR), ce qui comble ce manque sans dépendre d'un secret GitHub Actions
// (le projet utilisait pg_dump via GitHub Actions auparavant, mais le
// secret DATABASE_URL n'a jamais été configuré côté dépôt).
//
// Ce n'est pas un pg_dump binaire : c'est un export JSON ligne par ligne,
// suffisant pour reconstruire les données mais pas pour un pg_restore
// direct. Pour restaurer une table : télécharger le fichier JSON depuis
// le bucket "backups", puis réinsérer son contenu table par table (ex.
// via un script qui appelle supabase.from(table).insert(lignes)).
//
// Planifiée via pg_cron + pg_net (job "gest224-sauvegarde-base", tous les
// jours à 3h UTC) - voir la migration infra_planification_crons. Appelée
// avec la clé anon du projet en Authorization (authentification standard
// verify_jwt des edge functions) ; les droits d'accès complets aux tables
// viennent de SUPABASE_SERVICE_ROLE_KEY, injectée automatiquement par
// Supabase dans l'environnement de la fonction.

Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: tables, error: erreurTables } = await supabase
      .rpc("lister_tables_public");
    if (erreurTables) throw erreurTables;

    const dump: Record<string, unknown[]> = {};
    for (const { table_name } of tables as { table_name: string }[]) {
      const { data, error } = await supabase.from(table_name).select("*");
      if (error) throw error;
      dump[table_name] = data ?? [];
    }

    const horodatage = new Date().toISOString().replace(/[:.]/g, "-");
    const chemin = `gest224-${horodatage}.json`;
    const contenu = JSON.stringify(dump, null, 0);

    const { error: erreurUpload } = await supabase.storage
      .from("backups")
      .upload(chemin, new Blob([contenu], { type: "application/json" }), {
        contentType: "application/json",
      });
    if (erreurUpload) throw erreurUpload;

    return new Response(
      JSON.stringify({ ok: true, fichier: chemin, tables: Object.keys(dump).length }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (erreur) {
    return new Response(
      JSON.stringify({ ok: false, erreur: String(erreur) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
