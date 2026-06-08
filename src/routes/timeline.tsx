import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock3, Lock } from "lucide-react";
import {
  DISCIPLINAS,
  getAvaliacaoStatus,
  STATUS_LABELS,
  resolveDisciplina,
  type AvaliacaoOverrides,
  type DisciplinaStatusOverrides,
  type DisciplinaUnlockOverrides,
} from "@/lib/disciplinas";
import { useLocalStorage } from "@/lib/storage";

export const Route = createFileRoute("/timeline")({
  head: () => ({ meta: [{ title: "Timeline - UX Academy" }] }),
  component: Timeline,
});

function Timeline() {
  const [statusOverrides] = useLocalStorage<DisciplinaStatusOverrides>("uxa-disciplinas-status", {});
  const [unlockOverrides] = useLocalStorage<DisciplinaUnlockOverrides>("uxa-disciplinas-unlock", {});
  const [avaliacaoOverrides] = useLocalStorage<AvaliacaoOverrides>("uxa-disciplinas-avaliacao", {});
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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Linha do Tempo da Pós</h1>
      <p className="mt-1 text-muted-foreground">Acompanhe seu avanço por toda a pós-graduação.</p>

      <ol className="relative mt-10 border-l border-border pl-6">
        {disciplinas.map((d, i) => {
          const concluida = d.status === "concluida";
          const emAndamento = d.status === "em-andamento";

          return (
            <li key={d.slug} className="mb-8 last:mb-0">
              <span
                className={`absolute -left-3 grid h-6 w-6 place-items-center rounded-full ${
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
              <div className="flex items-baseline justify-between">
                <h3 className={`text-base font-medium ${d.status === "bloqueada" ? "text-muted-foreground" : ""}`}>
                  {i + 1}. {d.nome}
                </h3>
                <span className="text-xs text-muted-foreground">{STATUS_LABELS[d.status]}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
