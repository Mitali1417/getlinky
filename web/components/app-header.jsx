"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import { useSession } from "@/components/session-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logError } from "@/lib/logger";
import { toastError } from "@/lib/errors";

function NavTab({ href, active, children }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, urls, authenticated, logout } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const menuRef = useRef(null);

  const initial = (user?.name || user?.email || "U").trim().charAt(0).toUpperCase();

  useEffect(() => {
    function onPointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  async function onLogout() {
    try {
      await logout();
      setLogoutOpen(false);
      toast.success("Logged out");
      router.push("/");
    } catch (error) {
      logError("logout", error);
      toastError(error, "Logout failed");
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <Logo size="sm" />
          <nav className="flex items-center gap-1" aria-label="Main">
            <NavTab href="/" active={pathname === "/"}>
              Shorten
            </NavTab>
            <NavTab href="/links" active={pathname === "/links"}>
              My links
              {authenticated ? (
                <span className="ml-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-muted-foreground/20 px-1.5 text-xs text-foreground">
                  {urls.length}
                </span>
              ) : null}
            </NavTab>
          </nav>
        </div>

        {authenticated ? (
          <div className="relative" ref={menuRef}>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-white/12 bg-card/80 pl-3 pr-1.5"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              Account
              <span className="ml-1 inline-flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {initial}
              </span>
            </Button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-44 rounded-xl border border-white/10 bg-card p-1 shadow-lg"
              >
                <p className="truncate px-3 py-2 text-xs text-muted-foreground">
                  {user?.email}
                </p>
                <button
                  type="button"
                  role="menuitem"
                  className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm text-destructive hover:bg-destructive/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  onClick={() => {
                    setMenuOpen(false);
                    setLogoutOpen(true);
                  }}
                >
                  <LogOut className="size-4" />
                  Logout
                </button>
              </div>
            ) : null}
            <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Logout</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will need to sign in again to manage your short links.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={onLogout}>
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button nativeButton={false} variant="ghost" render={<Link href="/login" />}>
              Login
            </Button>
            <Button nativeButton={false} render={<Link href="/signup" />}>
              Signup
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
