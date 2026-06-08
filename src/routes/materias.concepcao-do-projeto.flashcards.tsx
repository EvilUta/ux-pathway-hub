import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalStorage, uid } from "@/lib/storage";

export const Route = createFileRoute("/materias/concepcao-do-projeto/flashcards")({
  component: Flashcards,
});

type FC = { id: string; pergunta: string; resposta: string };

function Flashcards() {
  const [items, setItems] = useLocalStorage<FC[]>("uxa-cdp-flashcards", []);
  const [p, setP] = useState("");
  const [r, setR] = useState("");
  const [studyIdx, setStudyIdx] = useState(0);
  const [show, setShow] = useState(false);

  const add = () => {
    if (!p.trim()) return;
    setItems([{ id: uid(), pergunta: p.trim(), resposta: r.trim() }, ...items]);
    setP(""); setR("");
  };

  const card = items[studyIdx];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Flashcards</h1>

      <Card>
        <CardContent className="space-y-3 p-5">
          <Input placeholder="Pergunta" value={p} onChange={(e) => setP(e.target.value)} />
          <Textarea placeholder="Resposta" value={r} onChange={(e) => setR(e.target.value)} />
          <Button onClick={add}><Plus className="mr-1 h-4 w-4" />Adicionar flashcard</Button>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="text-xs text-muted-foreground">Modo de estudo — {studyIdx + 1}/{items.length}</div>
            <div className="rounded-lg border bg-muted/30 p-6 text-center">
              <p className="text-lg font-medium">{card.pergunta}</p>
              {show && <p className="mt-4 border-t pt-4 text-muted-foreground">{card.resposta}</p>}
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <Button variant="outline" onClick={() => { setStudyIdx((studyIdx - 1 + items.length) % items.length); setShow(false); }}>
                <ChevronLeft className="mr-1 h-4 w-4" />Anterior
              </Button>
              <Button onClick={() => setShow(!show)}>{show ? "Ocultar resposta" : "Mostrar resposta"}</Button>
              <Button variant="outline" onClick={() => { setStudyIdx((studyIdx + 1) % items.length); setShow(false); }}>
                Próximo<ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <h2 className="font-semibold">Todos ({items.length})</h2>
        {items.map((f) => (
          <Card key={f.id}>
            <CardContent className="flex items-start justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{f.pergunta}</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.resposta}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setItems(items.filter((x) => x.id !== f.id))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
