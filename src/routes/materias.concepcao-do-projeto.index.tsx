import { createFileRoute } from "@tanstack/react-router";
import { SubjectOverview } from "@/components/subject-overview";

export const Route = createFileRoute("/materias/concepcao-do-projeto/")({
  component: VisaoGeral,
});

function VisaoGeral() {
  return <SubjectOverview slug="concepcao-do-projeto" />;
}
