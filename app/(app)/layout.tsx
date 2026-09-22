import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const [tenant, utilisateur] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({
      where: { id: session.tenantId },
      select: { raisonSociale: true },
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: { estAdminPlateforme: true },
    }),
  ]);

  return (
    <AppShell raisonSociale={tenant.raisonSociale} estAdminPlateforme={utilisateur.estAdminPlateforme}>
      {children}
    </AppShell>
  );
}
