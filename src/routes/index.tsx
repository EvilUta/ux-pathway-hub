import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Lock, BookOpen, Trophy, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DISCIPLINAS } from "@/lib/disciplinas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UX Academy — Dashboard" },
      { name: "description", content: "Painel da pós-graduação em UX Design da Unicesumar." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const total = DISCIPLINAS.length;
  const concluidas = DISCIPLINAS.filter((d) => d.status === "concluida").length;
  const emAndamento = DISCIPLINAS.filter((d) => d.status === "em-andamento").length;
  const progressoGeral = Math.round(DISCIPLINAS.reduce((a, d) => a + d.progresso, 0) / total);

  const stats = [
    { label: "Disciplinas", value: total, icon: BookOpen },
    { label: "Concluídas", value: concluidas, icon: Trophy },
    { label: "Em andamento", value: emAndamento, icon: Clock },
    { label: "Progresso geral", value: `${progressoGeral}%`, icon: CheckCircle2 },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">UX Academy</h1>
        <p className="mt-1 text-muted-foreground">Pós-graduação em UX Design — Unicesumar</p>
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            Progresso geral
            <span className="text-sm font-normal text-muted-foreground">{progressoGeral}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progressoGeral} />
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Disciplinas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DISCIPLINAS.map((d) => {
            const to = d.liberada ? `/materias/${d.slug}` : "/materia-nao-cursada";
            return (
              <Card key={d.slug} className={`group relative overflow-hidden transition ${d.liberada ? "hover:border-primary" : "opacity-90"}`}>
                {!d.liberada && (
                  <div className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-base">{d.nome}</CardTitle>
                  <p className="text-xs text-muted-foreground">Início: {d.inicio}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    {d.status === "concluida" && <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">Concluída</Badge>}
                    {d.status === "em-andamento" && <Badge variant="secondary">Em andamento</Badge>}
                    {d.status === "bloqueada" && <Badge variant="outline">Bloqueada</Badge>}
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progresso</span>
                      <span>{d.progresso}%</span>
                    </div>
                    <Progress value={d.progresso} />
                  </div>
                  <Button asChild className="w-full" variant={d.liberada ? "default" : "secondary"}>
                    <Link to={to}>
                      Acessar Disciplina
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
