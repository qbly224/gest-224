import { DemandeResetForm } from "@/components/auth/demande-reset-form";

export default function MotDePasseOubliePage() {
  return (
    <>
      <p className="mt-1 font-sans text-sm text-encre/70">Mot de passe oublié</p>
      <DemandeResetForm />
    </>
  );
}
