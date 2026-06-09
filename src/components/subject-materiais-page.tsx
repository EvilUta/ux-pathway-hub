import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ExternalLink,
  FileText,
  Link as LinkIcon,
  NotebookPen,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import {
  loadLegacyItems,
  markLegacyStorageMigrated,
  shouldMigrateLegacyStorage,
} from "@/lib/supabase-legacy";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Tipo = "link" | "pdf" | "video" | "anotacao";
type Material = { id: string; tipo: Tipo; titulo: string; valor: string };
type MaterialRow = { id: string; tipo: Tipo; titulo: string; valor: string; created_at: string };

function getMaterialSignature(item: { tipo: Tipo; titulo: string; valor: string }) {
  return `${item.tipo}\u0000${item.titulo}\u0000${item.valor}`;
}

const ICON: Record<Tipo, typeof LinkIcon> = {
  anotacao: NotebookPen,
  link: LinkIcon,
  pdf: FileText,
  video: Video,
};

export function SubjectMateriaisPage({
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
  const [tipo, setTipo] = useState<Tipo>("link");
  const [titulo, setTitulo] = useState("");
  const [valor, setValor] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const queryKey = ["materiais", user?.id, subjectSlug];

  const { data: items = [], isLoading } = useQuery<Material[]>({
    queryKey,
    enabled: Boolean(user && supabase),
    queryFn: async () => {
      if (!supabase || !user) return [];

      const { data, error } = await supabase
        .from("materiais")
        .select("id, tipo, titulo, valor, created_at")
        .eq("user_id", user.id)
        .eq("subject_slug", subjectSlug)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as MaterialRow[];

      if (!(await shouldMigrateLegacyStorage(storageKey, { supabase, userId: user.id }))) {
        return rows.map((item) => ({
          id: item.id,
          tipo: item.tipo,
          titulo: item.titulo,
          valor: item.valor,
        }));
      }

      const legacyItems = loadLegacyItems<Material[]>(storageKey, []);

      if (legacyItems.length === 0) {
        await markLegacyStorageMigrated(storageKey, { supabase, userId: user.id });
        return rows.map((item) => ({
          id: item.id,
          tipo: item.tipo,
          titulo: item.titulo,
          valor: item.valor,
        }));
      }

      const remoteSignatures = new Set(rows.map((item) => getMaterialSignature(item)));
      const missingLegacyItems = legacyItems.filter(
        (item) => !remoteSignatures.has(getMaterialSignature(item)),
      );

      if (missingLegacyItems.length === 0) {
        await markLegacyStorageMigrated(storageKey, { supabase, userId: user.id });
        return rows.map((item) => ({
          id: item.id,
          tipo: item.tipo,
          titulo: item.titulo,
          valor: item.valor,
        }));
      }

      const createdAtBase = Date.now();
      const { data: migratedData, error: migrateError } = await supabase
        .from("materiais")
        .insert(
          missingLegacyItems.map((item, index) => ({
            user_id: user.id,
            subject_slug: subjectSlug,
            tipo: item.tipo,
            titulo: item.titulo,
            valor: item.valor,
            created_at: new Date(createdAtBase - index).toISOString(),
          })),
        )
        .select("id, tipo, titulo, valor, created_at");

      if (migrateError) throw migrateError;

      await markLegacyStorageMigrated(storageKey, { supabase, userId: user.id });

      return [...rows, ...((migratedData ?? []) as MaterialRow[])]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((item) => ({
          id: item.id,
          tipo: item.tipo,
          titulo: item.titulo,
          valor: item.valor,
        }));
    },
  });

  const addMutation = useMutation({
    mutationFn: async (payload: { tipo: Tipo; titulo: string; valor: string }) => {
      if (!supabase || !user) throw new Error("Sessao nao encontrada.");

      const { error } = await supabase.from("materiais").insert({
        user_id: user.id,
        subject_slug: subjectSlug,
        tipo: payload.tipo,
        titulo: payload.titulo,
        valor: payload.valor,
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      setTipo("link");
      setTitulo("");
      setValor("");
      await queryClient.invalidateQueries({ queryKey });
      toast.success("Material salvo.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!supabase || !user) throw new Error("Sessao nao encontrada.");

      const { error } = await supabase
        .from("materiais")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey });
      toast.success("Material apagado.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const isBusy = addMutation.isPending || deleteMutation.isPending;

  function add() {
    const nextTitulo = titulo.trim();

    if (!nextTitulo) return;

    addMutation.mutate({
      tipo,
      titulo: nextTitulo,
      valor: valor.trim(),
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Materiais</h1>
        <p className="text-sm text-muted-foreground">Disciplina: {disciplineName}</p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          <Select value={tipo} onValueChange={(value) => setTipo(value as Tipo)} disabled={isBusy}>
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
          <Input
            placeholder="Título"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            disabled={isBusy}
          />
          {tipo === "anotacao" ? (
            <Textarea
              placeholder="Conteúdo da anotação"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              disabled={isBusy}
            />
          ) : (
            <Input
              placeholder="URL"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              disabled={isBusy}
            />
          )}
          <Button onClick={add} disabled={isBusy}>
            <Plus className="mr-1 h-4 w-4" />
            {addMutation.isPending ? "Salvando..." : "Adicionar"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando materiais...</p>}
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
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {item.valor}
                    </p>
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
          );
        })}
        {!isLoading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum material salvo.</p>
        )}
      </div>

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Apagar material"
        description={`Você tem certeza que deseja apagar o material "${deleteTarget?.titulo ?? ""}"?`}
      />
    </div>
  );
}
