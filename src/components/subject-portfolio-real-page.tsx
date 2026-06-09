import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, ExternalLink, Eye, Plus, Share2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { PortfolioPreview } from "@/components/portfolio-preview";
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
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import {
  generatePortfolioShareSlug,
  getPortfolioEmbedUrl,
  getPortfolioItemSignature,
  getPortfolioTypeLabel,
  LEGACY_PORTFOLIO_TABLE,
  PORTFOLIO_ICONS,
  PORTFOLIO_SHARE_TABLE,
  PORTFOLIO_TABLE,
  type PortfolioItem,
  type PortfolioItemRow,
  type PortfolioTipo,
} from "@/lib/portfolio-real";
import {
  loadLegacyItems,
  markLegacyStorageMigrated,
  shouldMigrateLegacyStorage,
} from "@/lib/supabase-legacy";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type PortfolioShareRow = {
  share_slug: string;
  title: string | null;
  description: string | null;
  is_public: boolean;
};

let resolvedPortfolioTable: typeof PORTFOLIO_TABLE | typeof LEGACY_PORTFOLIO_TABLE | null = null;

function isMissingTableError(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return message.includes("could not find the table") || message.includes("relation");
}

async function fetchPortfolioRows(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
  userId: string,
  subjectSlug: string,
) {
  if (resolvedPortfolioTable === LEGACY_PORTFOLIO_TABLE) {
    const legacyResult = await supabase
      .from(LEGACY_PORTFOLIO_TABLE)
      .select("id, tipo, titulo, url, created_at")
      .eq("user_id", userId)
      .eq("subject_slug", subjectSlug)
      .order("created_at", { ascending: false });

    if (legacyResult.error) throw legacyResult.error;
    return (legacyResult.data ?? []) as PortfolioItemRow[];
  }

  const primaryResult = await supabase
    .from(PORTFOLIO_TABLE)
    .select("id, tipo, titulo, url, created_at")
    .eq("user_id", userId)
    .eq("subject_slug", subjectSlug)
    .order("created_at", { ascending: false });

  if (!primaryResult.error) {
    resolvedPortfolioTable = PORTFOLIO_TABLE;
    return (primaryResult.data ?? []) as PortfolioItemRow[];
  }

  if (!isMissingTableError(primaryResult.error)) {
    throw primaryResult.error;
  }

  const legacyResult = await supabase
    .from(LEGACY_PORTFOLIO_TABLE)
    .select("id, tipo, titulo, url, created_at")
    .eq("user_id", userId)
    .eq("subject_slug", subjectSlug)
    .order("created_at", { ascending: false });

  if (legacyResult.error) throw legacyResult.error;

  resolvedPortfolioTable = LEGACY_PORTFOLIO_TABLE;
  return (legacyResult.data ?? []) as PortfolioItemRow[];
}

async function insertPortfolioItems(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
  rows: Array<{
    user_id: string;
    subject_slug: string;
    tipo: PortfolioTipo;
    titulo: string;
    url: string;
    created_at?: string;
  }>,
) {
  if (resolvedPortfolioTable === LEGACY_PORTFOLIO_TABLE) {
    const legacyResult = await supabase
      .from(LEGACY_PORTFOLIO_TABLE)
      .insert(rows)
      .select("id, tipo, titulo, url, created_at");

    if (legacyResult.error) throw legacyResult.error;
    return (legacyResult.data ?? []) as PortfolioItemRow[];
  }

  const primaryResult = await supabase
    .from(PORTFOLIO_TABLE)
    .insert(rows)
    .select("id, tipo, titulo, url, created_at");

  if (!primaryResult.error) {
    resolvedPortfolioTable = PORTFOLIO_TABLE;
    return (primaryResult.data ?? []) as PortfolioItemRow[];
  }

  if (!isMissingTableError(primaryResult.error)) {
    throw primaryResult.error;
  }

  const legacyResult = await supabase
    .from(LEGACY_PORTFOLIO_TABLE)
    .insert(rows)
    .select("id, tipo, titulo, url, created_at");

  if (legacyResult.error) throw legacyResult.error;

  resolvedPortfolioTable = LEGACY_PORTFOLIO_TABLE;
  return (legacyResult.data ?? []) as PortfolioItemRow[];
}

async function deletePortfolioItem(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
  userId: string,
  id: string,
) {
  if (resolvedPortfolioTable === LEGACY_PORTFOLIO_TABLE) {
    const legacyResult = await supabase
      .from(LEGACY_PORTFOLIO_TABLE)
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (legacyResult.error) throw legacyResult.error;
    return;
  }

  const primaryResult = await supabase.from(PORTFOLIO_TABLE).delete().eq("id", id).eq("user_id", userId);

  if (!primaryResult.error) {
    resolvedPortfolioTable = PORTFOLIO_TABLE;
    return;
  }

  if (!isMissingTableError(primaryResult.error)) {
    throw primaryResult.error;
  }

  const legacyResult = await supabase
    .from(LEGACY_PORTFOLIO_TABLE)
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (legacyResult.error) throw legacyResult.error;

  resolvedPortfolioTable = LEGACY_PORTFOLIO_TABLE;
}

