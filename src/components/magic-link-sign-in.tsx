import { LogIn, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type MagicLinkSignInButtonProps = {
  buttonLabel?: string;
} & Pick<ButtonProps, "className" | "size" | "variant">;

export function MagicLinkSignInButton({
  buttonLabel = "Entrar",
  className,
  size = "sm",
  variant = "outline",
}: MagicLinkSignInButtonProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleMagicLinkSignIn() {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      toast.error("Preencha o arquivo .env com as credenciais do Supabase antes de testar o login.");
      return;
    }

    if (!email.trim()) {
      toast.error("Digite um e-mail para receber o link de acesso.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Link enviado. Abra o e-mail e volte para este app pelo magic link.");
    setOpen(false);
  }

  return (
    <>
      <Button type="button" variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        <LogIn className="h-4 w-4" />
        {buttonLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entrar com magic link</DialogTitle>
            <DialogDescription>
              Digite seu e-mail para receber um link de acesso e continuar seus estudos em qualquer dispositivo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label className="space-y-2 text-sm font-medium">
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-mail
              </span>
              <Input
                type="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
          </div>

          <DialogFooter>
            <Button type="button" onClick={handleMagicLinkSignIn} disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
