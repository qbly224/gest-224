"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { SidebarNav } from "@/components/app/sidebar-nav";
import { Toast } from "@/components/app/toast";

export function AppShell({
  raisonSociale,
  estAdminPlateforme,
  children,
}: {
  raisonSociale: string;
  estAdminPlateforme: boolean;
  children: React.ReactNode;
}) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar fixe — bureau uniquement. z-50 : passe au-dessus du bandeau
          cookies (z-40), sinon celui-ci masque le bas de la sidebar
          (bouton Déconnexion) tant qu'il n'a pas été fermé. */}
      <aside className="relative z-50 hidden w-64 shrink-0 border-r border-encre/15 bg-ivoire lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarNav raisonSociale={raisonSociale} estAdminPlateforme={estAdminPlateforme} />
        </div>
      </aside>

      {/* Tiroir mobile/tablette */}
      {ouvert && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOuvert(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-ivoire shadow-xl">
            <div className="flex shrink-0 items-center justify-end px-3 pt-3">
              <button
                type="button"
                onClick={() => setOuvert(false)}
                aria-label="Fermer le menu"
                className="rounded-sm p-1.5 text-encre hover:bg-encre/10"
              >
                <X size={20} />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <SidebarNav
                raisonSociale={raisonSociale}
                estAdminPlateforme={estAdminPlateforme}
                onNavigate={() => setOuvert(false)}
              />
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-encre/15 bg-ivoire px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setOuvert(true)}
            aria-label="Ouvrir le menu"
            className="rounded-sm p-1.5 text-encre hover:bg-encre/10"
          >
            <Menu size={22} />
          </button>
          <span className="flex-1 font-titre text-base text-encre">Gest-224</span>
          <Link
            href="/recherche"
            aria-label="Rechercher"
            className="rounded-sm p-1.5 text-encre hover:bg-encre/10"
          >
            <Search size={20} />
          </Link>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>

      <Suspense fallback={null}>
        <Toast />
      </Suspense>
    </div>
  );
}
