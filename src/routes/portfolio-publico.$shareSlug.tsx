import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Eye, Share2 } from "lucide-react";

import { PortfolioPreview } from "@/components/portfolio-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getPortfolioEmbedUrl,
  getPortfolioTypeLabel,
  PORTFOLIO_ICONS,
  type PortfolioItem,
  type PortfolioTipo,
} from "@/lib/portfolio-real";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export const Route = createFileRoute("/portfolio-publico/$shareSlug")({
  head: () => ({
    meta: [{ title: "Portfolio Publico" }],
  }),
  component: PublicPortfolioPage,
});

type PublicPortfolioRow = {
  share_slug: string;
  share_title: string | null;
  share_description: string | null;
  item_id: string | null;
  item_tipo: PortfolioTipo | null;
  item_titulo: string | null;
  item_url: string | null;
  item_created_at: string | null;
};

function PublicPortfolioPage() {
  const { shareSlug } = Route.useParams();
  const supabase = getSupabaseBrowserClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-portfolio", shareSlug],
    enabled: Boolean(supabase && shareSlug),
    queryFn: async () => {
      if (!supabase) return null;

      const { data: rows, error: rpcError } = await supabase.rpc("get_public_portfolio_share", {
        p_share_slug: shareSlug,
      });

      if (rpcError) throw rpcError;

      const typedRows = (rows ?? []) as PublicPortfolioRow[];

      if (typedRows.length === 0) {
        return null;
      }

      const firstRow = typedRows[0];
      const items: PortfolioItem[] = typedRows
        .filter(
          (row): row is PublicPortfolioRow & {
            item_id: string;
            item_tipo: PortfolioTipo;
            item_titulo: string;
            item_url: string;
          } =>
            Boolean(row.item_id && row.item_tipo && row.item_titulo && row.item_url),
        )
        .map((row) => ({
          id: row.item_id,
          tipo: row.item_tipo,
          titulo: row.item_titulo,
          url: row.item_url,
        }));

      return {
        title: firstRow.share_title ?? "Portfolio Publico",
        description:
          firstRow.share_description ??
          "Selecao publica dos projetos e entregas desenvolvidos durante a pos-graduacao.",
        items,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm text-muted-foreground">Carregando portfolio publico...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Card className="border-dashed">
          <CardContent className="space-y-3 p-8 text-center">
            <h1 className="text-2xl font-semibold">Link indisponivel</h1>
            <p className="text-sm text-muted-foreground">
              Este portfolio nao foi encontrado ou o compartilhamento publico esta desativado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-3xl border bg-gradient-to-br from-background via-background to-muted/40 p-6 shadow-sm">
        <div className="space-y-4">
          <Badge variant="outline" className="inline-flex items-center gap-2 font-medium">
            <Share2 className="h-3.5 w-3.5" />
            Portfolio publico
          </Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{data.title}</h1>
            <p className="text-sm text-muted-foreground">Pagina publica compartilhada para apresentacao do portfolio.</p>
            <p className="max-w-3xl text-sm text-muted-foreground">{data.description}</p>
          </div>
        </div>
      </section>

      <div className="mt-8 space-y-6">
        {data.items.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum item publico foi adicionado ao portfolio ainda.
              </p>
            </CardContent>
          </Card>
        )}

        {data.items.map((item) => {
          const Icon = PORTFOLIO_ICONS[item.tipo];
          const embedUrl = getPortfolioEmbedUrl(item);

          return (
            <Card key={item.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{item.titulo}</h2>
                    <p className="text-sm text-muted-foreground">{getPortfolioTypeLabel(item.tipo)}</p>
                  </div>
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
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
