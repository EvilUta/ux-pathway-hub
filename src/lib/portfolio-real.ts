import { FileText, Globe, PenTool, type LucideIcon } from "lucide-react";

export type PortfolioTipo = "figma" | "pdf" | "site";

export type PortfolioItem = {
  id: string;
  tipo: PortfolioTipo;
  titulo: string;
  url: string;
};

export type PortfolioItemRow = PortfolioItem & { created_at: string };

export const PORTFOLIO_TABLE = "portfolio_real";
export const LEGACY_PORTFOLIO_TABLE = "portfolio";
export const PORTFOLIO_SHARE_TABLE = "portfolio_shares";

export const PORTFOLIO_ICONS: Record<PortfolioTipo, LucideIcon> = {
  figma: PenTool,
  pdf: FileText,
  site: Globe,
};

export function getPortfolioItemSignature(item: {
  tipo: PortfolioTipo;
  titulo: string;
  url: string;
}) {
  return `${item.tipo}\u0000${item.titulo}\u0000${item.url}`;
}

export function getPortfolioEmbedUrl(item: PortfolioItem) {
  if (item.tipo === "figma") {
    return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(item.url)}`;
  }

  return item.url;
}

export function getPortfolioTypeLabel(tipo: PortfolioTipo) {
  if (tipo === "pdf") return "PDF aberto";
  if (tipo === "figma") return "Player do Figma";
  return "Site / landing page";
}

export function generatePortfolioShareSlug(userId: string) {
  return `portfolio-${userId.slice(0, 6)}-${Math.random().toString(36).slice(2, 8)}`;
}
