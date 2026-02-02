"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Home, FileText, Settings, Menu, Dna } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { APP_NAME } from "@/lib/constants/app";

/**
 * Sidebar navigation for dashboard
 * Provides quick access to main sections
 */
export function Sidebar() {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/projects", label: "Projects", icon: FileText },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const brandBlock = (
    <Link
      href="/dashboard"
      className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
    >
      <Dna className="h-4 w-4 text-primary" aria-hidden />
      {APP_NAME}
    </Link>
  );

  // Desktop sidebar
  const DesktopSidebar = (
    <aside className="hidden w-64 border-r bg-muted/40 p-4 md:block">
      <div className="flex flex-col gap-2">
        {brandBlock}
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
          {brandBlock}
          <Button asChild className="mb-4" onClick={() => setIsSheetOpen(false)}>
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