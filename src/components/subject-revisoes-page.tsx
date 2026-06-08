import { useState } from "react";
import { CalendarClock, Check, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalStorage, uid } from "@/lib/storage";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";

type Periodo = 1 | 7 | 30;
type Revisao = { id: string; titulo: string; criadoEm: number; revisarEm: number; feito: boolean };

const LABEL: Record<Periodo, string> = { 1: "Amanhã", 7: "Em 7 dias", 30: "Em 30 dias" };

export function SubjectRevisoesPage({ disciplineName, storageKey }: { disciplineName: string; storageKey: string }) {
  const [items, setItems] = useLocalStorage<Revisao[]>(storageKey, []);
  const [titulo, setTitulo] = useState("");
  const [periodo, setPeriodo] = useState<Periodo>(1);
  const [deleteTarget, setDeleteTarget] = useState<Revisao | null>(null);
  const now = Date.now();

  const add = () => {
    if (!titulo.trim()) return;
    setItems([
      { id: uid(), titulo: titulo.trim(), criadoEm: now, revisarEm: now + periodo * 86400000, feito: false },
      ...items,
    ]);
    setTitulo("");
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setItems(items.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const pendentes = items.filter((item) => !item.feito).sort((a, b) => a.revisarEm - b.revisarEm);
  const concluidas = items.filter((item) => item.feito);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Revisões</h1>
        <p className="text-sm text-muted-foreground">Disciplina: {disciplineName}</p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          <Input placeholder="O que revisar?" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {([1, 7, 30] as Periodo[]).map((item) => (
              <Button
                key={item}
                type="button"
                variant={periodo === item ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriodo(item)}
              >
                <CalendarClock className="mr-1 h-4 w-4" />
                {LABEL[item]}
              </Button>
            ))}
          </div>
          <Button onClick={add}>
            <Plus className="mr-1 h-4 w-4" />
            Agendar revisão
          </Button>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 font-semibold">Pendentes ({pendentes.length})</h2>
        <div className="space-y-2">
          {pendentes.map((item) => {
            const due = item.revisarEm <= now;
            return (
              <Card key={item.id}>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{item.titulo}</p>
                    <p className="text-xs text-muted-foreground">{new Date(item.revisarEm).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {due && <Badge variant="destructive">Hoje</Badge>}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setItems(items.map((current) => (current.id === item.id ? { ...current, feito: true } : current)))}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(item)}>
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
            {concluidas.map((item) => (
              <Card key={item.id} className="opacity-70">
                <CardContent className="flex items-center justify-between p-4">
                  <p className="line-through">{item.titulo}</p>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(item)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Apagar revisão"
        description={`Você tem certeza que deseja apagar a revisão "${deleteTarget?.titulo ?? ""}"?`}
      />
    </div>
  );
}
