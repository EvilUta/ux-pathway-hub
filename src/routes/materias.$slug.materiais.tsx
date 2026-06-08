import { createFileRoute } from "@tanstack/react-router";
import { SubjectMateriaisPage } from "@/components/subject-materiais-page";
import { getDisciplina } from "@/lib/disciplinas";
import { getSubjectStorageKeys } from "@/lib/subject-storage";

export const Route = createFileRoute("/materias/$slug/materiais")({
  component: GenericMateriais,
});

function GenericMateriais() {
  const { slug } = Route.useParams();
  const disciplina = getDisciplina(slug)!;
  const storageKeys = getSubjectStorageKeys(slug);

  return <SubjectMateriaisPage disciplineName={disciplina.nome} storageKey={storageKeys.materiais} />;
}
