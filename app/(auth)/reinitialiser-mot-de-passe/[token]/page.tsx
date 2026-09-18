import { ReinitialiserForm } from "@/components/auth/reinitialiser-form";

export default async function ReinitialiserMotDePassePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <>
      <p className="mt-1 font-sans text-sm text-encre/70">
        Choisir un nouveau mot de passe
      </p>
      <ReinitialiserForm token={token} />
    </>
  );
}
