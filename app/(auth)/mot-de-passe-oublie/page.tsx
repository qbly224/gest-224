import { DemandeResetForm } from "@/components/auth/demande-reset-form";

export default function MotDePasseOubliePage() {
  return (
    <>
      <h1 className="font-titre text-3xl text-encre">Mot de passe oublié</h1>
      <p className="mt-2 font-sans text-sm text-encre/70">
        Indiquez votre email, nous vous enverrons un lien de réinitialisation.
      </p>
      <DemandeResetForm />
    </>
  );
}
