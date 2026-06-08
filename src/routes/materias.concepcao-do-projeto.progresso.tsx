import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocalStorage } from "@/lib/storage";

export const Route = createFileRoute("/materias/concepcao-do-projeto/progresso")({
  component: ProgressoPage,
});

function ProgressoPage() {
  const [stats] = useLocalStorage("uxa-cdp-stats", { acertos: 0, erros: 0 });
  const [flashcards] = useLocalStorage<unknown[]>("uxa-cdp-flashcards", []);
  const [resumos] = useLocalStorage<unknown[]>("uxa-cdp-resumos", []);
  const [revisoes] = useLocalStorage<{ feito: boolean }[]>("uxa-cdp-revisoes", []);

  const respondidas = stats.acertos + stats.erros;
  const taxa = respondidas ? Math.round((stats.acertos / respondidas) * 100) : 0;

  const cards = [
    { label: "Questões respondidas", value: respondidas },
    { label: "Taxa de acerto", value: `${taxa}%` },
    { label: "Flashcards", value: flashcards.length },
    { label: "Resumos criados", value: resumos.length },
    { label: "Revisões feitas", value: revisoes.filter((r) => r.feito).length },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Progresso</h1>

      <Card>
        <CardContent className="space-y-2 p-5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taxa de acerto</span>
            <span>{taxa}%</span>
          </div>
          <Progress value={taxa} />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div className="mt-1 text-2xl font-semibold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
