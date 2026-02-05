"use client";

import Link from "next/link";

export function SettingsLegal() {
  return (
    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
      <Link href="/privacy" className="hover:text-foreground">
        Privacy
      </Link>
      <Link href="/terms" className="hover:text-foreground">
        Terms
      </Link>
    </div>
  );
}
