"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Home, FileText, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

/**
 * Sidebar navigation for dashboard.
 * Provides quick access to main sections.
 */
export function Sidebar() {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const t = useTranslations("common");

  const navItems = [
    { href: "/dashboard", label: t("dashboard"), icon: Home },
    { href: "/projects", label: t("projects"), icon: FileText },
    { href: "/settings", label: t("settings"), icon: Settings },
  ];

  // Desktop sidebar
  const DesktopSidebar = (
    <aside className="hidden w-64 border-r bg-muted/40 p-4 md:block">
      <div className="flex flex-col gap-2">
        <Button asChild className="mb-4">
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
        
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant={pathname === item.href ? "secondary" : "ghost"}
            className={cn("justify-start", pathname === item.href && "bg-secondary")}
            asChild
          >
            <Link href={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        ))}
      </div>
    </aside>
  );

  // Mobile sheet
  const MobileSheet = (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-4">
        <div className="flex flex-col gap-2">
          <Button asChild className="mb-4" onClick={() => setIsSheetOpen(false)}>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("newProject")}
            </Link>
          </Button>
          
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "secondary" : "ghost"}
              className={cn("justify-start", pathname === item.href && "bg-secondary")}
              asChild
              onClick={() => setIsSheetOpen(false)}
            >
              <Link href={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      {DesktopSidebar}
      {MobileSheet}
    </>
  );
}