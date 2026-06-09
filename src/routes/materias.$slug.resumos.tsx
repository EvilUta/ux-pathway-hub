import { createFileRoute } from "@tanstack/react-router";
import { SubjectResumosPage } from "@/components/subject-resumos-page";
import { getDisciplina } from "@/lib/disciplinas";
import { getSubjectStorageKeys } from "@/lib/subject-storage";

export const Route = createFileRoute("/materias/$slug/resumos")({
  component: GenericResumos,
});

function GenericResumos() {
  const { slug } = Route.useParams();
  const disciplina = getDisciplina(slug)!;
  const storageKeys = getSubjectStorageKeys(slug);

  return (
    <SubjectResumosPage
      disciplineName={disciplina.nome}
      subjectSlug={slug}
      storageKey={storageKeys.resumos}
    />
  );
}
