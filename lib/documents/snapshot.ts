import type { Tenant, Client, RegimeTva, TypeClient } from "@prisma/client";

// Copies figées de l'identité vendeur/acheteur au moment de l'émission d'un
// document. Un document déjà émis ne doit jamais changer de mentions
// légales, même si la fiche entreprise ou le client est modifié ensuite.

export type EmetteurSnapshot = {
  raisonSociale: string;
  formeJuridique: string | null;
  siret: string;
  siren: string | null;
  numeroTvaIntracom: string | null;
  regimeTva: RegimeTva;
  capitalSocial: string | null;
  adresseLigne1: string;
  adresseLigne2: string | null;
  codePostal: string;
  ville: string;
  pays: string;
  email: string | null;
  telephone: string | null;
  iban: string | null;
  bic: string | null;
  mentionsLegalesLibres: string | null;
  logoDataUrl: string | null;
};

export type ClientSnapshot = {
  type: TypeClient;
  raisonSociale: string | null;
  siret: string | null;
  numeroTvaIntracom: string | null;
  civilite: string | null;
  nom: string | null;
  prenom: string | null;
  adresseLigne1: string;
  adresseLigne2: string | null;
  codePostal: string;
  ville: string;
  pays: string;
  email: string | null;
  telephone: string | null;
};

export function buildEmetteurSnapshot(tenant: Tenant): EmetteurSnapshot {
  return {
    raisonSociale: tenant.raisonSociale,
    formeJuridique: tenant.formeJuridique,
    siret: tenant.siret,
    siren: tenant.siren,
    numeroTvaIntracom: tenant.numeroTvaIntracom,
    regimeTva: tenant.regimeTva,
    capitalSocial: tenant.capitalSocial ? tenant.capitalSocial.toString() : null,
    adresseLigne1: tenant.adresseLigne1,
    adresseLigne2: tenant.adresseLigne2,
    codePostal: tenant.codePostal,
    ville: tenant.ville,
    pays: tenant.pays,
    email: tenant.email,
    telephone: tenant.telephone,
    iban: tenant.iban,
    bic: tenant.bic,
    mentionsLegalesLibres: tenant.mentionsLegalesLibres,
    logoDataUrl: tenant.logoDataUrl,
  };
}

export function buildClientSnapshot(client: Client): ClientSnapshot {
  return {
    type: client.type,
    raisonSociale: client.raisonSociale,
    siret: client.siret,
    numeroTvaIntracom: client.numeroTvaIntracom,
    civilite: client.civilite,
    nom: client.nom,
    prenom: client.prenom,
    adresseLigne1: client.adresseLigne1,
    adresseLigne2: client.adresseLigne2,
    codePostal: client.codePostal,
    ville: client.ville,
    pays: client.pays,
    email: client.email,
    telephone: client.telephone,
  };
}

export function nomAffichageClientSnapshot(client: ClientSnapshot): string {
  if (client.type === "professionnel") {
    return client.raisonSociale ?? "—";
  }
  return [client.civilite, client.prenom, client.nom].filter(Boolean).join(" ") || "—";
}
