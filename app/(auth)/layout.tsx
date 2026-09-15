export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-sm border border-encre/20 bg-white/40 p-8 shadow-sm">
        <h1 className="font-titre text-2xl text-encre">Gest-224</h1>
        {children}
      </div>
    </main>
  );
}
