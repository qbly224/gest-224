import { getTranslations } from "next-intl/server";

export async function PdfActions({
  documentId,
  numero,
  avecFacturX = false,
}: {
  documentId: string;
  numero: string;
  avecFacturX?: boolean;
}) {
  const t = await getTranslations("app.pdfActions");
  return (
    <>
      <a
        href={`/api/documents/${documentId}/pdf`}
        target="_blank"
        rel="noreferrer"
        className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
      >
        {t("voirPdf")}
      </a>
      <a
        href={`/api/documents/${documentId}/pdf?telecharger=1`}
        download={`${numero}.pdf`}
        className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
      >
        {t("telecharger")}
      </a>
      {avecFacturX && (
        <a
          href={`/api/documents/${documentId}/facturx`}
          download={`${numero}-facturx.pdf`}
          title={t("facturXAide")}
          className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
        >
          {t("telechargerFacturX")}
        </a>
      )}
    </>
  );
}
