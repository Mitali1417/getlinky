"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { api, publicShortUrl } from "@/lib/api";
import { toastError } from "@/lib/errors";
import { logError } from "@/lib/logger";

const PENDING_URL_KEY = "pendingShortenUrl";

export default function HomePage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [urls, setUrls] = useState([]);
  const [url, setUrl] = useState("");
  const [generated, setGenerated] = useState("");
  const [pending, setPending] = useState(false);
  const resumedRef = useRef(false);

  const loadUrls = useCallback(async () => {
    const data = await api("/url");
    setUrls(data.urls || []);
  }, []);

  const createShortLink = useCallback(
    async (longUrl) => {
      const data = await api("/url", {
        method: "POST",
        body: JSON.stringify({ url: longUrl }),
      });
      setGenerated(publicShortUrl(data.id, data.shortUrl));
      setUrl("");
      await loadUrls();
      toast.success("Short URL created");
    },
    [loadUrls]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await api("/user/me");
        if (cancelled) return;
        setAuthenticated(true);
        await loadUrls();
      } catch (error) {
        if (cancelled) return;
        setAuthenticated(false);
        if (error.status && error.status !== 401) {
          logError("home auth", error);
          toastError(error, "Could not check your session");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadUrls]);

  useEffect(() => {
    if (!authenticated || resumedRef.current) return;
    const pendingUrl = sessionStorage.getItem(PENDING_URL_KEY);
    if (!pendingUrl) return;
    resumedRef.current = true;
    sessionStorage.removeItem(PENDING_URL_KEY);
    setUrl(pendingUrl);
    setPending(true);
    createShortLink(pendingUrl).finally(() => setPending(false));
  }, [authenticated, createShortLink]);

  async function onGenerate(event) {
    event.preventDefault();
    const longUrl = url.trim();
    if (!longUrl) return;

    if (!authenticated) {
      sessionStorage.setItem(PENDING_URL_KEY, longUrl);
      toast.info("Sign in to generate a short link");
      router.push("/login");
      return;
    }

    setPending(true);
    try {
      await createShortLink(longUrl);
    } catch (error) {
      logError("generate url", error);
      if (error.status === 401) {
        sessionStorage.setItem(PENDING_URL_KEY, longUrl);
        router.push("/login");
        return;
      }
      toastError(error, "Could not generate a short URL");
    } finally {
      setPending(false);
    }
  }

  async function onLogout() {
    try {
      await api("/user/logout", { method: "POST" });
      setAuthenticated(false);
      setUrls([]);
      setGenerated("");
      toast.success("Logged out");
    } catch (error) {
      logError("logout", error);
      toastError(error, "Logout failed");
    }
  }

  function shortLink(item) {
    return publicShortUrl(item.shortId, item.shortUrl);
  }

  return (
    <div className="min-h-screen text-white">
      <header className="sticky top-0 z-10 flex items-center justify-end gap-2 border-b border-border px-4 py-2">
        {authenticated ? (
          <AlertDialog>
            <AlertDialogTrigger
              nativeButton={false}
              render={<Button variant="destructive" size="icon" />}
            >
              <LogOut />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  Logout <LogOut className="size-4" />
                </AlertDialogTitle>
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
        ) : (
          <>
            <Button
              nativeButton={false}
              variant="ghost"
              render={<Link href="/login" />}
            >
              Login
            </Button>
            <Button
              nativeButton={false}
              variant="default"
              render={<Link href="/signup" />}
            >
              Signup
            </Button>
          </>
        )}
      </header>

      <main
        className={`mx-auto flex w-full max-w-6xl flex-col px-4 ${
          authenticated
            ? "gap-10 py-16"
            : "min-h-[calc(100vh-3.5rem)] items-center justify-center"
        }`}
      >
        <section className="flex w-full flex-col max-w-2xl mx-auto items-center text-center">
          <h1 className="text-6xl font-bold text-neutral-400">
            get
            <span className="text-accent lowercase">
              linky
            </span>
          </h1>
          <p className="mt-4 text-xl font-medium text-neutral-400">
            Your short links, your way.
          </p>

          {generated ? (
            <p className="mt-4 w-full break-all text-sm text-neutral-400">
              Generated URL:
              <br />
              <a
                className="text-emerald-400 hover:text-sky-400"
                href={generated}
                target="_blank"
                rel="noreferrer"
              >
                {generated}
              </a>
            </p>
          ) : null}

          <form
            className="mt-8 flex w-full items-center gap-2 p-2"
            onSubmit={onGenerate}
          >
            <Input
              name="url"
              type="text"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="Paste your link here"
              required
            />
            <Button type="submit" size="lg" loading={pending} disabled={pending}>
              Generate
              <ArrowRight className="size-4 shrink-0" />
            </Button>
          </form>
        </section>

        {authenticated ? (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Your links</CardTitle>
              <CardDescription className="text-neutral-400">
                Click counts update when someone opens a short URL.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {urls.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  No shortened URLs yet. Paste a link to create one.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-neutral-700 hover:bg-transparent">
                      {/* <TableHead className="text-neutral-400">Id</TableHead> */}
                      <TableHead className="text-neutral-400">Short URL</TableHead>
                      <TableHead className="text-neutral-400">
                        Original URL
                      </TableHead>
                      <TableHead className="text-neutral-400">Clicks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {urls.map((item) => (
                      <TableRow
                      key={item.shortId}
                      className="border-neutral-800 hover:bg-neutral-800/60"
                    >
                      <TableCell className="max-w-28">
                        <a
                          className="group flex items-center gap-2 text-secondary hover:text-accent/80 hover:underline"
                          href={shortLink(item)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span className="truncate">{shortLink(item)}</span>
                          <ArrowUpRight className="size-4 shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                        </a>
                      </TableCell>
                      <TableCell className="max-w-[18rem]">
                        <a
                          className="group flex w-full items-center gap-2 text-secondary hover:text-accent/80 hover:underline"
                          href={item.redirectURL}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span className="truncate">{item.redirectURL}</span>
                          <ArrowUpRight className="size-4 shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                        </a>
                      </TableCell>
                    
                      <TableCell>{item.clicks}</TableCell>
                    </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
