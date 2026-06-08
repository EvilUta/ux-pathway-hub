import { useEffect, useRef, useState } from "react";
import { ExternalLink, Eye, Expand, FileText, Globe, Minimize, PenTool, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { useLocalStorage, uid } from "@/lib/storage";

type PortfolioTipo = "figma" | "pdf" | "site";
type PortfolioItem = {
  id: string;
  tipo: PortfolioTipo;
  titulo: string;
  url: string;
};

const ICONS: Record<PortfolioTipo, typeof FileText> = {
  figma: PenTool,
  pdf: FileText,
  site: Globe,
};

function getEmbedUrl(item: PortfolioItem) {
  if (item.tipo === "figma") {
    return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(item.url)}`;
  }

  return item.url;
}

function PortfolioPreview({ embedUrl, title }: { embedUrl: string; title: string }) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === previewRef.current);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  async function toggleFullscreen() {
    if (!previewRef.current) return;

    if (document.fullscreenElement === previewRef.current) {
      await document.exitFullscreen();
      return;
    }

    await previewRef.current.requestFullscreen();
  }

  return (
    <div
      ref={previewRef}
      className={`overflow-hidden rounded-xl border bg-muted/20 ${isFullscreen ? "bg-background p-4" : ""}`}
    >
      <div className="flex items-center justify-end border-b bg-background/80 px-3 py-2">
        <Button type="button" variant="outline" size="sm" onClick={toggleFullscreen}>
          {isFullscreen ? (
            <>
              <Minimize className="mr-1 h-4 w-4" />
              Sair do full screen
            </>
          ) : (
            <>
              <Expand className="mr-1 h-4 w-4" />
              Full screen
            </>
          )}
        </Button>
      </div>
      <iframe
        title={`${title}-preview`}
        src={embedUrl}
        className={`w-full bg-background ${isFullscreen ? "h-[calc(100vh-7rem)]" : "h-[520px]"}`}
      />
    </div>
  );
}

export function SubjectPortfolioRealPage({
  disciplineName,
  storageKey,
}: {
  disciplineName: string;
  storageKey: string;
}) {
  const [items, setItems] = useLocalStorage<PortfolioItem[]>(storageKey, []);
  const [tipo, setTipo] = useState<PortfolioTipo>("pdf");
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PortfolioItem | null>(null);

  const add = () => {
    if (!titulo.trim() || !url.trim()) return;
    setItems([{ id: uid(), tipo, titulo: titulo.trim(), url: url.trim() }, ...items]);
    setTitulo("");
    setUrl("");
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setItems(items.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Portfólio Real</h1>
        <p className="text-sm text-muted-foreground">Disciplina: {disciplineName}</p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          <Select value={tipo} onValueChange={(value) => setTipo(value as PortfolioTipo)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF aberto</SelectItem>
              <SelectItem value="figma">Link do Figma</SelectItem>
              <SelectItem value="site">Site / landing page</SelectItem>
            </SelectContent>
          </Select>

          <Input placeholder="Título do projeto" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <Input
            placeholder={tipo === "figma" ? "Cole o link do Figma" : tipo === "pdf" ? "Cole o link do PDF" : "Cole o link do site"}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <Button onClick={add}>
            <Plus className="mr-1 h-4 w-4" />
            Adicionar item ao portfólio
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum item no portfólio ainda. Cadastre um PDF, um projeto no Figma ou um site final.
          </p>
        )}

        {items.map((item) => {
          const Icon = ICONS[item.tipo];
          const embedUrl = getEmbedUrl(item);

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
                      <p className="text-sm text-muted-foreground">
                        {item.tipo === "pdf" && "PDF aberto"}
                        {item.tipo === "figma" && "Player do Figma"}
                        {item.tipo === "site" && "Site / landing page"}
                      </p>
                    </div>
                  </div>

                  <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(item)}>
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
                  Se o preview não aparecer por bloqueio do site ou do arquivo, você ainda pode abrir o link original acima.
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Apagar item do portfólio"
        description={`Você tem certeza que deseja apagar o item "${deleteTarget?.titulo ?? ""}"?`}
      />
    </div>
  );
}
