import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { AuthMethods } from "@/components/auth-methods";
import { Button } from "@/components/ui/button";

export async function signOutWithToast() {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) return;

  const { error } = await supabase.auth.signOut();

  if (error) {
    toast.error(error.message);
    return;
  }

  toast.success("Sessao encerrada.");
}

export function AuthControls() {
  const { configured, loading, user } = useAuth();

  async function handleSignOut() {
    await signOutWithToast();
  }

  if (!configured) {
    return (
      <span className="hidden text-xs text-muted-foreground md:inline">
        Supabase aguardando configuracao
      </span>
    );
  }

  if (loading) {
    return <span className="hidden text-xs text-muted-foreground md:inline">Carregando sessao...</span>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden max-w-48 truncate text-sm text-muted-foreground md:inline">
          {user.email}
        </span>
        <Button type="button" variant="outline" size="sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    );
  }

  return <AuthMethods compact />;
}
