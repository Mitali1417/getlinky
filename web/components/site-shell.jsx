"use client";

import { AppHeader } from "@/components/app-header";

export function SiteShell({ children }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">{children}</main>
    </div>
  );
}
