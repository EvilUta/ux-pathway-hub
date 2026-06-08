import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/materia-nao-cursada")({
  head: () => ({ meta: [{ title: "Matéria ainda não cursada" }] }),
  component: NaoCursada,
});

function NaoCursada() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-6 grid h-24 w-24 place-items-center rounded-full bg-primary/10 text-primary">
        <Lock className="h-10 w-10" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Matéria ainda não cursada</h1>
      <p className="mt-4 text-muted-foreground">
        Você ainda não iniciou esta disciplina. Assim que começar os estudos, esta página será liberada
        com resumos, flashcards, questões, materiais e revisões.
      </p>
      <Button asChild className="mt-8">
        <Link to="/">Voltar ao Menu Principal</Link>
      </Button>
    </div>
  );
}