export function SubjectPortfolioRealPage({
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
  const [tipo, setTipo] = useState<PortfolioTipo>("pdf");
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PortfolioItem | null>(null);
  const [shareTitle, setShareTitle] = useState("Portfolio Real");
  const [shareDescription, setShareDescription] = useState(
    "Selecao publica dos projetos e entregas desenvolvidos durante a pos-graduacao.",
  );

  const queryKey = ["portfolio-real", user?.id, subjectSlug];
  const shareQueryKey = ["portfolio-share", user?.id, subjectSlug];

  const { data: items = [], isLoading } = useQuery<PortfolioItem[]>({
    queryKey,
    enabled: Boolean(user && supabase),
    queryFn: async () => {
      if (!supabase || !user) return [];

      const rows = await fetchPortfolioRows(supabase, user.id, subjectSlug);

      if (!(await shouldMigrateLegacyStorage(storageKey, { supabase, userId: user.id }))) {
        return rows.map((item) => ({
          id: item.id,
          tipo: item.tipo,
          titulo: item.titulo,
          url: item.url,
        }));
      }

      const legacyItems = loadLegacyItems<PortfolioItem[]>(storageKey, []);

      if (legacyItems.length === 0) {
        await markLegacyStorageMigrated(storageKey, { supabase, userId: user.id });
        return rows.map((item) => ({
          id: item.id,
          tipo: item.tipo,
          titulo: item.titulo,
          url: item.url,
        }));
      }

      const remoteSignatures = new Set(rows.map((item) => getPortfolioItemSignature(item)));
      const missingLegacyItems = legacyItems.filter(
        (item) => !remoteSignatures.has(getPortfolioItemSignature(item)),
      );

      if (missingLegacyItems.length === 0) {
        await markLegacyStorageMigrated(storageKey, { supabase, userId: user.id });
        return rows.map((item) => ({
          id: item.id,
          tipo: item.tipo,
          titulo: item.titulo,
          url: item.url,
        }));
      }

      const createdAtBase = Date.now();
      const migratedData = await insertPortfolioItems(
        supabase,
        missingLegacyItems.map((item, index) => ({
          user_id: user.id,
          subject_slug: subjectSlug,
          tipo: item.tipo,
          titulo: item.titulo,
          url: item.url,
          created_at: new Date(createdAtBase - index).toISOString(),
        })),
      );

      await markLegacyStorageMigrated(storageKey, { supabase, userId: user.id });

      return [...rows, ...migratedData]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((item) => ({
          id: item.id,
          tipo: item.tipo,
          titulo: item.titulo,
          url: item.url,
        }));
    },
  });

  const { data: shareConfig, isLoading: isLoadingShare } = useQuery<PortfolioShareRow | null>({
    queryKey: shareQueryKey,
    enabled: Boolean(user && supabase),
    queryFn: async () => {
      if (!supabase || !user) return null;

      const { data, error } = await supabase
        .from(PORTFOLIO_SHARE_TABLE)
        .select("share_slug, title, description, is_public")
        .eq("user_id", user.id)
        .eq("subject_slug", subjectSlug)
        .maybeSingle();

      if (error) throw error;

      return (data ?? null) as PortfolioShareRow | null;
    },
  });

  useEffect(() => {
    if (!shareConfig) return;

    setShareTitle(shareConfig.title ?? "Portfolio Real");
    setShareDescription(
      shareConfig.description ??
        "Selecao publica dos projetos e entregas desenvolvidos durante a pos-graduacao.",
    );
  }, [shareConfig]);

  const addMutation = useMutation({
    mutationFn: async (payload: { tipo: PortfolioTipo; titulo: string; url: string }) => {
      if (!supabase || !user) throw new Error("Sessao nao encontrada.");

      await insertPortfolioItems(supabase, [
        {
          user_id: user.id,
          subject_slug: subjectSlug,
          tipo: payload.tipo,
          titulo: payload.titulo,
          url: payload.url,
        },
      ]);
    },
    onSuccess: async () => {
      setTipo("pdf");
      setTitulo("");
      setUrl("");
      await queryClient.invalidateQueries({ queryKey });
      toast.success("Item salvo no portfolio.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!supabase || !user) throw new Error("Sessao nao encontrada.");

      await deletePortfolioItem(supabase, user.id, id);
    },
    onSuccess: async () => {
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey });
      toast.success("Item apagado do portfolio.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const shareMutation = useMutation({
    mutationFn: async (payload: {
      isPublic: boolean;
      title: string;
      description: string;
    }) => {
      if (!supabase || !user) throw new Error("Sessao nao encontrada.");

      const shareSlug = shareConfig?.share_slug ?? generatePortfolioShareSlug(user.id);

      const { error } = await supabase.from(PORTFOLIO_SHARE_TABLE).upsert(
        {
          user_id: user.id,
          subject_slug: subjectSlug,
          share_slug: shareSlug,
          title: payload.title,
          description: payload.description,
          is_public: payload.isPublic,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,subject_slug" },
      );

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: shareQueryKey });
      toast.success("Configuracao de compartilhamento salva.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const isBusy = addMutation.isPending || deleteMutation.isPending || shareMutation.isPending;

  const shareUrl = useMemo(() => {
    if (!shareConfig?.share_slug || typeof window === "undefined") return "";
    return `${window.location.origin}/portfolio-publico/${shareConfig.share_slug}`;
  }, [shareConfig?.share_slug]);

  function add() {
    const nextTitulo = titulo.trim();
    const nextUrl = url.trim();

    if (!nextTitulo || !nextUrl) return;

    addMutation.mutate({
      tipo,
      titulo: nextTitulo,
      url: nextUrl,
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  }

  function saveShareSettings(nextIsPublic: boolean) {
    shareMutation.mutate({
      isPublic: nextIsPublic,
      title: shareTitle.trim() || "Portfolio Real",
      description: shareDescription.trim(),
    });
  }

  async function copyShareLink() {
    if (!shareUrl) {
      toast.message("Salve a configuracao do compartilhamento primeiro.");
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link publico copiado.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Portfolio Real</h1>
        <p className="text-sm text-muted-foreground">Disciplina: {disciplineName}</p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          <Select
            value={tipo}
            onValueChange={(value) => setTipo(value as PortfolioTipo)}
            disabled={isBusy}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF aberto</SelectItem>
              <SelectItem value="figma">Link do Figma</SelectItem>
              <SelectItem value="site">Site / landing page</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Titulo do projeto"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            disabled={isBusy}
          />
          <Input
            placeholder={
              tipo === "figma"
                ? "Cole o link do Figma"
                : tipo === "pdf"
                  ? "Cole o link do PDF"
                  : "Cole o link do site"
            }
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isBusy}
          />

          <Button onClick={add} disabled={isBusy}>
            <Plus className="mr-1 h-4 w-4" />
            {addMutation.isPending ? "Salvando..." : "Adicionar item ao portfolio"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Share2 className="h-4 w-4" />
                Compartilhamento publico
              </h2>
              <p className="text-sm text-muted-foreground">
                Compartilhe uma pagina unica com todos os itens do portfolio, sem liberar as outras areas do sistema.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
              <span className="text-sm text-muted-foreground">Ativo</span>
              <Switch
                checked={shareConfig?.is_public ?? false}
                disabled={isBusy || isLoadingShare}
                onCheckedChange={(checked) => saveShareSettings(checked)}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Titulo da pagina publica"
              value={shareTitle}
              onChange={(e) => setShareTitle(e.target.value)}
              disabled={isBusy}
            />
            <Input
              placeholder="Breve descricao"
              value={shareDescription}
              onChange={(e) => setShareDescription(e.target.value)}
              disabled={isBusy}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => saveShareSettings(shareConfig?.is_public ?? true)}
            >
              Salvar configuracao
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isBusy || !shareConfig?.share_slug}
              onClick={copyShareLink}
            >
              <Copy className="mr-1 h-4 w-4" />
              Copiar link
            </Button>
            {shareConfig?.share_slug && (
              <Button asChild type="button" disabled={isBusy}>
                <a href={`/portfolio-publico/${shareConfig.share_slug}`} target="_blank" rel="noreferrer">
                  <Eye className="mr-1 h-4 w-4" />
                  Abrir pagina publica
                </a>
              </Button>
            )}
          </div>

          {shareConfig?.share_slug && (
            <div className="rounded-lg border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              Link publico: <span className="font-medium text-foreground">{shareUrl}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Carregando itens do portfolio...</p>
        )}
        {!isLoading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum item no portfolio ainda. Cadastre um PDF, um projeto no Figma ou um site final.
          </p>
        )}

        {items.map((item) => {
          const Icon = PORTFOLIO_ICONS[item.tipo];
          const embedUrl = getPortfolioEmbedUrl(item);

          return (
            <Card key={item.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{item.titulo}</h3>
                      <p className="text-sm text-muted-foreground">{getPortfolioTypeLabel(item.tipo)}</p>
                    </div>
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

                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={item.url} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-1 h-4 w-4" />
                      Abrir original
                    </a>
                  </Button>
                  <Button asChild size="sm">
                    <a href={embedUrl} target="_blank" rel="noreferrer">
                      <Eye className="mr-1 h-4 w-4" />
                      Abrir preview
                    </a>
                  </Button>
                </div>

                <PortfolioPreview embedUrl={embedUrl} title={item.titulo} />

                <p className="text-xs text-muted-foreground">
                  Se o preview nao aparecer por bloqueio do site ou do arquivo, voce ainda pode abrir o link original acima.
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Apagar item do portfolio"
        description={`Voce tem certeza que deseja apagar o item "${deleteTarget?.titulo ?? ""}"?`}
      />
    </div>
  );
}
