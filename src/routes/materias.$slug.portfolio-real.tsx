import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { SubjectPortfolioRealPage } from "@/components/subject-portfolio-real-page";
import { getDisciplina } from "@/lib/disciplinas";
import { getSubjectStorageKeys } from "@/lib/subject-storage";

export const Route = createFileRoute("/materias/$slug/portfolio-real")({
  component: GenericPortfolioReal,
});

function GenericPortfolioReal() {
  const { slug } = Route.useParams();

  if (slug !== "portfolio") {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Esta área especial está disponível apenas na disciplina de Portfólio.
        </CardContent>
      </Card>
    );
  }

  const disciplina = getDisciplina(slug)!;
  const storageKeys = getSubjectStorageKeys(slug);

  return (
    <SubjectPortfolioRealPage
      disciplineName={disciplina.nome}
      subjectSlug={slug}
      storageKey={storageKeys.portfolioReal}
    />
  );
}
