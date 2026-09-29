import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EntrepriseForm } from "@/components/entreprise/entreprise-form";
import { SupprimerCompteForm } from "@/components/entreprise/supprimer-compte-form";
import { basculerRelancesActivees } from "@/lib/actions/entreprise";

export default async function EntreprisePage() {
  const session = await requireSession();
  const t = await getTranslations("app.entreprise");
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.tenantId },
  });

  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
      <p className="mt-1 font-sans text-sm text-encre/70">{t("description")}</p>
      <EntrepriseForm
        tenant={{
          ...tenant,
          capitalSocial: tenant.capitalSocial ? tenant.capitalSocial.toString() : null,
        }}
      />

      <div className="mt-12 rounded-sm border border-encre/20 bg-white/40 p-6">
        <h2 className="font-titre text-lg text-encre">{t("relancesTitre")}</h2>
        <p className="mt-1 font-sans text-sm text-encre/70">{t("relancesDescription")}</p>
        <form action={basculerRelancesActivees} className="mt-4">
          <button
            type="submit"
            className={`rounded-sm border px-4 py-2 font-sans text-sm ${
              tenant.relancesActivees
                ? "border-encre/30 text-encre hover:bg-encre/5"
                : "border-encre bg-encre text-ivoire hover:bg-encre-light"
            }`}
          >
            {tenant.relancesActivees ? t("relancesDesactiver") : t("relancesActiver")}
          </button>
        </form>
      </div>

      <div className="mt-8 rounded-sm border border-red-200 bg-red-50/40 p-6">
        <h2 className="font-titre text-lg text-red-800">{t("zoneDangereuse")}</h2>
        <p className="mt-1 font-sans text-sm text-red-700/80">
          {t("zoneDangereuseDescription")}
        </p>
        <SupprimerCompteForm />
      </div>
    </div>
  );
}
