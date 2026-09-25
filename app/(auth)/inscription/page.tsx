import { SignUpForm } from "@/components/auth/signup-form";
import { estPlanValide } from "@/lib/plans";

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const planInitial = plan && estPlanValide(plan) ? plan : "gratuit";

  return (
    <>
      <h1 className="font-titre text-3xl text-encre">Créer votre espace</h1>
      <p className="mt-2 font-sans text-sm text-encre/70">
        Quelques informations sur votre entreprise pour commencer.
      </p>
      <SignUpForm planInitial={planInitial} />
    </>
  );
}
