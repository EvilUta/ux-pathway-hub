import { createFileRoute } from "@tanstack/react-router";
import { SubjectResumosPage } from "@/components/subject-resumos-page";
import { getDisciplina } from "@/lib/disciplinas";
import { getSubjectStorageKeys } from "@/lib/subject-storage";

export const Route = createFileRoute("/materias/concepcao-do-projeto/resumos")({
  component: Resumos,
});

function Resumos() {
  const disciplina = getDisciplina("concepcao-do-projeto")!;
  const storageKeys = getSubjectStorageKeys(disciplina.slug);

  return (
    <SubjectResumosPage
      disciplineName={disciplina.nome}
      subjectSlug={disciplina.slug}
      storageKey={storageKeys.resumos}
    />
  );
}
