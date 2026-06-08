import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarClock, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage, uid } from "@/lib/storage";

export const Route = createFileRoute("/materias/concepcao-do-projeto/revisoes")({
  component: Revisoes,
});

type Periodo = 1 | 7 | 30;
type Rev = { id: string; titulo: string; criadoEm: number; revisarEm: number; feito: boolean };

const LABEL: Record<Periodo, string> = { 1: "Amanhã", 7: "Em 7 dias", 30: "Em 30 dias" };

function Revisoes() {
  const [items, setItems] = useLocalStorage<Rev[]>("uxa-cdp-revisoes", []);
  const [titulo, setTitulo] = useState("");
  const [periodo, setPeriodo] = useState<Periodo>(1);
  const now = Date.now();

  const add = () => {
    if (!titulo.trim()) return;
    setItems([
      { id: uid(), titulo: titulo.trim(), criadoEm: now, revisarEm: now + periodo * 86400000, feito: false },
      ...items,
    ]);
    setTitulo("");
  };

  const pendentes = items.filter((r) => !r.feito).sort((a, b) => a.revisarEm - b.revisarEm);
  const concluidas = items.filter((r) => r.feito);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Revisões</h1>

      <Card>
        <CardContent className="space-y-3 p-5">
          <Input placeholder="O que revisar?" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {([1, 7, 30] as Periodo[]).map((p) => (
              <Button key={p} type="button" variant={periodo === p ? "default" : "outline"} size="sm" onClick={() => setPeriodo(p)}>
                <CalendarClock className="mr-1 h-4 w-4" />{LABEL[p]}
              </Button>
            ))}
          </div>
          <Button onClick={add}><Plus className="mr-1 h-4 w-4" />Agendar revisão</Button>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 font-semibold">Pendentes ({pendentes.length})</h2>
        <div className="space-y-2">
          {pendentes.map((r) => {
            const due = r.revisarEm <= now;
            return (
              <Card key={r.id}>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{r.titulo}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.revisarEm).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {due && <Badge variant="destructive">Hoje</Badge>}
                    <Button size="icon" variant="ghost" onClick={() => setItems(items.map((x) => x.id === r.id ? { ...x, feito: true } : x))}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setItems(items.filter((x) => x.id !== r.id))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {pendentes.length === 0 && <p className="text-sm text-muted-foreground">Nada para revisar.</p>}
        </div>
      </section>

      {concluidas.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-muted-foreground">Concluídas</h2>
          <div className="space-y-2">
            {concluidas.map((r) => (
              <Card key={r.id} className="opacity-70">
                <CardContent className="flex items-center justify-between p-4">
                  <p className="line-through">{r.titulo}</p>
                  <Button size="icon" variant="ghost" onClick={() => setItems(items.filter((x) => x.id !== r.id))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
