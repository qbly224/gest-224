"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
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
  Repeat,
  HardHat,
  FolderOpen,
  ChevronDown,
} from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { LocaleSwitcher } from "@/components/app/locale-switcher";

const DOCUMENT_LINKS = [
  { href: "/devis", cle: "devis", Icon: FileText },
  { href: "/bons-commande", cle: "bonsCommande", Icon: ShoppingCart },
  { href: "/bons-livraison", cle: "bonsLivraison", Icon: Truck },
  { href: "/factures", cle: "factures", Icon: Receipt },
  { href: "/factures-acompte", cle: "acomptes", Icon: CreditCard },
  { href: "/avoirs", cle: "avoirs", Icon: Undo2 },
  { href: "/factures-recurrentes", cle: "facturesRecurrentes", Icon: Repeat },
] as const;

const AVANT_DOCUMENTS = [
  { href: "/tableau-de-bord", cle: "tableauDeBord", Icon: LayoutDashboard },
  { href: "/chantiers", cle: "chantiers", Icon: HardHat },
] as const;

const APRES_DOCUMENTS = [
  { href: "/clients", cle: "clients", Icon: Users },
  { href: "/depenses", cle: "depenses", Icon: Wallet },
  { href: "/catalogue", cle: "catalogue", Icon: Package },
  { href: "/rapport", cle: "rapport", Icon: BarChart3 },
  { href: "/entreprise", cle: "entreprise", Icon: Building2 },
  { href: "/abonnement", cle: "abonnement", Icon: Star },
] as const;

export function SidebarNav({
  raisonSociale,
  estAdminPlateforme,
  onNavigate,
}: {
  raisonSociale: string;
  estAdminPlateforme: boolean;
  onNavigate?: () => void;
}) {
  const t = useTranslations("shell");
  const pathname = usePathname();

  const surUnDocument = DOCUMENT_LINKS.some((l) => pathname.startsWith(l.href));
  const [documentsOuvert, setDocumentsOuvert] = useState(surUnDocument);

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
            placeholder={t("rechercher")}
            className="w-full rounded-sm border border-encre/20 bg-white/60 py-1.5 pl-8 pr-2 font-sans text-sm text-encre placeholder:text-encre/40 focus:border-encre focus:outline-none"
          />
        </label>
      </form>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {AVANT_DOCUMENTS.map(({ href, cle, Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-sm px-3 py-2 font-sans text-sm text-encre/80 hover:bg-encre/10 hover:text-encre"
          >
            <Icon size={17} strokeWidth={1.75} className="shrink-0 text-encre/60" />
            {t(`nav.${cle}`)}
          </Link>
        ))}

        <button
          type="button"
          onClick={() => setDocumentsOuvert((v) => !v)}
          aria-expanded={documentsOuvert}
          className={`flex w-full items-center gap-3 rounded-sm px-3 py-2 font-sans text-sm hover:bg-encre/10 ${
            surUnDocument ? "font-medium text-encre" : "text-encre/80 hover:text-encre"
          }`}
        >
          <FolderOpen size={17} strokeWidth={1.75} className="shrink-0 text-encre/60" />
          <span className="flex-1 text-left">{t("nav.documents")}</span>
          <ChevronDown
            size={15}
            strokeWidth={1.75}
            className={`shrink-0 text-encre/50 transition-transform ${documentsOuvert ? "rotate-180" : ""}`}
          />
        </button>
        {documentsOuvert && (
          <div className="ml-4 space-y-0.5 border-l border-encre/15 pl-3">
            {DOCUMENT_LINKS.map(({ href, cle, Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className="flex items-center gap-3 rounded-sm px-3 py-1.5 font-sans text-sm text-encre/80 hover:bg-encre/10 hover:text-encre"
              >
                <Icon size={16} strokeWidth={1.75} className="shrink-0 text-encre/60" />
                {t(`nav.${cle}`)}
              </Link>
            ))}
          </div>
        )}

        {APRES_DOCUMENTS.map(({ href, cle, Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-sm px-3 py-2 font-sans text-sm text-encre/80 hover:bg-encre/10 hover:text-encre"
          >
            <Icon size={17} strokeWidth={1.75} className="shrink-0 text-encre/60" />
            {t(`nav.${cle}`)}
          </Link>
        ))}

        {estAdminPlateforme && (
          <Link
            href="/admin"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-sm px-3 py-2 font-sans text-sm font-medium text-encre hover:bg-encre/10"
          >
            <ShieldCheck size={17} strokeWidth={1.75} className="shrink-0 text-encre" />
            {t("admin")}
          </Link>
        )}
      </nav>

      <div className="flex items-center justify-between border-t border-encre/15 px-5 py-3">
        <LocaleSwitcher />
      </div>

      <form action={signOut} className="border-t border-encre/15 px-3 py-4">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-sm px-3 py-2 font-sans text-sm text-encre/80 hover:bg-encre/10 hover:text-encre"
        >
          <LogOut size={17} strokeWidth={1.75} className="shrink-0 text-encre/60" />
          {t("deconnexion")}
        </button>
      </form>
    </div>
  );
}
