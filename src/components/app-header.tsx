import { Link } from "@tanstack/react-router";
import { GraduationCap, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AuthControls, signOutWithToast } from "./auth-controls";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/timeline", label: "Timeline" },
  { to: "/glossario", label: "Glossário" },
  
];

export function AppHeader() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </span>
          <span>UX Academy</span>
        </Link>
        {user ? (
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                activeProps={{ className: "rounded-md px-3 py-1.5 text-sm bg-accent text-foreground font-medium" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        ) : (
          <div className="hidden md:block text-sm text-muted-foreground">
            Entre para desbloquear o painel de estudos
          </div>
        )}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden md:flex">
                <AuthControls />
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="md:hidden"
                    aria-label="Abrir menu"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] sm:max-w-sm">
                  <SheetHeader className="pr-8 text-left">
                    <SheetTitle>Menu</SheetTitle>
                    <SheetDescription>
                      Acesse as principais areas do projeto e encerre sua sessao.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="mt-6 flex flex-col gap-5">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        Navegacao
                      </p>
                      <nav className="flex flex-col gap-2">
                        {navItems.map((n) => (
                          <SheetClose asChild key={n.to}>
                            <Link
                              to={n.to}
                              activeOptions={{ exact: n.to === "/" }}
                              className="rounded-lg border border-border/70 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-foreground"
                              activeProps={{ className: "rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-medium text-primary" }}
                            >
                              {n.label}
                            </Link>
                          </SheetClose>
                        ))}
                      </nav>
                    </div>

                    <div className="space-y-3 border-t pt-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                          Conta
                        </p>
                        <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          void signOutWithToast();
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sair
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <AuthControls />
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
