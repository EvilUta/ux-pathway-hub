import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type GoogleSignInButtonProps = {
  buttonLabel?: string;
} & Pick<ButtonProps, "className" | "size" | "variant">;

export function GoogleSignInButton({
  buttonLabel = "Entrar com Google",
  className,
  size = "sm",
  variant = "default",
}: GoogleSignInButtonProps) {
  async function handleGoogleSignIn() {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      toast.error("Preencha o arquivo .env com as credenciais do Supabase antes de testar o login.");
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      toast.error(error.message);
    }
  }

  return (
    <Button type="button" variant={variant} size={size} className={className} onClick={handleGoogleSignIn}>
      <span className="text-base leading-none">G</span>
      {buttonLabel}
    </Button>
  );
}
