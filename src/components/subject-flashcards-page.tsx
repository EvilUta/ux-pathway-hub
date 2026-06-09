import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import {
  loadLegacyItems,
  markLegacyStorageMigrated,
  shouldMigrateLegacyStorage,
} from "@/lib/supabase-legacy";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Flashcard = { id: string; pergunta: string; resposta: string };
type FlashcardRow = { id: string; pergunta: string; resposta: string; created_at: string };

function getFlashcardSignature(item: { pergunta: string; resposta: string }) {
  return `${item.pergunta}\u0000${item.resposta}`;
}

export function SubjectFlashcardsPage({
  disciplineName,
  subjectSlug,
  storageKey,
}: {
  disciplineName: string;
  subjectSlug: string;
  storageKey: string;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");
  const [studyIdx, setStudyIdx] = useState(0);
  const [show, setShow] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Flashcard | null>(null);
  const queryKey = ["flashcards", user?.id, subjectSlug];

  const { data: items = [], isLoading } = useQuery<Flashcard[]>({
    queryKey,
    enabled: Boolean(user && supabase),
    queryFn: async () => {
      if (!supabase || !user) return [];

      const { data, error } = await supabase
        .from("flashcards")
        .select("id, pergunta, resposta, created_at")
        .eq("user_id", user.id)
        .eq("subject_slug", subjectSlug)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as FlashcardRow[];

      if (!(await shouldMigrateLegacyStorage(storageKey, { supabase, userId: user.id }))) {
        return rows.map((item) => ({
          id: item.id,
          pergunta: item.pergunta,
          resposta: item.resposta,
        }));
      }

      const legacyItems = loadLegacyItems<Flashcard[]>(storageKey, []);

      if (legacyItems.length === 0) {
        await markLegacyStorageMigrated(storageKey, { supabase, userId: user.id });
        return rows.map((item) => ({
          id: item.id,
          pergunta: item.pergunta,
          resposta: item.resposta,
        }));
      }

      const remoteSignatures = new Set(rows.map((item) => getFlashcardSignature(item)));
      const missingLegacyItems = legacyItems.filter(
        (item) => !remoteSignatures.has(getFlashcardSignature(item)),
      );

      if (missingLegacyItems.length === 0) {
        await markLegacyStorageMigrated(storageKey, { supabase, userId: user.id });
        return rows.map((item) => ({
          id: item.id,
          pergunta: item.pergunta,
          resposta: item.resposta,
        }));
      }

      const createdAtBase = Date.now();
      const { data: migratedData, error: migrateError } = await supabase
        .from("flashcards")
        .insert(
          missingLegacyItems.map((item, index) => ({
            user_id: user.id,
            subject_slug: subjectSlug,
            pergunta: item.pergunta,
            resposta: item.resposta,
            created_at: new Date(createdAtBase - index).toISOString(),
          })),
        )
        .select("id, pergunta, resposta, created_at");

      if (migrateError) throw migrateError;

      await markLegacyStorageMigrated(storageKey, { supabase, userId: user.id });

      return [...rows, ...((migratedData ?? []) as FlashcardRow[])]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((item) => ({
          id: item.id,
          pergunta: item.pergunta,
          resposta: item.resposta,
        }));
    },
  });

  const addMutation = useMutation({
    mutationFn: async (payload: { pergunta: string; resposta: string }) => {
      if (!supabase || !user) throw new Error("Sessao nao encontrada.");

      const { error } = await supabase.from("flashcards").insert({
        user_id: user.id,
        subject_slug: subjectSlug,
        pergunta: payload.pergunta,
        resposta: payload.resposta,
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      setPergunta("");
      setResposta("");
      await queryClient.invalidateQueries({ queryKey });
      toast.success("Flashcard salvo.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!supabase || !user) throw new Error("Sessao nao encontrada.");

      const { error } = await supabase
        .from("flashcards")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey });
      toast.success("Flashcard apagado.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (studyIdx >= items.length) {
      setStudyIdx(Math.max(items.length - 1, 0));
      setShow(false);
    }
  }, [items.length, studyIdx]);

  const isBusy = addMutation.isPending || deleteMutation.isPending;

  function add() {
    const nextPergunta = pergunta.trim();

    if (!nextPergunta) return;

    addMutation.mutate({
      pergunta: nextPergunta,
      resposta: resposta.trim(),
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  }

  const card = items[studyIdx];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Flashcards</h1>
        <p className="text-sm text-muted-foreground">Disciplina: {disciplineName}</p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          <Input
            placeholder="Pergunta"
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            disabled={isBusy}
          />
          <Textarea
            placeholder="Resposta"
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            disabled={isBusy}
          />
          <Button onClick={add} disabled={isBusy}>
            <Plus className="mr-1 h-4 w-4" />
            {addMutation.isPending ? "Salvando..." : "Adicionar flashcard"}
          </Button>
        </CardContent>
      </Card>

      {items.length > 0 && card && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="text-xs text-muted-foreground">
              Modo de estudo - {studyIdx + 1}/{items.length}
            </div>
            <div className="rounded-lg border bg-muted/30 p-6 text-center">
              <p className="text-lg font-medium">{card.pergunta}</p>
              {show && <p className="mt-4 border-t pt-4 text-muted-foreground">{card.resposta}</p>}
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <Button
                variant="outline"
                disabled={isBusy}
                onClick={() => {
                  setStudyIdx((studyIdx - 1 + items.length) % items.length);
                  setShow(false);
                }}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </Button>
              <Button onClick={() => setShow(!show)} disabled={isBusy}>
                {show ? "Ocultar resposta" : "Mostrar resposta"}
              </Button>
              <Button
                variant="outline"
                disabled={isBusy}
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
        {isLoading && <p className="text-sm text-muted-foreground">Carregando flashcards...</p>}
        {!isLoading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum flashcard ainda.</p>
        )}
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-start justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{item.pergunta}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.resposta}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                disabled={isBusy}
                onClick={() => setDeleteTarget(item)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Apagar flashcard"
        description={`Você tem certeza que deseja apagar o flashcard "${deleteTarget?.pergunta ?? ""}"?`}
      />
    </div>
  );
}
