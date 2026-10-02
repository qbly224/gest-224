import "server-only";
import { PDFDocument, AFRelationship } from "pdf-lib";

/**
 * Embarque le XML Cross Industry Invoice dans un PDF existant, au format
 * attendu par Factur-X/ZUGFeRD (pièce jointe nommée "factur-x.xml",
 * AFRelationship "Data").
 *
 * ATTENTION - fondation technique, pas une conformité Factur-X complète :
 * un fichier Factur-X valide doit être un PDF/A-3 strict (profil colorimétrique
 * ICC embarqué, police intégrées, paquet de métadonnées XMP déclarant
 * fx:ConformanceLevel et fx:DocumentType). pdf-lib ne garantit pas la
 * conformité PDF/A du PDF produit par Puppeteer en amont. Avant tout envoi
 * réel via une Plateforme de Dématérialisation Partenaire ou le Portail
 * Public de Facturation, ce fichier doit être validé par un outil dédié
 * (ex. Mustang Project, veraPDF) et, si besoin, régénéré avec un moteur PDF/A
 * conforme.
 */
export async function embarquerXmlDansPdf(pdfBuffer: Buffer, xml: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  await pdfDoc.attach(Buffer.from(xml, "utf-8"), "factur-x.xml", {
    mimeType: "application/xml",
    description: "Facture électronique structurée (Factur-X, profil EN 16931)",
    afRelationship: AFRelationship.Data,
    creationDate: new Date(),
    modificationDate: new Date(),
  });

  const octets = await pdfDoc.save();
  return Buffer.from(octets);
}
