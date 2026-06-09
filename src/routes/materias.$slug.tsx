import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

import { SubjectLayout } from "@/components/subject-layout";
import { Button } from "@/components/ui/button";
import { getAvaliacaoStatus, getDisciplina, resolveDisciplina } from "@/lib/disciplinas";
import { useSupabaseDisciplineState } from "@/lib/supabase-discipline-status";

export const Route = createFileRoute("/materias/$slug")({
  component: GenericSubjectLayout,
});

function GenericSubjectLayout() {
  const { slug } = Route.useParams();
  const { statusOverrides, unlockOverrides, avaliacaoOverrides, isLoading } =
    useSupabaseDisciplineState();
  const disciplina = getDisciplina(slug);

  if (!disciplina) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Disciplina não encontrada</h1>
        <p className="mt-4 text-muted-foreground">
          Não localizei uma disciplina com esse endereço.
        </p>
        <Button asChild className="mt-8">
          <Link to="/">Voltar ao Menu Principal</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">Carregando disciplina...</p>
      </div>
    );
  }

  const avaliacaoStatus = getAvaliacaoStatus(disciplina, avaliacaoOverrides[slug]);
  const d = resolveDisciplina(
    disciplina,
    statusOverrides[slug],
    unlockOverrides[slug] ?? false,
    avaliacaoStatus,
  );

  if (!d.liberada) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
        <div className="mb-6 grid h-24 w-24 place-items-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Disciplina ainda não liberada</h1>
        <p className="mt-4 text-muted-foreground">
          Esta disciplina será liberada automaticamente na data de início informada no painel.
        </p>
        <Button asChild className="mt-8">
          <Link to="/">Voltar ao Menu Principal</Link>
        </Button>
      </div>
    );
  }

  return <SubjectLayout slug={d.slug} nome={d.nome} />;
}
