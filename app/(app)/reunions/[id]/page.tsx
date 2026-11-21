import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  updateReunion,
  supprimerReunion,
  synchroniserParticipants,
  enregistrerPresences,
  publierCompteRendu,
} from "@/lib/actions/reunions";
import { ReunionForm } from "@/components/reunions/reunion-form";
import { BoutonSupprimer } from "@/components/forms/bouton-supprimer";
import { SubmitButton } from "@/components/forms/submit-button";

export default async function ModifierReunionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const t = await getTranslations("app.reunions");

  const [reunion, membres] = await Promise.all([
    prisma.reunion.findFirst({
      where: { id, tenantId: session.tenantId },
      include: { participants: { include: { membre: true } } },
    }),
    prisma.membre.findMany({
      where: { tenantId: session.tenantId, actif: true },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      select: { id: true, prenom: true, nom: true },
    }),
  ]);

  if (!reunion) {
    notFound();
  }

  const idsParticipants = new Set(reunion.participants.map((p) => p.membreId));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">{t("modifierTitre")}</h1>
        <form action={supprimerReunion.bind(null, reunion.id)}>
          <BoutonSupprimer confirmMessage={t("confirmSuppression")} />
        </form>
      </div>
      <ReunionForm reunion={reunion} action={updateReunion.bind(null, reunion.id)} />

      <div className="mt-10 rounded-sm border border-encre/15 bg-white/50 p-4">
        <h2 className="font-titre text-base text-encre">{t("participants")}</h2>
        <p className="mt-1 font-sans text-sm text-encre/70">{t("participantsDescription")}</p>
        <form action={synchroniserParticipants.bind(null, reunion.id)} className="mt-4 space-y-2">
          {membres.length === 0 ? (
            <p className="font-sans text-sm text-encre/60">{t("aucunMembre")}</p>
          ) : (
            membres.map((m) => (
              <label key={m.id} className="flex items-center gap-2 font-sans text-sm text-encre">
                <input
                  type="checkbox"
                  name="membreIds"
                  value={m.id}
                  defaultChecked={idsParticipants.has(m.id)}
                />
                {m.prenom} {m.nom}
              </label>
            ))
          )}
          {membres.length > 0 && <SubmitButton>{t("enregistrerParticipants")}</SubmitButton>}
        </form>
      </div>

      {reunion.participants.length > 0 && (
        <div className="mt-6 rounded-sm border border-encre/15 bg-white/50 p-4">
          <h2 className="font-titre text-base text-encre">{t("presences")}</h2>
          <form action={enregistrerPresences.bind(null, reunion.id)} className="mt-4 space-y-2">
            {reunion.participants.map((p) => (
              <label key={p.id} className="flex items-center gap-2 font-sans text-sm text-encre">
                <input
                  type="checkbox"
                  name="presentParticipantIds"
                  value={p.id}
                  defaultChecked={p.present}
                />
                {p.membre.prenom} {p.membre.nom}
              </label>
            ))}
            <SubmitButton>{t("enregistrerPresences")}</SubmitButton>
          </form>
        </div>
      )}

      <div className="mt-6 rounded-sm border border-encre/15 bg-white/50 p-4">
        <h2 className="font-titre text-base text-encre">{t("compteRenduPublication")}</h2>
        {reunion.compteRenduPublieA ? (
          <p className="mt-2 font-sans text-sm text-encre/70">{t("compteRenduDejaPublie")}</p>
        ) : reunion.compteRendu ? (
          <>
            <p className="mt-1 font-sans text-sm text-encre/70">{t("compteRenduDescription")}</p>
            <form action={publierCompteRendu.bind(null, reunion.id)} className="mt-4">
              <SubmitButton>{t("publierCompteRendu")}</SubmitButton>
            </form>
          </>
        ) : (
          <p className="mt-2 font-sans text-sm text-encre/60">{t("compteRenduManquant")}</p>
        )}
      </div>
    </div>
  );
}
