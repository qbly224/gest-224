export function PdfActions({ documentId, numero }: { documentId: string; numero: string }) {
  return (
    <>
      <a
        href={`/api/documents/${documentId}/pdf`}
        target="_blank"
        rel="noreferrer"
        className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
      >
        Voir le PDF
      </a>
      <a
        href={`/api/documents/${documentId}/pdf?telecharger=1`}
        download={`${numero}.pdf`}
        className="rounded-sm border border-encre/30 px-4 py-2 font-sans text-sm text-encre hover:bg-encre/5"
      >
        Télécharger
      </a>
    </>
  );
}
