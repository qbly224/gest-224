import { SignUpForm } from "@/components/auth/signup-form";

export default function InscriptionPage() {
  return (
    <>
      <p className="mt-1 font-sans text-sm text-encre/70">
        Créer votre espace entreprise
      </p>
      <SignUpForm />
    </>
  );
}
