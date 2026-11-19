"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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

export default function HomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [urls, setUrls] = useState([]);
  const [generated, setGenerated] = useState("");
  const [pending, setPending] = useState(false);

  const loadUrls = useCallback(async () => {
    const data = await api("/url");
    setUrls(data.urls || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await api("/user/me");
        await loadUrls();
        if (!cancelled) setReady(true);
      } catch (error) {
        logError("home auth", error);
        if (error.status !== 401) {
          toastError(error, "Could not load your links");
        }
        if (!cancelled) router.replace("/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadUrls, router]);

  async function onGenerate(event) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const data = await api("/url", {
        method: "POST",
        body: JSON.stringify({ url: form.get("url") }),
      });
      setGenerated(publicShortUrl(data.id, data.shortUrl));
      event.currentTarget.reset();
      await loadUrls();
      toast.success("Short URL created");
    } catch (error) {
      logError("generate url", error);
      toastError(error, "Could not generate a short URL");
    } finally {
      setPending(false);
    }
  }

  async function onLogout() {
    try {
      await api("/user/logout", { method: "POST" });
      toast.success("Logged out");
      router.replace("/login");
    } catch (error) {
      logError("logout", error);
      toastError(error, "Logout failed");
      router.replace("/login");
    }
  }

  function shortLink(url) {
    return publicShortUrl(url.shortId, url.shortUrl);
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-900 text-neutral-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <header className="sticky top-0 z-10 flex justify-end bg-neutral-700 px-4 py-2 shadow-lg shadow-black/40">
        <Button
          type="button"
          variant="outline"
          onClick={onLogout}
          className="border-transparent bg-black text-white hover:bg-black hover:shadow-[0.2rem_0.2rem_0_#66cc66]"
        >
          Logout
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 lg:flex-row lg:items-start">
        <section className="flex w-full flex-col justify-center lg:w-2/5 lg:py-16">
          <h2 className="text-3xl font-semibold text-neutral-400">
            Simplify URL Shortening{" "}
            <span className="block bg-linear-to-r from-emerald-400 to-sky-400 bg-clip-text text-4xl font-bold text-transparent lowercase">
              Effortlessly
            </span>
          </h2>
          <div className="mt-2 h-px w-full bg-emerald-400/80" />

          {generated ? (
            <p className="mt-4 break-all text-sm text-neutral-400">
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

          <form className="mt-6 flex flex-col gap-4" onSubmit={onGenerate}>
            <Input
              name="url"
              type="text"
              placeholder="Paste the original link"
              required
              className="h-11 border-neutral-700 bg-black text-emerald-400 placeholder:text-neutral-500"
            />
            <Button
              type="submit"
              disabled={pending}
              className="h-11 bg-linear-to-r from-emerald-400 to-sky-400 text-black hover:bg-white hover:text-neutral-700"
            >
              {pending ? "Generating..." : "Generate"}
            </Button>
          </form>
        </section>

        <Card className="w-full bg-black/60 text-white ring-neutral-700 lg:w-3/5">
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
                    <TableHead className="text-neutral-400">Id</TableHead>
                    <TableHead className="text-neutral-400">Short URL</TableHead>
                    <TableHead className="hidden text-neutral-400 sm:table-cell">
                      Original URL
                    </TableHead>
                    <TableHead className="text-neutral-400">Clicks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {urls.map((url) => (
                    <TableRow
                      key={url.shortId}
                      className="border-neutral-800 hover:bg-neutral-800/60"
                    >
                      <TableCell className="font-medium">{url.shortId}</TableCell>
                      <TableCell className="max-w-[18rem] whitespace-normal break-all">
                        <a
                          className="text-emerald-400 hover:text-sky-400"
                          href={shortLink(url)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {shortLink(url)}
                        </a>
                      </TableCell>
                      <TableCell className="hidden max-w-xs truncate sm:table-cell">
                        {url.redirectURL}
                      </TableCell>
                      <TableCell>{url.clicks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
