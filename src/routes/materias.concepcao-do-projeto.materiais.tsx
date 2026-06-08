import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink, FileText, Link as LinkIcon, Plus, Trash2, Video, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocalStorage, uid } from "@/lib/storage";

export const Route = createFileRoute("/materias/concepcao-do-projeto/materiais")({
  component: Materiais,
});

type Tipo = "link" | "pdf" | "video" | "anotacao";
type Mat = { id: string; tipo: Tipo; titulo: string; valor: string };

const ICON: Record<Tipo, typeof LinkIcon> = { link: LinkIcon, pdf: FileText, video: Video, anotacao: NotebookPen };

function Materiais() {
  const [items, setItems] = useLocalStorage<Mat[]>("uxa-cdp-materiais", []);
  const [tipo, setTipo] = useState<Tipo>("link");
  const [titulo, setTitulo] = useState("");
  const [valor, setValor] = useState("");

  const add = () => {
    if (!titulo.trim()) return;
    setItems([{ id: uid(), tipo, titulo: titulo.trim(), valor: valor.trim() }, ...items]);
    setTitulo(""); setValor("");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Materiais</h1>

      <Card>
        <CardContent className="space-y-3 p-5">
          <Select value={tipo} onValueChange={(v) => setTipo(v as Tipo)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
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
          <Button onClick={add}><Plus className="mr-1 h-4 w-4" />Adicionar</Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((m) => {
          const Icon = ICON[m.tipo];
          return (
            <Card key={m.id}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium">{m.titulo}</h3>
                  {m.tipo === "anotacao" ? (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{m.valor}</p>
                  ) : (
                    <a href={m.valor} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                      Abrir <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <Button size="icon" variant="ghost" onClick={() => setItems(items.filter((x) => x.id !== m.id))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {items.length === 0 && <p className="text-sm text-muted-foreground">Nenhum material salvo.</p>}
      </div>
    </div>
  );
}
