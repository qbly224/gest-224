import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { withToast } from "@/lib/toast";
import { toggleActifMembreEquipe, renvoyerInvitation } from "@/lib/actions/equipe";
import { InviteForm } from "@/components/equipe/invite-form";
import { RoleSelect } from "@/components/equipe/role-select";

export default async function EquipePage() {
  const session = await requireSession();
  if (session.role !== "owner") {
    redirect(withToast("/tableau-de-bord", "Seul le titulaire du compte peut gérer l'équipe."));
  }
  const t = await getTranslations("app.equipe");

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.tenantId },
    select: { typeCompte: true },
  });

  const utilisateurs = await prisma.user.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ role: "asc" }, { nom: "asc" }],
    select: { id: true, nom: true, prenom: true, email: true, role: true, actif: true, lastLoginAt: true },
  });

  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
      <p className="mt-1 font-sans text-sm text-encre/70">{t("description")}</p>

      <div className="mt-6 overflow-x-auto rounded-sm border border-encre/15">
        <table className="w-full font-sans text-sm">
          <thead className="bg-encre/5 text-left text-xs uppercase tracking-wide text-encre/70">
            <tr>
              <th className="px-3 py-2">{t("colNom")}</th>
              <th className="px-3 py-2">{t("colEmail")}</th>
              <th className="px-3 py-2">{t("colRole")}</th>
              <th className="px-3 py-2">{t("colStatut")}</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {utilisateurs.map((u) => (
              <tr key={u.id} className="border-t border-encre/10">
                <td className="px-3 py-2">
                  {u.prenom} {u.nom}
                  {u.id === session.userId && (
                    <span className="ml-1 font-mono text-xs text-encre/50">({t("vousMeme")})</span>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{u.email}</td>
                <td className="px-3 py-2">
                  {u.role === "owner" ? (
                    <span className="font-medium">{t("roles.owner")}</span>
                  ) : (
                    <RoleSelect userId={u.id} roleActuel={u.role} typeCompte={tenant.typeCompte} />
                  )}
                </td>
                <td className="px-3 py-2">
                  {!u.actif ? (
                    <span className="text-red-700">{t("desactive")}</span>
                  ) : u.lastLoginAt ? (
                    <span className="text-encre/70">{t("actif")}</span>
                  ) : (
                    <span className="text-encre/70">{t("invitationEnAttente")}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {u.role !== "owner" && (
                    <div className="flex justify-end gap-2">
                      {!u.lastLoginAt && u.actif && (
                        <form action={renvoyerInvitation.bind(null, u.id)}>
                          <button type="submit" className="font-sans text-xs text-encre underline">
                            {t("renvoyerInvitation")}
                          </button>
                        </form>
                      )}
                      <form action={toggleActifMembreEquipe.bind(null, u.id)}>
                        <button type="submit" className="font-sans text-xs text-encre underline">
                          {u.actif ? t("desactiver") : t("reactiver")}
                        </button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <InviteForm typeCompte={tenant.typeCompte} />
      </div>
    </div>
  );
}
