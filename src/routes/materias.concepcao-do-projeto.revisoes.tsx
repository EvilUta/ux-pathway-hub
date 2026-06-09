import { createFileRoute } from "@tanstack/react-router";
import { SubjectRevisoesPage } from "@/components/subject-revisoes-page";
import { getDisciplina } from "@/lib/disciplinas";
import { getSubjectStorageKeys } from "@/lib/subject-storage";

export const Route = createFileRoute("/materias/concepcao-do-projeto/revisoes")({
  component: Revisoes,
});

function Revisoes() {
  const disciplina = getDisciplina("concepcao-do-projeto")!;
  const storageKeys = getSubjectStorageKeys(disciplina.slug);

  return (
    <SubjectRevisoesPage
      disciplineName={disciplina.nome}
      subjectSlug={disciplina.slug}
      storageKey={storageKeys.revisoes}
    />
  );
}
