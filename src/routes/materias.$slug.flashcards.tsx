import { createFileRoute } from "@tanstack/react-router";

import { SubjectFlashcardsPage } from "@/components/subject-flashcards-page";
import { getDisciplina } from "@/lib/disciplinas";
import { getSubjectStorageKeys } from "@/lib/subject-storage";

export const Route = createFileRoute("/materias/$slug/flashcards")({
  component: GenericFlashcards,
});

function GenericFlashcards() {
  const { slug } = Route.useParams();
  const disciplina = getDisciplina(slug)!;
  const storageKeys = getSubjectStorageKeys(slug);

  return (
    <SubjectFlashcardsPage
      disciplineName={disciplina.nome}
      subjectSlug={slug}
      storageKey={storageKeys.flashcards}
    />
  );
}
