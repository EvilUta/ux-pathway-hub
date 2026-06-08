import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalStorage, uid } from "@/lib/storage";

export const Route = createFileRoute("/materias/concepcao-do-projeto/resumos")({
  component: Resumos,
});

type Resumo = { id: string; titulo: string; conteudo: string; data: string };

function Resumos() {
  const [items, setItems] = useLocalStorage<Resumo[]>("uxa-cdp-resumos", []);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [eTit, setETit] = useState("");
  const [eCont, setECont] = useState("");

  const add = () => {
    if (!titulo.trim()) return;
    setItems([{ id: uid(), titulo: titulo.trim(), conteudo: conteudo.trim(), data: new Date().toLocaleDateString("pt-BR") }, ...items]);
    setTitulo("");
    setConteudo("");
  };

  const saveEdit = (id: string) => {
    setItems(items.map((r) => (r.id === id ? { ...r, titulo: eTit, conteudo: eCont } : r)));
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Resumos</h1>

      <Card>
        <CardContent className="space-y-3 p-5">
          <Input placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <Textarea placeholder="Conteúdo" rows={4} value={conteudo} onChange={(e) => setConteudo(e.target.value)} />
          <Button onClick={add}><Plus className="mr-1 h-4 w-4" />Novo resumo</Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {items.length === 0 && <p className="text-sm text-muted-foreground">Nenhum resumo ainda.</p>}
        {items.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-5">
              {editing === r.id ? (
                <div className="space-y-2">
                  <Input value={eTit} onChange={(e) => setETit(e.target.value)} />
                  <Textarea rows={4} value={eCont} onChange={(e) => setECont(e.target.value)} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit(r.id)}><Check className="mr-1 h-4 w-4" />Salvar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="mr-1 h-4 w-4" />Cancelar</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{r.titulo}</h3>
                      <p className="text-xs text-muted-foreground">{r.data}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(r.id); setETit(r.titulo); setECont(r.conteudo); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setItems(items.filter((x) => x.id !== r.id))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{r.conteudo}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
