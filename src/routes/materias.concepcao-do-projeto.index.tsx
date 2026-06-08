import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLocalStorage } from "@/lib/storage";

export const Route = createFileRoute("/materias/concepcao-do-projeto/")({
  component: VisaoGeral,
});

function VisaoGeral() {
  const [flashcards] = useLocalStorage<unknown[]>("uxa-cdp-flashcards", []);
  const [resumos] = useLocalStorage<unknown[]>("uxa-cdp-resumos", []);

  const stats = [
    { label: "Status", value: "Concluída" },
    { label: "Progresso", value: "100%" },
    { label: "Questões", value: 20 },
    { label: "Flashcards", value: flashcards.length },
    { label: "Resumos", value: resumos.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-sm text-muted-foreground">Disciplina: Concepção do Projeto</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">Concluída</Badge>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span>100%</span>
          </div>
          <Progress value={100} />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-xl font-semibold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
