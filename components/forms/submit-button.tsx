"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  fullWidth = false,
  variant = "default",
}: {
  children: React.ReactNode;
  fullWidth?: boolean;
  variant?: "default" | "stamp";
}) {
  const { pending } = useFormStatus();

  if (variant === "stamp") {
    return (
      <button
        type="submit"
        disabled={pending}
        className={`group relative inline-flex -rotate-1 items-center justify-center gap-2 border-2 border-encre px-6 py-3 font-sans text-sm font-semibold uppercase tracking-[0.18em] text-encre transition-all duration-200 ease-out hover:rotate-0 hover:bg-encre hover:text-ivoire focus-visible:rotate-0 focus-visible:bg-encre focus-visible:text-ivoire focus-visible:outline-none active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${fullWidth ? "w-full" : ""}`}
      >
        <span>{pending ? "Enregistrement…" : children}</span>
        {!pending && (
          <span className="transition-transform duration-200 group-hover:translate-x-1">
            →
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-sm bg-encre px-5 py-2 font-sans text-sm font-medium text-ivoire transition-colors hover:bg-encre-light disabled:cursor-not-allowed disabled:opacity-60 ${fullWidth ? "w-full py-2.5" : ""}`}
    >
      {pending ? "Enregistrement..." : children}
    </button>
  );
}
