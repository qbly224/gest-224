import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app/nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.tenantId },
    select: { raisonSociale: true },
  });

  return (
    <div className="min-h-screen">
      <AppNav raisonSociale={tenant.raisonSociale} />
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
