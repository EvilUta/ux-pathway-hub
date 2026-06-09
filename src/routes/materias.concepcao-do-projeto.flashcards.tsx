import { createFileRoute } from "@tanstack/react-router";
import { SubjectFlashcardsPage } from "@/components/subject-flashcards-page";
import { getDisciplina } from "@/lib/disciplinas";
import { getSubjectStorageKeys } from "@/lib/subject-storage";

export const Route = createFileRoute("/materias/concepcao-do-projeto/flashcards")({
  component: Flashcards,
});

function Flashcards() {
  const disciplina = getDisciplina("concepcao-do-projeto")!;
  const storageKeys = getSubjectStorageKeys(disciplina.slug);

  return (
    <SubjectFlashcardsPage
      disciplineName={disciplina.nome}
      subjectSlug={disciplina.slug}
      storageKey={storageKeys.flashcards}
    />
  );
}
