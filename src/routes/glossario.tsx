import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpenText, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Badge } from "@/components/ui/badge";
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

export const Route = createFileRoute("/glossario")({
  head: () => ({ meta: [{ title: "Glossario UX - UX Academy" }] }),
  component: Glossario,
});

type Termo = { id: string; termo: string; definicao: string };
type TermoRow = Termo & { created_at: string };

const STORAGE_KEY = "uxa-glossario";

const SEED: Termo[] = [
  { id: "s1", termo: "Stakeholder", definicao: "Pessoa ou grupo com interesse no projeto." },
  { id: "s2", termo: "Escopo", definicao: "Conjunto de entregas e limites de um projeto." },
  { id: "s3", termo: "Wireframe", definicao: "Esquema visual de baixa fidelidade de uma interface." },
  { id: "s4", termo: "Persona", definicao: "Representacao ficticia de um usuario tipico." },
  { id: "s5", termo: "User Flow", definicao: "Caminho que o usuario percorre para concluir uma tarefa." },
  { id: "s6", termo: "Design System", definicao: "Conjunto de padroes reutilizaveis de design e codigo." },
  { id: "s7", termo: "Scrum", definicao: "Framework agil baseado em sprints e papeis definidos." },
  { id: "s8", termo: "Kanban", definicao: "Metodo agil visual baseado em fluxo continuo." },
  { id: "s9", termo: "Usabilidade", definicao: "Facilidade de uso e eficiencia de uma interface." },
];

function getTermoSignature(item: { termo: string; definicao: string }) {
  return `${item.termo}\u0000${item.definicao}`;
}

function mapTermoRow(item: TermoRow): Termo {
  return {
    id: item.id,
    termo: item.termo,
    definicao: item.definicao,
  };
}

function Glossario() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();
  const [q, setQ] = useState("");
  const [termo, setTermo] = useState("");
  const [definicao, setDefinicao] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Termo | null>(null);
  const queryKey = ["glossario", user?.id];

  const { data: items = [], isLoading } = useQuery<Termo[]>({
    queryKey,
    enabled: Boolean(user && supabase),
    queryFn: async () => {
      if (!supabase || !user) return [];

      const { data, error } = await supabase
        .from("glossario")
        .select("id, termo, definicao, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as TermoRow[];

      if (!(await shouldMigrateLegacyStorage(STORAGE_KEY, { supabase, userId: user.id }))) {
        return rows.map(mapTermoRow);
      }

      const legacyItems = loadLegacyItems<Termo[]>(STORAGE_KEY, SEED);
      const remoteSignatures = new Set(rows.map((item) => getTermoSignature(item)));
      const missingLegacyItems = legacyItems.filter(
        (item) => !remoteSignatures.has(getTermoSignature(item)),
      );

      if (missingLegacyItems.length === 0) {
        await markLegacyStorageMigrated(STORAGE_KEY, { supabase, userId: user.id });
        return rows.map(mapTermoRow);
      }

      const createdAtBase = Date.now();
      const { data: migratedData, error: migrateError } = await supabase
        .from("glossario")
        .insert(
          missingLegacyItems.map((item, index) => ({
            user_id: user.id,
            termo: item.termo,
            definicao: item.definicao,
            created_at: new Date(createdAtBase - index).toISOString(),
          })),
        )
        .select("id, termo, definicao, created_at");

      if (migrateError) throw migrateError;

      await markLegacyStorageMigrated(STORAGE_KEY, { supabase, userId: user.id });

      return [...rows, ...((migratedData ?? []) as TermoRow[])]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map(mapTermoRow);
    },
  });

  const filtered = useMemo(
    () => items.filter((item) => (item.termo + item.definicao).toLowerCase().includes(q.toLowerCase())),
    [items, q],
  );

  const addMutation = useMutation({
    mutationFn: async (payload: { termo: string; definicao: string }) => {
      if (!supabase || !user) throw new Error("Sessao nao encontrada.");

      const { error } = await supabase.from("glossario").insert({
        user_id: user.id,
        termo: payload.termo,
        definicao: payload.definicao,
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      setTermo("");
      setDefinicao("");
      await queryClient.invalidateQueries({ queryKey });
      toast.success("Termo salvo no glossario.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!supabase || !user) throw new Error("Sessao nao encontrada.");

      const { error } = await supabase.from("glossario").delete().eq("id", id).eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey });
      toast.success("Termo apagado.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const isBusy = addMutation.isPending || deleteMutation.isPending;

  function add() {
    const nextTermo = termo.trim();

    if (!nextTermo) return;

    addMutation.mutate({
      termo: nextTermo,
      definicao: definicao.trim(),
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <section className="rounded-3xl border bg-gradient-to-br from-background via-background to-muted/40 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <BookOpenText className="h-3.5 w-3.5" />
              Base de conceitos
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Glossario UX</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Centralize termos importantes da pos, crie sua propria base de consulta e mantenha definicoes rapidas sempre a mao.
            </p>
          </div>
          <div className="flex gap-3">
            <Card className="min-w-[120px]">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Termos</div>
                <div className="mt-1 text-2xl font-semibold">{items.length}</div>
              </CardContent>
            </Card>
            <Card className="min-w-[120px]">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Resultados</div>
                <div className="mt-1 text-2xl font-semibold">{filtered.length}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Card className="mt-6 border-primary/10">
        <CardContent className="space-y-4 p-5">
          <div>
            <h2 className="text-lg font-semibold">Adicionar termo</h2>
            <p className="text-sm text-muted-foreground">
              Crie novos conceitos para consultar depois no seu acervo.
            </p>
          </div>
          <Input
            placeholder="Termo"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            disabled={isBusy}
          />
          <Textarea
            placeholder="Definicao"
            rows={4}
            value={definicao}
            onChange={(e) => setDefinicao(e.target.value)}
            disabled={isBusy}
          />
          <Button onClick={add} disabled={isBusy}>
            <Plus className="mr-1 h-4 w-4" />
            {addMutation.isPending ? "Salvando..." : "Adicionar termo"}
          </Button>
        </CardContent>
      </Card>

      <div className="relative mt-8">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-11 pl-9"
          placeholder="Pesquisar por termo ou definicao..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {isLoading && (
          <Card className="sm:col-span-2 border-dashed">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Carregando glossario...</p>
            </CardContent>
          </Card>
        )}

        {filtered.map((item) => (
          <Card key={item.id} className="transition hover:border-primary/30 hover:shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Badge variant="outline" className="font-medium">
                    {item.termo}
                  </Badge>
                  <p className="text-sm leading-6 text-muted-foreground">{item.definicao}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={isBusy}
                  onClick={() => setDeleteTarget(item)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isLoading && filtered.length === 0 && (
        <Card className="mt-6 border-dashed">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum termo encontrado para essa busca.</p>
          </CardContent>
        </Card>
      )}

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Apagar termo"
        description={`Voce deseja apagar o termo "${deleteTarget?.termo ?? ""}"?`}
      />
    </div>
  );
}
