import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { getThemePreference, setThemePreference, type ThemePreference } from "@/lib/user-settings";

export function ThemeToggle() {
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();
  const [theme, setTheme] = useState<ThemePreference>("light");

  function applyTheme(next: ThemePreference) {
    setTheme(next);
    localStorage.setItem("uxa-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  useEffect(() => {
    const stored = (localStorage.getItem("uxa-theme") as ThemePreference | null) ?? "light";
    applyTheme(stored);
  }, []);

  useEffect(() => {
    if (!supabase || !user) return;

    let active = true;

    void getThemePreference(supabase, user.id)
      .then((storedTheme) => {
        if (!active || !storedTheme) return;
        applyTheme(storedTheme);
      })
      .catch((error) => {
        console.error("Erro ao carregar preferencia de tema", error);
      });

    return () => {
      active = false;
    };
  }, [supabase, user]);

  const toggle = async () => {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);

    if (!supabase || !user) return;

    try {
      await setThemePreference(supabase, user.id, next);
    } catch (error) {
      console.error("Erro ao salvar preferencia de tema", error);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Alternar tema">
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
