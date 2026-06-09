import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  loadLegacyItems,
  markLegacyStorageMigrated,
  shouldMigrateLegacyStorage,
} from "@/lib/supabase-legacy";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Resumo = { id: string; titulo: string; conteudo: string; data: string };
type ResumoRow = {
  id: string;
  titulo: string;
  conteudo: string;
  created_at: string;
};

function formatResumoDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

function mapResumoRow(item: ResumoRow): Resumo {
  return {
    id: item.id,
    titulo: item.titulo,
    conteudo: item.conteudo,
    data: formatResumoDate(item.created_at),
  };
}

function getResumoSignature(item: { titulo: string; conteudo: string }) {
  return `${item.titulo}\u0000${item.conteudo}`;
}

export function SubjectResumosPage({
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
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [eTit, setETit] = useState("");
  const [eCont, setECont] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Resumo | null>(null);

  const queryKey = ["resumos", user?.id, subjectSlug];

  const { data: items = [], isLoading } = useQuery<Resumo[]>({
    queryKey,
    enabled: Boolean(user && supabase),
    queryFn: async () => {
      if (!supabase || !user) return [];

      const { data, error } = await supabase
        .from("resumos")
        .select("id, titulo, conteudo, created_at")
        .eq("user_id", user.id)
        .eq("subject_slug", subjectSlug)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as ResumoRow[];

      if (!(await shouldMigrateLegacyStorage(storageKey, { supabase, userId: user.id }))) {
        return rows.map(mapResumoRow);
      }

      const legacyItems = loadLegacyItems<Resumo[]>(storageKey, []);

      if (legacyItems.length === 0) {
        await markLegacyStorageMigrated(storageKey, { supabase, userId: user.id });
        return rows.map(mapResumoRow);
      }

      const remoteSignatures = new Set(rows.map((item) => getResumoSignature(item)));
      const missingLegacyItems = legacyItems.filter(
        (item) => !remoteSignatures.has(getResumoSignature(item)),
      );

      if (missingLegacyItems.length === 0) {
        await markLegacyStorageMigrated(storageKey, { supabase, userId: user.id });
        return rows.map(mapResumoRow);
      }

      const createdAtBase = Date.now();
      const { data: migratedData, error: migrateError } = await supabase
        .from("resumos")
        .insert(
          missingLegacyItems.map((item, index) => ({
            user_id: user.id,
            subject_slug: subjectSlug,
            titulo: item.titulo,
            conteudo: item.conteudo,
            created_at: new Date(createdAtBase - index).toISOString(),
          })),
        )
        .select("id, titulo, conteudo, created_at");

      if (migrateError) throw migrateError;

      await markLegacyStorageMigrated(storageKey, { supabase, userId: user.id });

      return [...rows, ...((migratedData ?? []) as ResumoRow[])]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map(mapResumoRow);
    },
  });

  const addMutation = useMutation({
    mutationFn: async (payload: { titulo: string; conteudo: string }) => {
      if (!supabase || !user) throw new Error("Sessao nao encontrada.");

      const { error } = await supabase.from("resumos").insert({
        user_id: user.id,
        subject_slug: subjectSlug,
        titulo: payload.titulo,
        conteudo: payload.conteudo,
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      setTitulo("");
      setConteudo("");
      await queryClient.invalidateQueries({ queryKey });
      toast.success("Resumo salvo.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const editMutation = useMutation({
    mutationFn: async (payload: { id: string; titulo: string; conteudo: string }) => {
      if (!supabase || !user) throw new Error("Sessao nao encontrada.");

      const { error } = await supabase
        .from("resumos")
        .update({
          titulo: payload.titulo,
          conteudo: payload.conteudo,
        })
        .eq("id", payload.id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey });
      toast.success("Resumo atualizado.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!supabase || !user) throw new Error("Sessao nao encontrada.");

      const { error } = await supabase
        .from("resumos")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey });
      toast.success("Resumo apagado.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const isBusy = addMutation.isPending || editMutation.isPending || deleteMutation.isPending;

  function add() {
    const nextTitulo = titulo.trim();

    if (!nextTitulo) return;

    addMutation.mutate({
      titulo: nextTitulo,
      conteudo: conteudo.trim(),
    });
  }

  function saveEdit(id: string) {
    const nextTitulo = eTit.trim();

    if (!nextTitulo) {
      toast.error("O titulo do resumo nao pode ficar vazio.");
      return;
    }

    editMutation.mutate({
      id,
      titulo: nextTitulo,
      conteudo: eCont.trim(),
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resumos</h1>
        <p className="text-sm text-muted-foreground">Disciplina: {disciplineName}</p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          <Input placeholder="Titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <Textarea
            placeholder="Conteudo"
            rows={4}
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
          />
          <Button onClick={add} disabled={isBusy}>
            <Plus className="mr-1 h-4 w-4" />
            {addMutation.isPending ? "Salvando..." : "Novo resumo"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando resumos...</p>}
        {!isLoading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum resumo ainda.</p>
        )}
        {items.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-5">
              {editing === r.id ? (
                <div className="space-y-2">
                  <Input value={eTit} onChange={(e) => setETit(e.target.value)} />
                  <Textarea rows={4} value={eCont} onChange={(e) => setECont(e.target.value)} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit(r.id)} disabled={isBusy}>
                      <Check className="mr-1 h-4 w-4" />
                      {editMutation.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(null)}
                      disabled={isBusy}
                    >
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
                        disabled={isBusy}
                        onClick={() => {
                          setEditing(r.id);
                          setETit(r.titulo);
                          setECont(r.conteudo);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={isBusy}
                        onClick={() => setDeleteTarget(r)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {r.conteudo}
                  </p>
                </>
              )}
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
        title="Apagar resumo"
        description={`Voce tem certeza que deseja apagar o resumo "${deleteTarget?.titulo ?? ""}"?`}
      />
    </div>
  );
}
