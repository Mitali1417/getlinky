"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Plus, Search, Trash2 } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { useSession } from "@/components/session-provider";
import { SiteShell } from "@/components/site-shell";
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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { cn } from "@/lib/utils";
import {
  displayShortUrl,
  formatRelativeTime,
  hostnameLetter,
  isHttpUrl,
} from "@/lib/url";

const PAGE_SIZE = 20;

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

export default function LinksPage() {
  const router = useRouter();
  const { authenticated, loading, error, urls, refresh } = useSession();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState("");

  useEffect(() => {
    if (!loading && !authenticated) {
      router.replace("/login?next=/links");
    }
  }, [authenticated, loading, router]);

  const showGuestState = !authenticated;

  const stats = useMemo(() => {
    const totalClicks = urls.reduce((sum, item) => sum + (item.clicks || 0), 0);
    const neverClicked = urls.filter((item) => !item.clicks).length;
    return { total: urls.length, totalClicks, neverClicked };
  }, [urls]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = urls.filter((item) => {
      if (filter === "clicked" && !item.clicks) return false;
      if (filter === "not-clicked" && item.clicks) return false;
      if (!q) return true;
      const shortHref = publicShortUrl(item.shortId, item.shortUrl).toLowerCase();
      return (
        shortHref.includes(q) ||
        item.shortId.toLowerCase().includes(q) ||
        String(item.redirectURL || "").toLowerCase().includes(q)
      );
    });

    list = [...list].sort((a, b) => {
      if (sort === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sort === "clicks") {
        return (b.clicks || 0) - (a.clicks || 0);
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
    return list;
  }, [urls, query, filter, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const maxClicks = Math.max(1, ...urls.map((item) => item.clicks || 0));

  async function onDelete(shortId) {
    setDeleting(shortId);
    try {
      await api(`/url/${shortId}`, { method: "DELETE" });
      toast.success("Link deleted");
      await refresh();
    } catch (err) {
      logError("delete url", err);
      toastError(err, "Could not delete link");
    } finally {
      setDeleting("");
    }
  }

  if (showGuestState) {
    return (
      <SiteShell>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-2 h-4 w-80" />
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">My links</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Click counts update when someone opens a short URL.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/" />}>
          <Plus className="size-4" />
          New link
        </Button>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          ["Links", stats.total],
          ["Total clicks", stats.totalClicks],
          ["Never clicked", stats.neverClicked],
        ].map(([label, value]) => (
          <Card key={label} className="rounded-2xl">
            <CardContent className="py-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              {loading ? (
                <Skeleton className="mt-2 h-8 w-12" />
              ) : (
                <p className="mt-1 text-3xl font-semibold">{value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6 rounded-2xl">
        <CardContent className="py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex min-h-11 flex-1 items-center gap-2 rounded-xl bg-background px-3 ring-1 ring-white/10">
              <Search className="size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search short or original URL"
                aria-label="Search short or original URL"
                className="h-11 border-0 bg-transparent px-0 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <FilterChip
                active={filter === "all"}
                onClick={() => {
                  setFilter("all");
                  setPage(1);
                }}
              >
                All
              </FilterChip>
              <FilterChip
                active={filter === "clicked"}
                onClick={() => {
                  setFilter("clicked");
                  setPage(1);
                }}
              >
                Clicked
              </FilterChip>
              <FilterChip
                active={filter === "not-clicked"}
                onClick={() => {
                  setFilter("not-clicked");
                  setPage(1);
                }}
              >
                Not clicked
              </FilterChip>
              <label className="sr-only" htmlFor="sort-links">
                Sort
              </label>
              <select
                id="sort-links"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                }}
                className="min-h-11 rounded-full bg-muted px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="clicks">Most clicks</option>
              </select>
            </div>
          </div>

          {error ? (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {loading ? (
            <div className="mt-6 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : urls.length === 0 ? (
            <div className="mt-10 text-center">
              <p className="text-base font-medium">No links yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first short URL from the Shorten page.
              </p>
              <Button nativeButton={false} className="mt-4" render={<Link href="/" />}>
                New link
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-10 text-center">
              <p className="text-base font-medium">No results</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different search or filter.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-4 overflow-x-auto">
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Short URL</TableHead>
                      <TableHead>Original URL</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.map((item) => {
                      const shortHref = publicShortUrl(item.shortId, item.shortUrl);
                      const valid = isHttpUrl(item.redirectURL);
                      const letter = hostnameLetter(item.redirectURL);
                      return (
                        <TableRow key={item.shortId}>
                          <TableCell className="max-w-52">
                            <a
                              href={shortHref}
                              target="_blank"
                              rel="noreferrer"
                              className="truncate font-medium text-secondary hover:underline"
                            >
                              {displayShortUrl(shortHref)}
                            </a>
                          </TableCell>
                          <TableCell className="max-w-80">
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                                {letter}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate">{item.redirectURL}</p>
                                {valid ? null : (
                                  <p className="text-xs text-accent">
                                    Not a valid URL — this link won&apos;t redirect
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="w-6 tabular-nums">{item.clicks}</span>
                              <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                                <span
                                  className="block h-full rounded-full bg-primary"
                                  style={{
                                    width: `${Math.max(
                                      item.clicks ? 12 : 0,
                                      ((item.clicks || 0) / maxClicks) * 100
                                    )}%`,
                                  }}
                                />
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {formatRelativeTime(item.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <CopyButton value={shortHref} iconOnly />
                              <Button
                                nativeButton={false}
                                variant="ghost"
                                size="icon"
                                aria-label="Open original URL"
                                render={
                                  <a
                                    href={valid ? item.redirectURL : shortHref}
                                    target="_blank"
                                    rel="noreferrer"
                                  />
                                }
                              >
                                <ExternalLink className="size-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      aria-label="Delete link"
                                      disabled={deleting === item.shortId}
                                    />
                                  }
                                >
                                  <Trash2 className="size-4" />
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete this link?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {displayShortUrl(shortHref)} will stop working. This cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      variant="destructive"
                                      onClick={() => onDelete(item.shortId)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
                <p>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={currentPage >= pageCount}
                    onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </SiteShell>
  );
}
