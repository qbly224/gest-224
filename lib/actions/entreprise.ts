"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { entrepriseSchema } from "@/lib/validation/entreprise";
import type { ActionState } from "@/lib/actions/types";

const TYPES_LOGO_AUTORISES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);
const TAILLE_LOGO_MAX_OCTETS = 500 * 1024;

async function resoudreLogoDataUrl(
  formData: FormData
): Promise<{ ok: true; value: string | null | undefined } | { ok: false; error: string }> {
  if (formData.get("supprimerLogo") === "on") {
    return { ok: true, value: null };
  }

  const fichier = formData.get("logo");
  if (!(fichier instanceof File) || fichier.size === 0) {
    // Aucun nouveau fichier envoyé : on laisse le logo existant inchangé.
    return { ok: true, value: undefined };
  }

  if (!TYPES_LOGO_AUTORISES.has(fichier.type)) {
    return { ok: false, error: "Format de logo non supporté (PNG, JPEG, WebP ou SVG uniquement)." };
  }
  if (fichier.size > TAILLE_LOGO_MAX_OCTETS) {
    return { ok: false, error: "Le logo dépasse la taille maximale de 500 Ko." };
  }

  const buffer = Buffer.from(await fichier.arrayBuffer());
  return { ok: true, value: `data:${fichier.type};base64,${buffer.toString("base64")}` };
}

export async function updateEntreprise(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

  const logo = await resoudreLogoDataUrl(formData);
  if (!logo.ok) {
    return { error: logo.error };
  }

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
        ...(logo.value !== undefined ? { logoDataUrl: logo.value } : {}),
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
