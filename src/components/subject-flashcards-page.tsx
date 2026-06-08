import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage, uid } from "@/lib/storage";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";

type Flashcard = { id: string; pergunta: string; resposta: string };

export function SubjectFlashcardsPage({ disciplineName, storageKey }: { disciplineName: string; storageKey: string }) {
  const [items, setItems] = useLocalStorage<Flashcard[]>(storageKey, []);
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");
  const [studyIdx, setStudyIdx] = useState(0);
  const [show, setShow] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Flashcard | null>(null);

  useEffect(() => {
    if (studyIdx >= items.length) {
      setStudyIdx(Math.max(items.length - 1, 0));
      setShow(false);
    }
  }, [items.length, studyIdx]);

  const add = () => {
    if (!pergunta.trim()) return;
    setItems([{ id: uid(), pergunta: pergunta.trim(), resposta: resposta.trim() }, ...items]);
    setPergunta("");
    setResposta("");
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setItems(items.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const card = items[studyIdx];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Flashcards</h1>
        <p className="text-sm text-muted-foreground">Disciplina: {disciplineName}</p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          <Input placeholder="Pergunta" value={pergunta} onChange={(e) => setPergunta(e.target.value)} />
          <Textarea placeholder="Resposta" value={resposta} onChange={(e) => setResposta(e.target.value)} />
          <Button onClick={add}>
            <Plus className="mr-1 h-4 w-4" />
            Adicionar flashcard
          </Button>
        </CardContent>
      </Card>

      {items.length > 0 && card && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="text-xs text-muted-foreground">Modo de estudo - {studyIdx + 1}/{items.length}</div>
            <div className="rounded-lg border bg-muted/30 p-6 text-center">
              <p className="text-lg font-medium">{card.pergunta}</p>
              {show && <p className="mt-4 border-t pt-4 text-muted-foreground">{card.resposta}</p>}
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStudyIdx((studyIdx - 1 + items.length) % items.length);
                  setShow(false);
                }}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </Button>
              <Button onClick={() => setShow(!show)}>{show ? "Ocultar resposta" : "Mostrar resposta"}</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStudyIdx((studyIdx + 1) % items.length);
                  setShow(false);
                }}
              >
                Próximo
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <h2 className="font-semibold">Todos ({items.length})</h2>
        {items.length === 0 && <p className="text-sm text-muted-foreground">Nenhum flashcard ainda.</p>}
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-start justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{item.pergunta}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.resposta}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(item)}>
                <Trash2 className="h-4 w-4" />
              </Button>
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
        title="Apagar flashcard"
        description={`Você tem certeza que deseja apagar o flashcard "${deleteTarget?.pergunta ?? ""}"?`}
      />
    </div>
  );
}
