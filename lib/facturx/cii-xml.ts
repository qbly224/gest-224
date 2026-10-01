import type { Document, DocumentLigne } from "@prisma/client";
import type { EmetteurSnapshot, ClientSnapshot } from "@/lib/documents/snapshot";
import { calculerTotaux } from "@/lib/documents/calc";

/**
 * Génère le XML Cross Industry Invoice (CII, norme EN 16931 / UN/CEFACT
 * D16B) qui constitue la partie "donnée structurée" d'un fichier Factur-X.
 * Couvre les champs obligatoires du profil EN 16931 pour une facture simple
 * (vendeur, acheteur, lignes, TVA, totaux) — PAS les cas avancés (acomptes
 * déjà versés sur la facture, remises globales, multi-devises...). Voir
 * lib/facturx/embarquer.ts pour les limites de conformité PDF/A-3 associées.
 */

function echapperXml(valeur: string | null | undefined): string {
  if (!valeur) return "";
  return valeur
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDateCii(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function formatMontant(n: number): string {
  return n.toFixed(2);
}

const CODES_PAYS: Record<string, string> = {
  france: "FR",
  belgique: "BE",
  suisse: "CH",
  luxembourg: "LU",
  allemagne: "DE",
  espagne: "ES",
  italie: "IT",
  "guinée": "GN",
};

function codePays(pays: string): string {
  return CODES_PAYS[pays.trim().toLowerCase()] ?? "FR";
}

const CODE_TYPE_DOCUMENT: Record<string, string> = {
  facture: "380",
  facture_acompte: "380",
  facture_avoir: "381",
};

function partieTiers(
  snapshot: { raisonSociale: string | null; nom: string | null; prenom: string | null },
  siret: string | null,
  numeroTvaIntracom: string | null,
  adresseLigne1: string,
  codePostal: string,
  ville: string,
  pays: string
): string {
  const nom =
    snapshot.raisonSociale ??
    (`${snapshot.prenom ?? ""} ${snapshot.nom ?? ""}`.trim() || "Client");

  return `
      <ram:Name>${echapperXml(nom)}</ram:Name>
      ${
        siret
          ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${echapperXml(siret)}</ram:ID></ram:SpecifiedLegalOrganization>`
          : ""
      }
      <ram:PostalTradeAddress>
        <ram:PostcodeCode>${echapperXml(codePostal)}</ram:PostcodeCode>
        <ram:LineOne>${echapperXml(adresseLigne1)}</ram:LineOne>
        <ram:CityName>${echapperXml(ville)}</ram:CityName>
        <ram:CountryID>${codePays(pays)}</ram:CountryID>
      </ram:PostalTradeAddress>
      ${
        numeroTvaIntracom
          ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${echapperXml(numeroTvaIntracom)}</ram:ID></ram:SpecifiedTaxRegistration>`
          : ""
      }`;
}

export function genererCiiXml(
  document: Document & { lignes: DocumentLigne[] },
  emetteur: EmetteurSnapshot,
  client: ClientSnapshot
): string {
  const lignesCalc = document.lignes.map((l) => ({
    quantite: Number(l.quantite),
    prixUnitaireHt: Number(l.prixUnitaireHt),
    tauxTva: l.tauxTva !== null ? Number(l.tauxTva) : null,
    remisePourcentage: Number(l.remisePourcentage),
  }));
  const totaux = calculerTotaux(lignesCalc);
  const franchise = emetteur.regimeTva === "franchise";

  const lignesXml = document.lignes
    .map((l, index) => {
      const taux = l.tauxTva !== null ? Number(l.tauxTva) : null;
      return `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${index + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${echapperXml(l.designation)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${formatMontant(Number(l.prixUnitaireHt))}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">${Number(l.quantite)}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${franchise ? "E" : "S"}</ram:CategoryCode>
          ${!franchise && taux !== null ? `<ram:RateApplicablePercent>${taux}</ram:RateApplicablePercent>` : ""}
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${formatMontant(Number(l.montantHt))}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
    })
    .join("");

  const tvaXml = franchise
    ? `
    <ram:ApplicableTradeTax>
      <ram:CalculatedAmount>0.00</ram:CalculatedAmount>
      <ram:TypeCode>VAT</ram:TypeCode>
      <ram:ExemptionReason>TVA non applicable, art. 293 B du CGI</ram:ExemptionReason>
      <ram:BasisAmount>${formatMontant(totaux.montantHt)}</ram:BasisAmount>
      <ram:CategoryCode>E</ram:CategoryCode>
    </ram:ApplicableTradeTax>`
    : totaux.tvaParTaux
        .map(
          (t) => `
    <ram:ApplicableTradeTax>
      <ram:CalculatedAmount>${formatMontant(t.montantTva)}</ram:CalculatedAmount>
      <ram:TypeCode>VAT</ram:TypeCode>
      <ram:BasisAmount>${formatMontant(t.baseHt)}</ram:BasisAmount>
      <ram:CategoryCode>S</ram:CategoryCode>
      <ram:RateApplicablePercent>${t.taux}</ram:RateApplicablePercent>
    </ram:ApplicableTradeTax>`
        )
        .join("");

  const conditionsPaiementXml = `
    <ram:SpecifiedTradePaymentTerms>
      ${document.conditionsPaiement ? `<ram:Description>${echapperXml(document.conditionsPaiement)}</ram:Description>` : ""}
      ${
        document.dateEcheance
          ? `<ram:DueDateDateTime><udt:DateTimeString format="102">${formatDateCii(document.dateEcheance)}</udt:DateTimeString></ram:DueDateDateTime>`
          : ""
      }
    </ram:SpecifiedTradePaymentTerms>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${echapperXml(document.numero)}</ram:ID>
    <ram:TypeCode>${CODE_TYPE_DOCUMENT[document.type] ?? "380"}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${formatDateCii(document.dateEmission)}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>${lignesXml}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>${partieTiers(
        { raisonSociale: emetteur.raisonSociale, nom: null, prenom: null },
        emetteur.siret,
        emetteur.numeroTvaIntracom,
        emetteur.adresseLigne1,
        emetteur.codePostal,
        emetteur.ville,
        emetteur.pays
      )}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>${partieTiers(
        client,
        client.siret,
        client.numeroTvaIntracom,
        client.adresseLigne1,
        client.codePostal,
        client.ville,
        client.pays
      )}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>${conditionsPaiementXml}${tvaXml}
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${formatMontant(totaux.montantHt)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${formatMontant(totaux.montantHt)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${formatMontant(totaux.montantTva)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${formatMontant(totaux.montantTtc)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${formatMontant(totaux.montantTtc)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>
`;
}
