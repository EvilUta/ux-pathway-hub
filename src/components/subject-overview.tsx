import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  AVALIACAO_LABELS,
  getAvaliacaoStatus,
  getDisciplina,
  resolveDisciplina,
  STATUS_LABELS,
  type AvaliacaoOverrides,
  type AvaliacaoStatus,
  type DisciplinaStatusOverrides,
  type DisciplinaUnlockOverrides,
} from "@/lib/disciplinas";
import { useLocalStorage } from "@/lib/storage";
import { getSubjectStorageKeys } from "@/lib/subject-storage";

type AvaliacaoNotas = Partial<Record<string, string>>;

export function SubjectOverview({ slug }: { slug: string }) {
  const storageKeys = getSubjectStorageKeys(slug);
  const [flashcards] = useLocalStorage<unknown[]>(storageKeys.flashcards, []);
  const [resumos] = useLocalStorage<unknown[]>(storageKeys.resumos, []);
  const [statusOverrides] = useLocalStorage<DisciplinaStatusOverrides>("uxa-disciplinas-status", {});
  const [unlockOverrides] = useLocalStorage<DisciplinaUnlockOverrides>("uxa-disciplinas-unlock", {});
  const [avaliacaoOverrides, setAvaliacaoOverrides] = useLocalStorage<AvaliacaoOverrides>("uxa-disciplinas-avaliacao", {});
  const [avaliacaoNotas, setAvaliacaoNotas] = useLocalStorage<AvaliacaoNotas>("uxa-disciplinas-avaliacao-nota", {});
  const disciplinaBase = getDisciplina(slug)!;
  const avaliacaoStatus = getAvaliacaoStatus(disciplinaBase, avaliacaoOverrides[slug]);
  const notaAvaliacao = avaliacaoNotas[slug] ?? "";
  const disciplina = resolveDisciplina(
    disciplinaBase,
    statusOverrides[slug],
    unlockOverrides[slug] ?? false,
    avaliacaoStatus,
  );

  const stats = [
    { label: "Status", value: STATUS_LABELS[disciplina.status] },
    { label: "Avaliação", value: AVALIACAO_LABELS[avaliacaoStatus] },
    { label: "Flashcards", value: flashcards.length },
    { label: "Resumos", value: resumos.length },
  ];

  function handleAvaliacaoChange(status: AvaliacaoStatus) {
    setAvaliacaoOverrides((current) => ({ ...current, [slug]: status }));
  }

  function handleNotaChange(value: string) {
    const sanitized = value.replace(/[^0-9.,]/g, "");
    setAvaliacaoNotas((current) => ({ ...current, [slug]: sanitized }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-sm text-muted-foreground">Disciplina: {disciplina.nome}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {disciplina.status === "concluida" && (
          <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">Concluída</Badge>
        )}
        {disciplina.status === "em-andamento" && <Badge variant="secondary">Em andamento</Badge>}
        {disciplina.status === "bloqueada" && <Badge variant="outline">Bloqueada</Badge>}
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span>{disciplina.progresso}%</span>
          </div>
          <Progress value={disciplina.progresso} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className={`h-4 w-4 ${avaliacaoStatus === "concluida" ? "text-emerald-600" : "text-muted-foreground"}`} />
            Lembrete de avaliação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={avaliacaoStatus === "concluida" ? "default" : "outline"} className={avaliacaoStatus === "concluida" ? "bg-emerald-600 hover:bg-emerald-600" : ""}>
              Avaliação {AVALIACAO_LABELS[avaliacaoStatus].toLowerCase()}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            A matéria só poderá ser concluída quando a avaliação estiver marcada como concluída.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant={avaliacaoStatus === "pendente" ? "default" : "outline"} onClick={() => handleAvaliacaoChange("pendente")}>
              Pendente
            </Button>
            <Button
              variant={avaliacaoStatus === "concluida" ? "default" : "outline"}
              className={avaliacaoStatus === "concluida" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              onClick={() => handleAvaliacaoChange("concluida")}
            >
              Concluída
            </Button>
          </div>
          {avaliacaoStatus === "concluida" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor={`avaliacao-nota-${slug}`}>
                Nota da avaliação
              </label>
              <Input
                id={`avaliacao-nota-${slug}`}
                inputMode="decimal"
                placeholder="Ex.: 8,5"
                value={notaAvaliacao}
                onChange={(e) => handleNotaChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Registre a nota da avaliação desta disciplina. Você pode usar ponto ou vírgula.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
