"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  fullWidth = false,
}: {
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  const { pending } = useFormStatus();
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
