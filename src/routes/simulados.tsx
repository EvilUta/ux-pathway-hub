import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/simulados")({
  head: () => ({ meta: [{ title: "Simulados — UX Academy" }] }),
  component: Simulados,
});

type Q = { id: string; enunciado: string; alternativas: string[]; correta: number };

const BANCO: Q[] = [
  { id: "q1", enunciado: "O que é um wireframe?", alternativas: ["Protótipo final", "Esquema visual de baixa fidelidade", "Arquivo de código", "Cor primária do design"], correta: 1 },
  { id: "q2", enunciado: "Persona é:", alternativas: ["Cliente real", "Usuário fictício representativo", "Stakeholder", "Designer"], correta: 1 },
  { id: "q3", enunciado: "Scrum é um framework de:", alternativas: ["Design gráfico", "Gestão ágil", "Pesquisa quantitativa", "Marketing"], correta: 1 },
  { id: "q4", enunciado: "Usabilidade refere-se a:", alternativas: ["Estética", "Facilidade de uso", "Tecnologia", "Marketing"], correta: 1 },
  { id: "q5", enunciado: "User flow representa:", alternativas: ["Cores do app", "Fluxo do usuário em tarefas", "Lista de bugs", "Documento jurídico"], correta: 1 },
];

function Simulados() {
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(() => BANCO.filter((q) => answers[q.id] === q.correta).length, [answers]);
  const pct = Math.round((score / BANCO.length) * 100);

  if (!started) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Simulados</h1>
        <p className="mt-2 text-muted-foreground">Gere um simulado rápido com {BANCO.length} questões.</p>
        <Button className="mt-8" size="lg" onClick={() => setStarted(true)}>Gerar simulado</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">Simulado</h1>
      <div className="mt-6 space-y-4">
        {BANCO.map((q, idx) => (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle className="text-base">{idx + 1}. {q.enunciado}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {q.alternativas.map((a, i) => {
                const sel = answers[q.id] === i;
                const correct = submitted && i === q.correta;
                const wrong = submitted && sel && i !== q.correta;
                return (
                  <button
                    key={i}
                    onClick={() => !submitted && setAnswers({ ...answers, [q.id]: i })}
                    className={`block w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                      correct ? "border-emerald-500 bg-emerald-500/10" :
                      wrong ? "border-destructive bg-destructive/10" :
                      sel ? "border-primary bg-primary/10" : "hover:bg-accent"
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {!submitted ? (
        <Button className="mt-6" onClick={() => setSubmitted(true)}>Corrigir</Button>
      ) : (
        <Card className="mt-6">
          <CardContent className="space-y-3 p-6">
            <h3 className="text-lg font-semibold">Resultado: {score}/{BANCO.length} ({pct}%)</h3>
            <Progress value={pct} />
            <Button variant="outline" onClick={() => { setAnswers({}); setSubmitted(false); }}>Refazer</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
