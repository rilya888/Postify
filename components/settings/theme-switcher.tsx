"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

const placeholder = (
  <div className="h-9 w-24 animate-pulse rounded-md bg-muted" aria-hidden />
);

export function ThemeSwitcher() {
  const t = useTranslations("settingsTheme");
  const ctx = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !ctx || typeof ctx.setTheme !== "function") {
    return placeholder;
  }

  const { theme, setTheme, resolvedTheme } = ctx;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {resolvedTheme === "dark" ? (
            <Moon className="mr-2 h-4 w-4" />
          ) : (
            <Sun className="mr-2 h-4 w-4" />
          )}
          {theme === "system" ? t("system") : theme === "dark" ? t("dark") : t("light")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          {t("light")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          {t("dark")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          {t("system")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
