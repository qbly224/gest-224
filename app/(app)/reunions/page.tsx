import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { requireSession } from "@/lib/auth";
import { exigerAcces } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/config";

export default async function ReunionsPage() {
  const session = await requireSession();
  exigerAcces(session.role, "reunions");
  const t = await getTranslations("app.reunions");
  const locale = (await getLocale()) as Locale;

  const reunions = await prisma.reunion.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { date: "desc" },
    include: { _count: { select: { participants: true } } },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl text-encre">{t("titre")}</h1>
        <Link
          href="/reunions/nouveau"
          className="rounded-sm bg-encre px-4 py-2 font-sans text-sm font-medium text-ivoire hover:bg-encre-light"
        >
          {t("nouveauBouton")}
        </Link>
      </div>

      {reunions.length === 0 ? (
        <p className="mt-8 font-sans text-sm text-encre/75">{t("emptyDefault")}</p>
      ) : (
        <ul className="mt-6 divide-y divide-encre/10">
          {reunions.map((reunion) => (
            <li key={reunion.id} className="py-4">
              <Link
                href={`/reunions/${reunion.id}`}
                className="font-titre text-base text-encre hover:underline"
              >
                {reunion.titre}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-xs text-encre/70">
                <span className="font-mono">
                  {formatDate(reunion.date, locale, { dateStyle: "long", timeStyle: "short" })}
                </span>
                {reunion.lieu && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={13} strokeWidth={1.75} />
                    {reunion.lieu}
                  </span>
                )}
                {reunion._count.participants > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Users size={13} strokeWidth={1.75} />
                    {t("nbParticipants", { count: reunion._count.participants })}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
