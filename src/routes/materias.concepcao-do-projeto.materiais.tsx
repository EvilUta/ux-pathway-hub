import { createFileRoute } from "@tanstack/react-router";
import { SubjectMateriaisPage } from "@/components/subject-materiais-page";
import { getDisciplina } from "@/lib/disciplinas";
import { getSubjectStorageKeys } from "@/lib/subject-storage";

export const Route = createFileRoute("/materias/concepcao-do-projeto/materiais")({
  component: Materiais,
});

function Materiais() {
  const disciplina = getDisciplina("concepcao-do-projeto")!;
  const storageKeys = getSubjectStorageKeys(disciplina.slug);

  return (
    <SubjectMateriaisPage
      disciplineName={disciplina.nome}
      subjectSlug={disciplina.slug}
      storageKey={storageKeys.materiais}
    />
  );
}
