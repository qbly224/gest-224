import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateArticle } from "@/lib/actions/articles";
import { ArticleForm } from "@/components/articles/article-form";

export default async function ModifierArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const [article, tenant] = await Promise.all([
    prisma.article.findFirst({ where: { id, tenantId: session.tenantId } }),
    prisma.tenant.findUniqueOrThrow({
      where: { id: session.tenantId },
      select: { regimeTva: true },
    }),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">Modifier l&apos;article</h1>
      <ArticleForm
        article={{
          ...article,
          prixUnitaireHt: article.prixUnitaireHt.toString(),
          tauxTva: article.tauxTva ? article.tauxTva.toString() : null,
        }}
        regimeTva={tenant.regimeTva}
        action={updateArticle.bind(null, article.id)}
      />
    </div>
  );
}
