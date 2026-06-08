import { useState } from "react";
import { ExternalLink, FileText, Link as LinkIcon, NotebookPen, Plus, Trash2, Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocalStorage, uid } from "@/lib/storage";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";

type Tipo = "link" | "pdf" | "video" | "anotacao";
type Material = { id: string; tipo: Tipo; titulo: string; valor: string };

const ICON: Record<Tipo, typeof LinkIcon> = {
  anotacao: NotebookPen,
  link: LinkIcon,
  pdf: FileText,
  video: Video,
};

export function SubjectMateriaisPage({ disciplineName, storageKey }: { disciplineName: string; storageKey: string }) {
  const [items, setItems] = useLocalStorage<Material[]>(storageKey, []);
  const [tipo, setTipo] = useState<Tipo>("link");
  const [titulo, setTitulo] = useState("");
  const [valor, setValor] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);

  const add = () => {
    if (!titulo.trim()) return;
    setItems([{ id: uid(), tipo, titulo: titulo.trim(), valor: valor.trim() }, ...items]);
    setTitulo("");
    setValor("");
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setItems(items.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Materiais</h1>
        <p className="text-sm text-muted-foreground">Disciplina: {disciplineName}</p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          <Select value={tipo} onValueChange={(value) => setTipo(value as Tipo)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="link">Link</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="video">Vídeo</SelectItem>
              <SelectItem value="anotacao">Anotação</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          {tipo === "anotacao" ? (
            <Textarea placeholder="Conteúdo da anotação" value={valor} onChange={(e) => setValor(e.target.value)} />
          ) : (
            <Input placeholder="URL" value={valor} onChange={(e) => setValor(e.target.value)} />
          )}
          <Button onClick={add}>
            <Plus className="mr-1 h-4 w-4" />
            Adicionar
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = ICON[item.tipo];
          return (
            <Card key={item.id}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium">{item.titulo}</h3>
                  {item.tipo === "anotacao" ? (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{item.valor}</p>
                  ) : (
                    <a
                      href={item.valor}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Abrir
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(item)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {items.length === 0 && <p className="text-sm text-muted-foreground">Nenhum material salvo.</p>}
      </div>

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Apagar material"
        description={`Você tem certeza que deseja apagar o material "${deleteTarget?.titulo ?? ""}"?`}
      />
    </div>
  );
}
