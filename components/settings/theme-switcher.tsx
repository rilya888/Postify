"use client";

import { useTheme } from "next-themes";
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
            <Moon className="h-4 w-4 mr-2" />
          ) : (
            <Sun className="h-4 w-4 mr-2" />
          )}
          {theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="h-4 w-4 mr-2" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="h-4 w-4 mr-2" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="h-4 w-4 mr-2" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
