"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Link2 } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Logo } from "@/components/logo";
import { QrDialog } from "@/components/qr-dialog";
import { useSession } from "@/components/session-provider";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { api, publicShortUrl } from "@/lib/api";
import { toastError } from "@/lib/errors";
import { logError } from "@/lib/logger";
import {
  displayShortUrl,
  formatRelativeTime,
  isHttpUrl,
} from "@/lib/url";

const PENDING_URL_KEY = "pendingShortenUrl";

export default function ShortenPage() {
  const router = useRouter();
  const { authenticated, loading, error, urls, refresh } = useSession();
  const [url, setUrl] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [generated, setGenerated] = useState("");
  const [pending, setPending] = useState(false);
  const resumedRef = useRef(false);

  const createShortLink = useCallback(
    async (longUrl) => {
      const data = await api("/url", {
        method: "POST",
        body: JSON.stringify({ url: longUrl }),
      });
      setGenerated(publicShortUrl(data.id, data.shortUrl));
      setUrl("");
      setFieldError("");
      await refresh();
      toast.success("Short URL created");
    },
    [refresh]
  );

  useEffect(() => {
    if (!authenticated || resumedRef.current) return;
    const pendingUrl = sessionStorage.getItem(PENDING_URL_KEY);
    if (!pendingUrl) return;
    resumedRef.current = true;
    sessionStorage.removeItem(PENDING_URL_KEY);
    setUrl(pendingUrl);
    if (!isHttpUrl(pendingUrl)) {
      setFieldError("Enter a valid http or https URL");
      return;
    }
    setPending(true);
    createShortLink(pendingUrl).finally(() => setPending(false));
  }, [authenticated, createShortLink]);

  async function onGenerate(event) {
    event.preventDefault();
    const longUrl = url.trim();
    if (!longUrl) {
      setFieldError("Paste a URL to shorten");
      return;
    }
    if (!isHttpUrl(longUrl)) {
      setFieldError("Enter a valid http or https URL");
      return;
    }
    setFieldError("");

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

  const recent = urls.slice(0, 5);

  return (
    <SiteShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center pt-6 sm:pt-16">
        <Logo as="span" size="lg" />
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          Your short links, your way.
        </p>

        <form className="mt-8 w-full" onSubmit={onGenerate} noValidate>
          <div className="flex flex-col gap-2 rounded-2xl bg-card p-2 ring-1 ring-white/10 sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="long-url">
              URL to shorten
            </label>
            <div className="flex min-h-11 flex-1 items-center gap-2 px-3">
              <Link2 className="size-4 shrink-0 text-muted-foreground" />
              <Input
                id="long-url"
                name="url"
                type="text"
                inputMode="url"
                autoComplete="url"
                value={url}
                aria-invalid={Boolean(fieldError)}
                aria-describedby={fieldError ? "url-error" : undefined}
                onChange={(event) => {
                  setUrl(event.target.value);
                  if (fieldError) setFieldError("");
                }}
                placeholder="Paste your link here"
                className="h-11 border-0 bg-transparent px-0 shadow-none dark:bg-transparent"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              loading={pending}
              disabled={pending}
              className="w-full sm:w-auto"
            >
              Generate
              <ArrowRight className="size-4" />
            </Button>
          </div>
          {fieldError ? (
            <p id="url-error" className="mt-2 text-sm text-destructive" role="alert">
              {fieldError}
            </p>
          ) : null}
          {error ? (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </form>

        {generated ? (
          <Card className="mt-4 w-full rounded-2xl">
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <CheckCircle2 className="size-4 text-secondary" />
                  Generated URL
                </p>
                <a
                  href={generated}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block truncate font-medium text-secondary hover:underline"
                >
                  {generated}
                </a>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <CopyButton value={generated} />
                <QrDialog url={generated} />
              </div>
            </CardContent>
          </Card>
        ) : null}

        {authenticated ? (
          <Card className="mt-8 w-full rounded-2xl">
            <CardContent className="py-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">Recent links</h2>
                <Link
                  href="/links"
                  className="inline-flex min-h-11 items-center text-sm text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  View all {urls.length} →
                </Link>
              </div>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No shortened URLs yet. Paste a link to create one.
                </p>
              ) : (
                <ul className="divide-y divide-white/8">
                  {recent.map((item) => {
                    const shortHref = publicShortUrl(item.shortId, item.shortUrl);
                    return (
                      <li
                        key={item.shortId}
                        className="flex items-center gap-3 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <a
                            href={shortHref}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate text-sm font-medium text-secondary hover:underline"
                          >
                            {displayShortUrl(shortHref)}
                          </a>
                          <p className="truncate text-xs text-muted-foreground">
                            {item.redirectURL}
                          </p>
                        </div>
                        <div className="hidden shrink-0 text-right text-xs text-muted-foreground sm:block">
                          <p>{formatRelativeTime(item.createdAt)}</p>
                          <p>{item.clicks} clicks</p>
                        </div>
                        <CopyButton value={shortHref} iconOnly />
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </SiteShell>
  );
}
