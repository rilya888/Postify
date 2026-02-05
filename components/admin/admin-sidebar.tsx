"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Database, Shield, Menu, CreditCard, FolderOpen, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { APP_NAME } from "@/lib/constants/app";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/projects", label: "Projects", icon: FolderOpen },
  { href: "/admin/transcripts", label: "Transcripts", icon: FileText },
  { href: "/admin/cache", label: "Cache", icon: Database },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const brandBlock = (
    <Link
      href="/admin/dashboard"
      className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
    >
      <Shield className="h-4 w-4 text-primary" aria-hidden />
      <span>{APP_NAME} Admin</span>
    </Link>
  );

  const navBlock = (
    <div className="flex flex-col gap-1">
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
  );

  return (
    <>
      <aside className="hidden w-64 border-r bg-muted/40 p-4 md:block">
        <div className="flex flex-col gap-2">
          {brandBlock}
          {navBlock}
        </div>
      </aside>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-4">
          <div className="flex flex-col gap-2">
            {brandBlock}
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
    </>
  );
}
