import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage, uid } from "@/lib/storage";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";

type Resumo = { id: string; titulo: string; conteudo: string; data: string };

export function SubjectResumosPage({ disciplineName, storageKey }: { disciplineName: string; storageKey: string }) {
  const [items, setItems] = useLocalStorage<Resumo[]>(storageKey, []);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [eTit, setETit] = useState("");
  const [eCont, setECont] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Resumo | null>(null);

  const add = () => {
    if (!titulo.trim()) return;
    setItems([
      { id: uid(), titulo: titulo.trim(), conteudo: conteudo.trim(), data: new Date().toLocaleDateString("pt-BR") },
      ...items,
    ]);
    setTitulo("");
    setConteudo("");
  };

  const saveEdit = (id: string) => {
    setItems(items.map((r) => (r.id === id ? { ...r, titulo: eTit.trim(), conteudo: eCont.trim() } : r)));
    setEditing(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setItems(items.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resumos</h1>
        <p className="text-sm text-muted-foreground">Disciplina: {disciplineName}</p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          <Input placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <Textarea placeholder="Conteúdo" rows={4} value={conteudo} onChange={(e) => setConteudo(e.target.value)} />
          <Button onClick={add}>
            <Plus className="mr-1 h-4 w-4" />
            Novo resumo
          </Button>
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
                    <Button size="sm" onClick={() => saveEdit(r.id)}>
                      <Check className="mr-1 h-4 w-4" />
                      Salvar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                      <X className="mr-1 h-4 w-4" />
                      Cancelar
                    </Button>
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
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditing(r.id);
                          setETit(r.titulo);
                          setECont(r.conteudo);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(r)}>
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

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Apagar resumo"
        description={`Você tem certeza que deseja apagar o resumo "${deleteTarget?.titulo ?? ""}"?`}
      />
    </div>
  );
}
