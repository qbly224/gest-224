export function LegalPage({
  titre,
  misAJour,
  children,
}: {
  titre: string;
  misAJour: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-titre text-3xl text-encre">{titre}</h1>
      <p className="mt-2 font-mono text-xs text-encre/50">Dernière mise à jour : {misAJour}</p>
      <div className="prose-legal mt-8 space-y-6 font-sans text-sm leading-relaxed text-encre/80">
        {children}
      </div>
    </main>
  );
}

export function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-titre text-lg text-encre">{titre}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}
