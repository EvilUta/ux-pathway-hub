import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle } from "lucide-react";
import { DISCIPLINAS } from "@/lib/disciplinas";

export const Route = createFileRoute("/timeline")({
  head: () => ({ meta: [{ title: "Timeline — UX Academy" }] }),
  component: Timeline,
});

function Timeline() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Linha do Tempo da Pós</h1>
      <p className="mt-1 text-muted-foreground">Acompanhe seu avanço por toda a pós-graduação.</p>

      <ol className="relative mt-10 border-l border-border pl-6">
        {DISCIPLINAS.map((d, i) => {
          const done = d.status === "concluida";
          return (
            <li key={d.slug} className="mb-8 last:mb-0">
              <span
                className={`absolute -left-3 grid h-6 w-6 place-items-center rounded-full ${
                  done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
              </span>
              <div className="flex items-baseline justify-between">
                <h3 className={`text-base font-medium ${done ? "" : "text-muted-foreground"}`}>
                  {i + 1}. {d.nome}
                </h3>
                <span className="text-xs text-muted-foreground">{done ? "Concluída" : "A cursar"}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
