import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { MagicLinkSignInButton } from "@/components/magic-link-sign-in";

export function AuthMethods({
  compact = false,
}: {
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <GoogleSignInButton buttonLabel="Google" variant="default" size="sm" />
        <MagicLinkSignInButton buttonLabel="E-mail" variant="outline" size="sm" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <GoogleSignInButton buttonLabel="Continuar com Google" size="lg" className="min-w-56" />
      <MagicLinkSignInButton
        buttonLabel="Receber link por e-mail"
        size="lg"
        variant="outline"
        className="min-w-56"
      />
    </div>
  );
}
