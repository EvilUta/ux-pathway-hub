import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalStorage, uid } from "@/lib/storage";

export const Route = createFileRoute("/glossario")({
  head: () => ({ meta: [{ title: "Glossário UX — UX Academy" }] }),
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Glossário UX</h1>
      <p className="mt-1 text-muted-foreground">Conceitos-chave da sua pós-graduação.</p>

      <Card className="mt-6">
        <CardContent className="space-y-3 p-5">
          <Input placeholder="Termo" value={termo} onChange={(e) => setTermo(e.target.value)} />
          <Textarea placeholder="Definição" value={definicao} onChange={(e) => setDefinicao(e.target.value)} />
          <Button onClick={add}><Plus className="mr-1 h-4 w-4" />Adicionar termo</Button>
        </CardContent>
      </Card>

      <div className="relative mt-8">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Pesquisar..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {filtered.map((t) => (
          <Card key={t.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{t.termo}</h3>
                <Button size="icon" variant="ghost" onClick={() => setItems(items.filter((x) => x.id !== t.id))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t.definicao}</p>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">Nenhum termo encontrado.</p>}
      </div>
    </div>
  );
}
