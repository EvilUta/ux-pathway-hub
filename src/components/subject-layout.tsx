import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { BookOpen, Brain, FileText, FolderOpen, HelpCircle, LayoutDashboard, Target, TrendingUp } from "lucide-react";
import type { ComponentType } from "react";

type Item = { to: string; label: string; icon: ComponentType<{ className?: string }> };

export function SubjectLayout({ slug, nome }: { slug: string; nome: string }) {
  const base = `/materias/${slug}`;
  const items: Item[] = [
    { to: base, label: "Visão Geral", icon: LayoutDashboard },
    { to: `${base}/resumos`, label: "Resumos", icon: FileText },
    { to: `${base}/flashcards`, label: "Flashcards", icon: Brain },
    { to: `${base}/questoes`, label: "Questões", icon: HelpCircle },
    { to: `${base}/materiais`, label: "Materiais", icon: FolderOpen },
    { to: `${base}/revisoes`, label: "Revisões", icon: Target },
    { to: `${base}/progresso`, label: "Progresso", icon: TrendingUp },
  ];

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[240px_1fr]">
      <aside className="md:sticky md:top-20 md:self-start">
        <div className="mb-4 flex items-center gap-2 px-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">{nome}</h2>
        </div>
        <nav className="flex flex-col gap-1">
          {items.map((it) => {
            const active = pathname === it.to || (it.to !== base && pathname.startsWith(it.to));
            const isVisaoGeral = it.to === base;
            const isActive = isVisaoGeral ? pathname === base : active;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
