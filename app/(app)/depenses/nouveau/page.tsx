import { createDepense } from "@/lib/actions/comptabilite";
import { DepenseForm } from "@/components/comptabilite/depense-form";

export default function NouvelleDepensePage() {
  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">Nouvelle dépense</h1>
      <DepenseForm action={createDepense} />
    </div>
  );
}
