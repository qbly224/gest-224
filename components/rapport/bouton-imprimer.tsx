"use client";

import { useTranslations } from "next-intl";

export function BoutonImprimer() {
  const t = useTranslations("app.rapport");
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5 print:hidden"
    >
      {t("imprimer")}
    </button>
  );
}
