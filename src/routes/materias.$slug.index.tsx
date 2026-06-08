import { createFileRoute } from "@tanstack/react-router";
import { SubjectOverview } from "@/components/subject-overview";

export const Route = createFileRoute("/materias/$slug/")({
  component: GenericOverview,
});

function GenericOverview() {
  const { slug } = Route.useParams();
  return <SubjectOverview slug={slug} />;
}
