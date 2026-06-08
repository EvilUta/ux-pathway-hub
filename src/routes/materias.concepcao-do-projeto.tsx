import { createFileRoute } from "@tanstack/react-router";
import { SubjectLayout } from "@/components/subject-layout";
import { getDisciplina } from "@/lib/disciplinas";

export const Route = createFileRoute("/materias/concepcao-do-projeto")({
  head: () => ({ meta: [{ title: "Concepção do Projeto — UX Academy" }] }),
  component: Layout,
});

function Layout() {
  const d = getDisciplina("concepcao-do-projeto")!;
  return <SubjectLayout slug={d.slug} nome={d.nome} />;
}
