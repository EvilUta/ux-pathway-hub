import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpenText, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { useLocalStorage, uid } from "@/lib/storage";

export const Route = createFileRoute("/glossario")({
  head: () => ({ meta: [{ title: "Glossário UX - UX Academy" }] }),
  component: Glossario,
});

type Termo = { id: string; termo: string; definicao: string };

const SEED: Termo[] = [
  { id: "s1", termo: "Stakeholder", definicao: "Pessoa ou grupo com interesse no projeto." },
  { id: "s2", termo: "Escopo", definicao: "Conjunto de entregas e limites de um projeto." },
  { id: "s3", termo: "Wireframe", definicao: "Esquema visual de baixa fidelidade de uma interface." },
  { id: "s4", termo: "Persona", definicao: "Representação fictícia de um usuário típico." },
  { id: "s5", termo: "User Flow", definicao: "Caminho que o usuário percorre para concluir uma tarefa." },
  { id: "s6", termo: "Design System", definicao: "Conjunto de padrões reutilizáveis de design e código." },
  { id: "s7", termo: "Scrum", definicao: "Framework ágil baseado em sprints e papéis definidos." },
  { id: "s8", termo: "Kanban", definicao: "Método ágil visual baseado em fluxo contínuo." },
  { id: "s9", termo: "Usabilidade", definicao: "Facilidade de uso e eficiência de uma interface." },
];

function Glossario() {
  const [items, setItems] = useLocalStorage<Termo[]>("uxa-glossario", SEED);
  const [q, setQ] = useState("");
  const [termo, setTermo] = useState("");
  const [definicao, setDefinicao] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Termo | null>(null);

  const filtered = useMemo(
    () => items.filter((i) => (i.termo + i.definicao).toLowerCase().includes(q.toLowerCase())),
    [items, q],
  );

  const add = () => {
    if (!termo.trim()) return;
    setItems([{ id: uid(), termo: termo.trim(), definicao: definicao.trim() }, ...items]);
    setTermo("");
    setDefinicao("");
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setItems(items.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <section className="rounded-3xl border bg-gradient-to-br from-background via-background to-muted/40 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <BookOpenText className="h-3.5 w-3.5" />
              Base de conceitos
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Glossário UX</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Centralize termos importantes da pós, crie sua própria base de consulta e mantenha definições rápidas sempre à mão.
            </p>
          </div>
          <div className="flex gap-3">
            <Card className="min-w-[120px]">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Termos</div>
                <div className="mt-1 text-2xl font-semibold">{items.length}</div>
              </CardContent>
            </Card>
            <Card className="min-w-[120px]">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Resultados</div>
                <div className="mt-1 text-2xl font-semibold">{filtered.length}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Card className="mt-6 border-primary/10">
        <CardContent className="space-y-4 p-5">
          <div>
            <h2 className="text-lg font-semibold">Adicionar termo</h2>
            <p className="text-sm text-muted-foreground">Crie novos conceitos para consultar depois no seu acervo.</p>
          </div>
          <Input placeholder="Termo" value={termo} onChange={(e) => setTermo(e.target.value)} />
          <Textarea placeholder="Definição" rows={4} value={definicao} onChange={(e) => setDefinicao(e.target.value)} />
          <Button onClick={add}>
            <Plus className="mr-1 h-4 w-4" />
            Adicionar termo
          </Button>
        </CardContent>
      </Card>

      <div className="relative mt-8">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-11 pl-9" placeholder="Pesquisar por termo ou definição..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {filtered.map((t) => (
          <Card key={t.id} className="transition hover:border-primary/30 hover:shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Badge variant="outline" className="font-medium">
                    {t.termo}
                  </Badge>
                  <p className="text-sm leading-6 text-muted-foreground">{t.definicao}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(t)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="mt-6 border-dashed">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum termo encontrado para essa busca.</p>
          </CardContent>
        </Card>
      )}

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Apagar termo"
        description={`Você deseja apagar o termo "${deleteTarget?.termo ?? ""}"?`}
      />
    </div>
  );
}
