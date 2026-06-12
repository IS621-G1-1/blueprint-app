import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, BookmarkCheck, Loader2, RefreshCw, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getWatchlist } from "@/api/watchlist";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { WatchlistItem } from "@/types/planner";

export function Watchlist() {
  const navigate = useNavigate();
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWatchlist = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const savedWatchlistItems = await getWatchlist();
      setWatchlistItems(savedWatchlistItems);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Watchlist could not load.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadWatchlist();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadWatchlist]);

  const filteredWatchlistItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return watchlistItems;
    }

    return watchlistItems.filter((watchlistItem) => {
      const searchableText = [
        watchlistItem.module.code,
        watchlistItem.module.name,
        watchlistItem.module.school,
        watchlistItem.module.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [query, watchlistItems]);

  function handlePlannerSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = query.trim();

    navigate(normalizedQuery ? `/planner?query=${encodeURIComponent(normalizedQuery)}` : "/planner");
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="rounded-md border border-blue-400/30 bg-blue-950/25 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          Watchlist
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">Saved Modules</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Keep track of modules you want to revisit before adding them to a semester plan.
        </p>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button onClick={loadWatchlist} size="sm" type="button" variant="outline">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Find Saved Modules</CardTitle>
          <CardDescription>Search within your watchlist or continue searching the catalogue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handlePlannerSearch}>
            <Input
              aria-label="Search watchlist"
              placeholder="Search code, name, or faculty..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Button type="submit" variant="outline">
              <Search className="h-4 w-4" />
              Search Planner
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="flex items-center gap-2 pt-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading watchlist...
          </CardContent>
        </Card>
      ) : watchlistItems.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 pt-6 text-muted-foreground">
            <p>No modules in your watchlist yet. Add modules from Planner to save them here.</p>
            <Button asChild type="button">
              <Link to="/planner">
                <Search className="h-4 w-4" />
                Browse Modules
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : filteredWatchlistItems.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-muted-foreground">
            No watchlist modules match your search.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredWatchlistItems.map((watchlistItem) => (
            <Card key={watchlistItem.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex rounded-md border border-accent/40 bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
                      {watchlistItem.module.code}
                    </div>
                    <CardTitle className="mt-3 text-lg leading-tight">
                      {watchlistItem.module.name}
                    </CardTitle>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 rounded-md border border-accent/40 bg-accent/10 px-2 py-1 text-xs text-accent">
                    <BookmarkCheck className="h-3.5 w-3.5" />
                    Saved
                  </div>
                </div>
                {watchlistItem.module.school && (
                  <CardDescription>Teaching faculty: {watchlistItem.module.school}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {watchlistItem.module.description && (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {watchlistItem.module.description}
                  </p>
                )}
                <Button asChild type="button" variant="secondary">
                  <Link to={`/planner?query=${encodeURIComponent(watchlistItem.module.code)}`}>
                    <Search className="h-4 w-4" />
                    View in Planner
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
