"use client";

export function BoutonSupprimer({
  label = "Supprimer",
  confirmMessage,
}: {
  label?: string;
  confirmMessage: string;
}) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
      className="font-sans text-xs text-encre/60 hover:text-encre hover:underline"
    >
      {label}
    </button>
  );
}
