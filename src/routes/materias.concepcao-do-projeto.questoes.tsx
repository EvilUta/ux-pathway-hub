import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocalStorage } from "@/lib/storage";

export const Route = createFileRoute("/materias/concepcao-do-projeto/questoes")({
  component: Questoes,
});

type Q = { id: string; enunciado: string; alternativas: string[]; correta: number; explicacao: string };

const QUESTOES: Q[] = [
  { id: "q1", enunciado: "Concepção do projeto envolve principalmente:", alternativas: ["Programar a interface", "Definir problema, escopo e objetivos", "Lançar campanhas de marketing", "Escolher cores"], correta: 1, explicacao: "É a fase inicial: entender o problema, definir escopo e objetivos." },
  { id: "q2", enunciado: "Stakeholders são:", alternativas: ["Apenas usuários finais", "Pessoas/grupos com interesse no projeto", "Investidores", "Designers"], correta: 1, explicacao: "Qualquer parte interessada no projeto." },
  { id: "q3", enunciado: "Brief de projeto serve para:", alternativas: ["Aprovar protótipos", "Alinhar expectativas e direcionamento", "Fechar contrato", "Definir cores"], correta: 1, explicacao: "Documento que alinha as expectativas iniciais." },
  { id: "q4", enunciado: "Escopo bem definido evita:", alternativas: ["Escopo aberto / scope creep", "Boas reuniões", "Pesquisa com usuários", "Documentação"], correta: 0, explicacao: "Evita o crescimento descontrolado do projeto." },
  { id: "q5", enunciado: "Persona é:", alternativas: ["Cliente real", "Representação fictícia do usuário", "Investidor", "Designer"], correta: 1, explicacao: "Arquétipo do usuário-alvo." },
];

function Questoes() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useLocalStorage("uxa-cdp-stats", { acertos: 0, erros: 0 });

  const answered = Object.keys(revealed).length;
  const correct = useMemo(
    () => QUESTOES.filter((q) => revealed[q.id] && answers[q.id] === q.correta).length,
    [revealed, answers],
  );
  const taxa = answered ? Math.round((correct / answered) * 100) : 0;

  const responder = (q: Q, idx: number) => {
    if (revealed[q.id]) return;
    setAnswers({ ...answers, [q.id]: idx });
    setRevealed({ ...revealed, [q.id]: true });
    setStats(idx === q.correta ? { ...stats, acertos: stats.acertos + 1 } : { ...stats, erros: stats.erros + 1 });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Questões</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Acertos (sessão)</div><div className="text-xl font-semibold text-emerald-600">{correct}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Respondidas</div><div className="text-xl font-semibold">{answered}/{QUESTOES.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Taxa de acerto</div><div className="text-xl font-semibold">{taxa}%</div><Progress className="mt-2" value={taxa} /></CardContent></Card>
      </div>

      <div className="space-y-4">
        {QUESTOES.map((q, i) => {
          const sel = answers[q.id];
          const rev = revealed[q.id];
          return (
            <Card key={q.id}>
              <CardHeader><CardTitle className="text-base">{i + 1}. {q.enunciado}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {q.alternativas.map((a, idx) => {
                  const isSel = sel === idx;
                  const isCorrect = rev && idx === q.correta;
                  const isWrong = rev && isSel && idx !== q.correta;
                  return (
                    <button
                      key={idx}
                      onClick={() => responder(q, idx)}
                      disabled={rev}
                      className={`block w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                        isCorrect ? "border-emerald-500 bg-emerald-500/10" :
                        isWrong ? "border-destructive bg-destructive/10" :
                        isSel ? "border-primary bg-primary/10" :
                        "hover:bg-accent"
                      } ${rev ? "cursor-default" : "cursor-pointer"}`}
                    >
                      {a}
                    </button>
                  );
                })}
                {rev && (
                  <div className="mt-2 rounded-md bg-muted/50 p-3 text-sm">
                    <strong>Explicação: </strong>{q.explicacao}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button variant="outline" onClick={() => { setAnswers({}); setRevealed({}); }}>Reiniciar respostas</Button>
    </div>
  );
}
