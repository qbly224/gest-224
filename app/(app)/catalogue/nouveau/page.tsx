import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createArticle } from "@/lib/actions/articles";
import { ArticleForm } from "@/components/articles/article-form";

export default async function NouvelArticlePage() {
  const session = await requireSession();
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.tenantId },
    select: { regimeTva: true },
  });

  return (
    <div>
      <h1 className="font-titre text-2xl text-encre">Nouvel article</h1>
      <ArticleForm action={createArticle} regimeTva={tenant.regimeTva} />
    </div>
  );
}
