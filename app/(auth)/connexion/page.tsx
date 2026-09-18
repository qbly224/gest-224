import { LoginForm } from "@/components/auth/login-form";

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ reinitialise?: string }>;
}) {
  const { reinitialise } = await searchParams;

  return (
    <>
      <p className="mt-1 font-sans text-sm text-encre/70">Connexion</p>
      <LoginForm reinitialise={reinitialise === "1"} />
    </>
  );
}
