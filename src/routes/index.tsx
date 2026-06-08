import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, FileText, Lock, LockOpen, BookOpen, Trophy, Clock } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AVALIACAO_LABELS,
  DISCIPLINAS,
  getAvaliacaoStatus,
  podeConcluirDisciplina,
  resolveDisciplina,
  type AvaliacaoOverrides,
  type AvaliacaoStatus,
  type DisciplinaManualStatus,
  type DisciplinaStatusOverrides,
  type DisciplinaUnlockOverrides,
} from "@/lib/disciplinas";
import { useLocalStorage } from "@/lib/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UX Academy - Dashboard" },
      { name: "description", content: "Painel da pós-graduação em UX Design da Unicesumar." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [statusOverrides, setStatusOverrides] = useLocalStorage<DisciplinaStatusOverrides>("uxa-disciplinas-status", {});
  const [unlockOverrides, setUnlockOverrides] = useLocalStorage<DisciplinaUnlockOverrides>("uxa-disciplinas-unlock", {});
  const [avaliacaoOverrides, setAvaliacaoOverrides] = useLocalStorage<AvaliacaoOverrides>("uxa-disciplinas-avaliacao", {});
  const [blockedConclusionSlug, setBlockedConclusionSlug] = useState<string | null>(null);
  const [reminderPopoverSlug, setReminderPopoverSlug] = useState<string | null>(null);

  const disciplinas = DISCIPLINAS.map((disciplina) => {
    const avaliacaoStatus = getAvaliacaoStatus(disciplina, avaliacaoOverrides[disciplina.slug]);
    return resolveDisciplina(
      disciplina,
      statusOverrides[disciplina.slug],
      unlockOverrides[disciplina.slug] ?? false,
      avaliacaoStatus,
    );
  });

  const total = disciplinas.length;
  const concluidas = disciplinas.filter((d) => d.status === "concluida").length;
  const emAndamento = disciplinas.filter((d) => d.status === "em-andamento").length;
  const progressoGeral = Math.round(disciplinas.reduce((acc, d) => acc + d.progresso, 0) / total);

  const stats = [
    { label: "Disciplinas", value: total, icon: BookOpen },
    { label: "Concluídas", value: concluidas, icon: Trophy },
    { label: "Em andamento", value: emAndamento, icon: Clock },
    { label: "Progresso geral", value: `${progressoGeral}%`, icon: CheckCircle2 },
  ];

  function handleStatusChange(slug: string, status: DisciplinaManualStatus, avaliacaoStatus: AvaliacaoStatus) {
    if (status === "concluida" && !podeConcluirDisciplina(avaliacaoStatus)) {
      setBlockedConclusionSlug(slug);
      return;
    }
    setStatusOverrides((current) => ({ ...current, [slug]: status }));
  }

  function handleUnlockToggle(slug: string, unlocked: boolean) {
    setUnlockOverrides((current) => ({ ...current, [slug]: unlocked }));
  }

  function handleAvaliacaoChange(slug: string, status: AvaliacaoStatus) {
    setAvaliacaoOverrides((current) => ({ ...current, [slug]: status }));
    setReminderPopoverSlug(null);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">UX Academy</h1>
        <p className="mt-1 text-muted-foreground">Pós-graduação em UX Design - Unicesumar</p>
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
          {disciplinas.map((d) => {
            const to = d.liberada ? `/materias/${d.slug}` : "/materia-nao-cursada";
            const statusSelecionavel = d.status === "concluida" ? "concluida" : "em-andamento";
            const desbloqueioAntecipadoAtivo = unlockOverrides[d.slug] ?? false;
            const avaliacaoStatus = getAvaliacaoStatus(d, avaliacaoOverrides[d.slug]);
            const avaliacaoConcluida = avaliacaoStatus === "concluida";

            return (
              <Card key={d.slug} className={`group relative overflow-hidden transition ${d.liberada ? "hover:border-primary" : "opacity-90"}`}>
                <Popover open={reminderPopoverSlug === d.slug} onOpenChange={(open) => setReminderPopoverSlug(open ? d.slug : null)}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={`absolute right-12 top-3 grid h-8 w-8 place-items-center rounded-full transition ${
                        avaliacaoConcluida
                          ? "bg-emerald-500/15 text-emerald-600 hover:text-emerald-700"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                      aria-label="Lembrete de avaliação"
                      onMouseEnter={() => setReminderPopoverSlug(d.slug)}
                      onMouseLeave={() => setReminderPopoverSlug((current) => (current === d.slug ? null : current))}
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="space-y-3"
                    onMouseEnter={() => setReminderPopoverSlug(d.slug)}
                    onMouseLeave={() => setReminderPopoverSlug((current) => (current === d.slug ? null : current))}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Lembrete de avaliação</p>
                      <p className="text-sm text-muted-foreground">{d.nome}</p>
                      <p className="text-sm text-muted-foreground">Status atual: {AVALIACAO_LABELS[avaliacaoStatus]}</p>
                    </div>
                    <div className="grid gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={avaliacaoStatus === "pendente" ? "default" : "outline"}
                        onClick={() => handleAvaliacaoChange(d.slug, "pendente")}
                      >
                        Pendente
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={avaliacaoStatus === "concluida" ? "default" : "outline"}
                        className={avaliacaoConcluida ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                        onClick={() => handleAvaliacaoChange(d.slug, "concluida")}
                      >
                        Concluída
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <HoverCard openDelay={120} closeDelay={120}>
                  <HoverCardTrigger asChild>
                    <button
                      type="button"
                      className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground transition hover:text-foreground"
                      aria-label={d.liberada ? "Disciplina liberada" : "Disciplina bloqueada"}
                    >
                      {d.liberada ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent align="end" className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{d.nome}</p>
                      {!d.liberada && <p className="text-sm text-muted-foreground">Deseja desbloquear a matéria antecipadamente?</p>}
                      {d.liberadaAntecipadamente && (
                        <p className="text-sm text-muted-foreground">Esta disciplina foi desbloqueada antecipadamente e já pode ser acessada.</p>
                      )}
                      {d.liberadaPorData && (
                        <p className="text-sm text-muted-foreground">Esta disciplina já está liberada pela data de início.</p>
                      )}
                    </div>
                    {!d.liberadaPorData && (
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        variant={desbloqueioAntecipadoAtivo ? "outline" : "default"}
                        onClick={() => handleUnlockToggle(d.slug, !desbloqueioAntecipadoAtivo)}
                      >
                        {desbloqueioAntecipadoAtivo ? "Voltar para liberação automática" : "Desbloquear antecipadamente"}
                      </Button>
                    )}
                  </HoverCardContent>
                </HoverCard>

                <CardHeader className="space-y-4">
                  <CardTitle className="pr-20 text-base">{d.nome}</CardTitle>
                  <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                    <div>
                      <span className="block">Início</span>
                      <span className="text-sm font-medium text-foreground">{d.inicio}</span>
                    </div>
                    <div className="text-right">
                      <span className="block">Ano/Módulo</span>
                      <span className="text-sm font-medium text-foreground">{d.anoModulo}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {d.status === "concluida" && (
                      <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">Concluída</Badge>
                    )}
                    {d.status === "em-andamento" && <Badge variant="secondary">Em andamento</Badge>}
                    {d.status === "bloqueada" && <Badge variant="outline">Bloqueada</Badge>}
                    <Badge variant={avaliacaoConcluida ? "default" : "outline"} className={avaliacaoConcluida ? "bg-emerald-600 hover:bg-emerald-600" : ""}>
                      Avaliação {avaliacaoConcluida ? "concluída" : "pendente"}
                    </Badge>
                  </div>

                  {d.liberada ? (
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">Atualizar status</span>
                      <Select
                        value={statusSelecionavel}
                        onValueChange={(value) => handleStatusChange(d.slug, value as DisciplinaManualStatus, avaliacaoStatus)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="em-andamento">Em andamento</SelectItem>
                          <SelectItem value="concluida">Concluída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Esta disciplina muda automaticamente para em andamento na data de início.</p>
                  )}

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

      <AlertDialog open={Boolean(blockedConclusionSlug)} onOpenChange={(open) => !open && setBlockedConclusionSlug(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>A avaliação precisa ser concluída primeiro</AlertDialogTitle>
            <AlertDialogDescription>
              A matéria só pode ser marcada como concluída depois que o lembrete de avaliação estiver marcado como concluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setBlockedConclusionSlug(null)}>Entendi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
