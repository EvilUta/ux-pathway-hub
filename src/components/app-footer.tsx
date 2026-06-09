import { Github, GraduationCap } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-3 text-xs text-muted-foreground md:hidden">
        <a
          href="https://github.com/EvilUta"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-1 font-medium text-foreground hover:text-primary"
        >
          <Github className="h-3.5 w-3.5" />
          Github EvilUta
        </a>
      </div>

      <div className="mx-auto hidden max-w-7xl flex-col gap-2 px-4 py-3 text-xs text-muted-foreground md:flex md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <GraduationCap className="h-4 w-4" />
          </span>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Criado por Renan Gustavo Lemes de Souza</p>
            <p>Portfólio acadêmico da pós em UX Design, desenvolvido para estudo, organização e apresentação do projeto.</p>
          </div>
        </div>

        <div className="flex flex-col gap-1 md:items-end">
          <a
            href="https://github.com/EvilUta"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary"
          >
            <Github className="h-3.5 w-3.5" />
            Github EvilUta
          </a>
          <p>Projeto pessoal e educacional com autenticação e persistência em Supabase.</p>
        </div>
      </div>
    </footer>
  );
}
