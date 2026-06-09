import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock3, Lock } from "lucide-react";

import {
  DISCIPLINAS,
  getAvaliacaoStatus,
  resolveDisciplina,
  STATUS_LABELS,
} from "@/lib/disciplinas";
import { useSupabaseDisciplineState } from "@/lib/supabase-discipline-status";

export const Route = createFileRoute("/timeline")({
  head: () => ({ meta: [{ title: "Timeline - UX Academy" }] }),
  component: Timeline,
});

function Timeline() {
  const { statusOverrides, unlockOverrides, avaliacaoOverrides, isLoading } =
    useSupabaseDisciplineState();
  const disciplinas = DISCIPLINAS.map((disciplina) => {
    const avaliacaoStatus = getAvaliacaoStatus(disciplina, avaliacaoOverrides[disciplina.slug]);
    return resolveDisciplina(
      disciplina,
      statusOverrides[disciplina.slug],
      unlockOverrides[disciplina.slug] ?? false,
      avaliacaoStatus,
    );
  });

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Linha do Tempo da Pós</h1>
      <p className="mt-1 text-muted-foreground">Acompanhe seu avanço por toda a pós-graduação.</p>
      {isLoading && (
        <p className="mt-4 text-sm text-muted-foreground">Carregando status das disciplinas...</p>
      )}

      <div className="mt-8 rounded-2xl border border-border/60 bg-card/35 px-4 py-5 shadow-sm sm:mt-10 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none">
        <ol className="relative ml-2 border-l border-border pl-6 sm:ml-0">
          {disciplinas.map((d, i) => {
            const concluida = d.status === "concluida";
            const emAndamento = d.status === "em-andamento";

            return (
              <li key={d.slug} className="relative mb-8 pr-2 last:mb-0">
                <span
                  className={`absolute -left-9 top-0 grid h-6 w-6 place-items-center rounded-full ${
                    concluida
                      ? "bg-emerald-500 text-white"
                      : emAndamento
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {concluida ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : emAndamento ? (
                    <Clock3 className="h-3.5 w-3.5" />
                  ) : (
                    <Lock className="h-3 w-3" />
                  )}
                </span>
                <div className="flex flex-col gap-1 pr-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <h3
                    className={`text-base font-medium ${d.status === "bloqueada" ? "text-muted-foreground" : ""}`}
                  >
                    {i + 1}. {d.nome}
                  </h3>
                  <span className="text-xs text-muted-foreground">{STATUS_LABELS[d.status]}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
