import Link from "next/link";
import {
  LayoutDashboard,
  Search,
  FileText,
  ShoppingCart,
  Truck,
  Receipt,
  CreditCard,
  Undo2,
  Wallet,
  BarChart3,
  Users,
  Package,
  Building2,
  Star,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { signOut } from "@/lib/actions/auth";

const links = [
  { href: "/tableau-de-bord", label: "Tableau de bord", Icon: LayoutDashboard },
  { href: "/devis", label: "Devis", Icon: FileText },
  { href: "/bons-commande", label: "Bons de commande", Icon: ShoppingCart },
  { href: "/bons-livraison", label: "Bons de livraison", Icon: Truck },
  { href: "/factures", label: "Factures", Icon: Receipt },
  { href: "/factures-acompte", label: "Acomptes", Icon: CreditCard },
  { href: "/avoirs", label: "Avoirs", Icon: Undo2 },
  { href: "/depenses", label: "Dépenses", Icon: Wallet },
  { href: "/rapport", label: "Rapport", Icon: BarChart3 },
  { href: "/clients", label: "Clients", Icon: Users },
  { href: "/catalogue", label: "Catalogue", Icon: Package },
  { href: "/entreprise", label: "Entreprise", Icon: Building2 },
  { href: "/abonnement", label: "Abonnement", Icon: Star },
];

export function SidebarNav({
  raisonSociale,
  estAdminPlateforme,
  onNavigate,
}: {
  raisonSociale: string;
  estAdminPlateforme: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-encre/15 px-5 py-5">
        <span className="font-titre text-lg text-encre">Gest-224</span>
        <p className="mt-0.5 truncate font-mono text-xs text-encre/60">{raisonSociale}</p>
      </div>

      <form action="/recherche" className="border-b border-encre/15 px-3 py-3">
        <label className="relative block">
          <Search
            size={15}
            strokeWidth={1.75}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-encre/40"
          />
          <input
            type="search"
            name="q"
            placeholder="Rechercher…"
            className="w-full rounded-sm border border-encre/20 bg-white/60 py-1.5 pl-8 pr-2 font-sans text-sm text-encre placeholder:text-encre/40 focus:border-encre focus:outline-none"
          />
        </label>
      </form>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {links.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-sm px-3 py-2 font-sans text-sm text-encre/80 hover:bg-encre/10 hover:text-encre"
          >
            <Icon size={17} strokeWidth={1.75} className="shrink-0 text-encre/60" />
            {label}
          </Link>
        ))}
        {estAdminPlateforme && (
          <Link
            href="/admin"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-sm px-3 py-2 font-sans text-sm font-medium text-encre hover:bg-encre/10"
          >
            <ShieldCheck size={17} strokeWidth={1.75} className="shrink-0 text-encre" />
            Admin
          </Link>
        )}
      </nav>

      <form action={signOut} className="border-t border-encre/15 px-3 py-4">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-sm px-3 py-2 font-sans text-sm text-encre/80 hover:bg-encre/10 hover:text-encre"
        >
          <LogOut size={17} strokeWidth={1.75} className="shrink-0 text-encre/60" />
          Déconnexion
        </button>
      </form>
    </div>
  );
}
