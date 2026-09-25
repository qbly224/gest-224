import { LoginForm } from "@/components/auth/login-form";

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ reinitialise?: string; compteSupprime?: string }>;
}) {
  const { reinitialise, compteSupprime } = await searchParams;

  return (
    <>
      <h1 className="font-titre text-3xl text-encre">Connexion</h1>
      <p className="mt-2 font-sans text-sm text-encre/70">
        Accédez à votre espace de gestion.
      </p>
      <LoginForm reinitialise={reinitialise === "1"} compteSupprime={compteSupprime === "1"} />
    </>
  );
}
