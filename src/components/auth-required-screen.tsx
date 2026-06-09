import { ShieldCheck, Sparkles } from "lucide-react";

import { AuthMethods } from "@/components/auth-methods";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthRequiredScreen() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-6xl items-center px-4 py-10">
      <div className="grid w-full gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <Badge variant="outline" className="w-fit gap-2 px-3 py-1 text-xs uppercase tracking-[0.18em]">
            <Sparkles className="h-3.5 w-3.5" />
            Acesso sincronizado
          </Badge>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
              Entre para continuar seus estudos em qualquer dispositivo.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              Seus resumos, flashcards e progresso vao ficar ligados a uma conta, em vez de presos ao navegador do computador.
            </p>
          </div>

          <AuthMethods />

          <p className="text-sm text-muted-foreground">
            Voce pode usar Google para entrar mais rapido ou receber um magic link por e-mail.
          </p>
        </section>

        <Card className="border-primary/15 bg-card/70 shadow-sm backdrop-blur">
          <CardHeader className="space-y-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">O que muda com o login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Cada conteudo fica salvo por usuario, entao voce pode comecar no computador e continuar depois no celular.
            </p>
            <p>
              Isso tambem deixa o projeto com uma estrutura mais proxima de produto real, o que ajuda bastante na apresentacao da faculdade.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
