import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarClock, Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import {
  loadLegacyItems,
  markLegacyStorageMigrated,
  shouldMigrateLegacyStorage,
} from "@/lib/supabase-legacy";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Periodo = 1 | 7 | 30;
type Revisao = { id: string; titulo: string; criadoEm: number; revisarEm: number; feito: boolean };
type RevisaoRow = {
  id: string;
  titulo: string;
  criado_em: string | number;
  revisar_em: string | number;
  feito: boolean;
  created_at: string;
};

const LABEL: Record<Periodo, string> = { 1: "Amanha", 7: "Em 7 dias", 30: "Em 30 dias" };

function normalizeRevisionTimestamp(value: string | number) {
  if (typeof value === "number") return value;

  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) return numericValue;

  const parsedValue = Date.parse(value);
  return Number.isFinite(parsedValue) ? parsedValue : Date.now();
}

function getRevisaoSignature(item: {
  titulo: string;
  criadoEm: number;
  revisarEm: number;
  feito: boolean;
}) {
  return `${item.titulo}\u0000${item.criadoEm}\u0000${item.revisarEm}\u0000${item.feito}`;
}

function mapRevisaoRow(item: RevisaoRow): Revisao {
  return {
    id: item.id,
    titulo: item.titulo,
    criadoEm: normalizeRevisionTimestamp(item.criado_em),
    revisarEm: normalizeRevisionTimestamp(item.revisar_em),
    feito: item.feito,
  };
}

export function SubjectRevisoesPage({
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
  const [periodo, setPeriodo] = useState<Periodo>(1);
  const [deleteTarget, setDeleteTarget] = useState<Revisao | null>(null);
  const now = Date.now();
  const queryKey = ["revisoes", user?.id, subjectSlug];

  const { data: items = [], isLoading } = useQuery<Revisao[]>({
    queryKey,
    enabled: Boolean(user && supabase),
    queryFn: async () => {
      if (!supabase || !user) return [];

      const { data, error } = await supabase
        .from("revisoes")
        .select("id, titulo, criado_em, revisar_em, feito, created_at")
        .eq("user_id", user.id)
        .eq("subject_slug", subjectSlug)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as RevisaoRow[];

      if (!(await shouldMigrateLegacyStorage(storageKey, { supabase, userId: user.id }))) {
        return rows.map(mapRevisaoRow);
      }

      const legacyItems = loadLegacyItems<Revisao[]>(storageKey, []);

      if (legacyItems.length === 0) {
        await markLegacyStorageMigrated(storageKey, { supabase, userId: user.id });
        return rows.map(mapRevisaoRow);
      }

      const remoteSignatures = new Set(rows.map((item) => getRevisaoSignature(mapRevisaoRow(item))));
      const missingLegacyItems = legacyItems.filter(
        (item) => !remoteSignatures.has(getRevisaoSignature(item)),
      );

      if (missingLegacyItems.length === 0) {
        await markLegacyStorageMigrated(storageKey, { supabase, userId: user.id });
        return rows.map(mapRevisaoRow);
      }

      const createdAtBase = Date.now();
      const { data: migratedData, error: migrateError } = await supabase
        .from("revisoes")
        .insert(
          missingLegacyItems.map((item, index) => ({
            user_id: user.id,
            subject_slug: subjectSlug,
            titulo: item.titulo,
            criado_em: item.criadoEm,
            revisar_em: item.revisarEm,
            feito: item.feito,
            created_at: new Date(createdAtBase - index).toISOString(),
          })),
        )
        .select("id, titulo, criado_em, revisar_em, feito, created_at");

      if (migrateError) throw migrateError;

      await markLegacyStorageMigrated(storageKey, { supabase, userId: user.id });

      return [...rows, ...((migratedData ?? []) as RevisaoRow[])]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map(mapRevisaoRow);
    },
  });

  const addMutation = useMutation({
    mutationFn: async (payload: { titulo: string; criadoEm: number; revisarEm: number }) => {
      if (!supabase || !user) throw new Error("Sessao nao encontrada.");

      const { error } = await supabase.from("revisoes").insert({
        user_id: user.id,
        subject_slug: subjectSlug,
        titulo: payload.titulo,
        criado_em: payload.criadoEm,
        revisar_em: payload.revisarEm,
        feito: false,
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      setTitulo("");
      setPeriodo(1);
      await queryClient.invalidateQueries({ queryKey });
      toast.success("Revisao agendada.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!supabase || !user) throw new Error("Sessao nao encontrada.");

      const { error } = await supabase
        .from("revisoes")
        .update({ feito: true })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      toast.success("Revisao concluida.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!supabase || !user) throw new Error("Sessao nao encontrada.");

      const { error } = await supabase
        .from("revisoes")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey });
      toast.success("Revisao apagada.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const isBusy = addMutation.isPending || completeMutation.isPending || deleteMutation.isPending;
  const pendentes = items.filter((item) => !item.feito).sort((a, b) => a.revisarEm - b.revisarEm);
  const concluidas = items.filter((item) => item.feito);

  function add() {
    const nextTitulo = titulo.trim();

    if (!nextTitulo) return;

    addMutation.mutate({
      titulo: nextTitulo,
      criadoEm: now,
      revisarEm: now + periodo * 86400000,
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Revisoes</h1>
        <p className="text-sm text-muted-foreground">Disciplina: {disciplineName}</p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          <Input
            placeholder="O que revisar?"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            disabled={isBusy}
          />
          <div className="flex flex-wrap gap-2">
            {([1, 7, 30] as Periodo[]).map((item) => (
              <Button
                key={item}
                type="button"
                variant={periodo === item ? "default" : "outline"}
                size="sm"
                disabled={isBusy}
                onClick={() => setPeriodo(item)}
              >
                <CalendarClock className="mr-1 h-4 w-4" />
                {LABEL[item]}
              </Button>
            ))}
          </div>
          <Button onClick={add} disabled={isBusy}>
            <Plus className="mr-1 h-4 w-4" />
            {addMutation.isPending ? "Salvando..." : "Agendar revisao"}
          </Button>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 font-semibold">Pendentes ({pendentes.length})</h2>
        <div className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando revisoes...</p>}
          {pendentes.map((item) => {
            const due = item.revisarEm <= now;
            return (
              <Card key={item.id}>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{item.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.revisarEm).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {due && <Badge variant="destructive">Hoje</Badge>}
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={isBusy}
                      onClick={() => completeMutation.mutate(item.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
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
            );
          })}
          {!isLoading && pendentes.length === 0 && (
            <p className="text-sm text-muted-foreground">Nada para revisar.</p>
          )}
        </div>
      </section>

      {concluidas.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-muted-foreground">Concluidas</h2>
          <div className="space-y-2">
            {concluidas.map((item) => (
              <Card key={item.id} className="opacity-70">
                <CardContent className="flex items-center justify-between p-4">
                  <p className="line-through">{item.titulo}</p>
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
        </section>
      )}

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Apagar revisao"
        description={`Voce tem certeza que deseja apagar a revisao "${deleteTarget?.titulo ?? ""}"?`}
      />
    </div>
  );
}
