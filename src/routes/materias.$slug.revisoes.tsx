import { createFileRoute } from "@tanstack/react-router";

import { SubjectRevisoesPage } from "@/components/subject-revisoes-page";
import { getDisciplina } from "@/lib/disciplinas";
import { getSubjectStorageKeys } from "@/lib/subject-storage";

export const Route = createFileRoute("/materias/$slug/revisoes")({
  component: GenericRevisoes,
});

function GenericRevisoes() {
  const { slug } = Route.useParams();
  const disciplina = getDisciplina(slug)!;
  const storageKeys = getSubjectStorageKeys(slug);

  return (
    <SubjectRevisoesPage
      disciplineName={disciplina.nome}
      subjectSlug={slug}
      storageKey={storageKeys.revisoes}
    />
  );
}
