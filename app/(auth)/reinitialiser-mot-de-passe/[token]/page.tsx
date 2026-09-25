import { ReinitialiserForm } from "@/components/auth/reinitialiser-form";

export default async function ReinitialiserMotDePassePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <>
      <h1 className="font-titre text-3xl text-encre">Nouveau mot de passe</h1>
      <p className="mt-2 font-sans text-sm text-encre/70">
        Choisissez un nouveau mot de passe pour votre compte.
      </p>
      <ReinitialiserForm token={token} />
    </>
  );
}
