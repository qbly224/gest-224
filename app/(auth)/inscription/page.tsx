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
      <p className="mt-1 font-sans text-sm text-encre/70">
        Créer votre espace entreprise
      </p>
      <SignUpForm planInitial={planInitial} />
    </>
  );
}
