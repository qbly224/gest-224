"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { entrepriseSchema } from "@/lib/validation/entreprise";
import type { ActionState } from "@/lib/actions/types";

export async function updateEntreprise(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

  const parsed = entrepriseSchema.safeParse({
    raisonSociale: formData.get("raisonSociale"),
    formeJuridique: formData.get("formeJuridique") || undefined,
    siret: formData.get("siret"),
    siren: formData.get("siren") || undefined,
    numeroTvaIntracom: formData.get("numeroTvaIntracom") || undefined,
    regimeTva: formData.get("regimeTva"),
    capitalSocial: formData.get("capitalSocial") || undefined,
    adresseLigne1: formData.get("adresseLigne1"),
    adresseLigne2: formData.get("adresseLigne2") || undefined,
    codePostal: formData.get("codePostal"),
    ville: formData.get("ville"),
    pays: formData.get("pays"),
    email: formData.get("email") || undefined,
    telephone: formData.get("telephone") || undefined,
    iban: formData.get("iban") || undefined,
    bic: formData.get("bic") || undefined,
    mentionsLegalesLibres: formData.get("mentionsLegalesLibres") || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  try {
    await prisma.tenant.update({
      where: { id: session.tenantId },
      data: {
        raisonSociale: data.raisonSociale,
        formeJuridique: data.formeJuridique || null,
        siret: data.siret,
        siren: data.siren || null,
        numeroTvaIntracom: data.numeroTvaIntracom || null,
        regimeTva: data.regimeTva,
        capitalSocial: data.capitalSocial ?? null,
        adresseLigne1: data.adresseLigne1,
        adresseLigne2: data.adresseLigne2 || null,
        codePostal: data.codePostal,
        ville: data.ville,
        pays: data.pays,
        email: data.email || null,
        telephone: data.telephone || null,
        iban: data.iban || null,
        bic: data.bic || null,
        mentionsLegalesLibres: data.mentionsLegalesLibres || null,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { fieldErrors: { siret: ["Ce SIRET est déjà utilisé par une autre entreprise."] } };
    }
    throw err;
  }

  revalidatePath("/entreprise");
  return { success: true };
}
