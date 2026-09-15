import { createClient } from "@/lib/actions/clients";
import { ClientForm } from "@/components/clients/client-form";

export default function NouveauClientPage() {
  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">Nouveau client</h1>
      <ClientForm action={createClient} />
    </div>
  );
}
