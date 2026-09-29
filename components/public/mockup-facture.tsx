/**
 * Aperçu stylisé d'une facture (pas une vraie capture d'écran) : évite le
 * cliché de l'illustration stock, tout en vendant concrètement le produit.
 * Légère rotation au repos, qui se redresse doucement au survol.
 */
export function MockupFacture() {
  return (
    <div className="[perspective:1200px]">
      <div
        className="mx-auto w-64 -rotate-3 rounded-sm border border-encre/15 bg-surface p-5 shadow-2xl shadow-encre/20 transition-transform duration-500 ease-out hover:rotate-0 hover:-translate-y-1 sm:w-72"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-titre text-sm text-encre">Gest-224</p>
            <p className="mt-0.5 font-mono text-[10px] text-encre/50">FACTURE N° FA-2026-0142</p>
          </div>
          <div className="rounded-full border border-encre/30 px-2 py-1 font-mono text-[9px] uppercase tracking-wide text-encre/60">
            Payée
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {[
            ["Prestation de conseil", "450,00 €"],
            ["Fournitures", "120,00 €"],
            ["Livraison", "35,00 €"],
          ].map(([label, montant]) => (
            <div key={label} className="flex items-center justify-between border-b border-encre/10 pb-1.5">
              <span className="font-sans text-[11px] text-encre/70">{label}</span>
              <span className="font-mono text-[11px] text-encre/70">{montant}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-sm bg-encre/5 px-3 py-2">
          <span className="font-sans text-xs font-medium text-encre">Total TTC</span>
          <span className="font-mono text-sm font-medium text-encre">605,00 €</span>
        </div>
      </div>
    </div>
  );
}
