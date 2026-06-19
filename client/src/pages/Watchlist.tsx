import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookmarkCheck,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  addModuleToSemesterPlan,
  getSemesterPlans,
} from "@/api/semesterPlans";
import { getWatchlist, removeModuleFromWatchlist } from "@/api/watchlist";
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
import type { SemesterPlan, WatchlistItem } from "@/types/planner";

function selectClassName() {
  return "flex h-10 w-full rounded-md border border-input bg-background/70 px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";
}

export function Watchlist() {
  const navigate = useNavigate();
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [semesterPlans, setSemesterPlans] = useState<SemesterPlan[]>([]);
  const [selectedSemesterPlanId, setSelectedSemesterPlanId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [addingModuleId, setAddingModuleId] = useState("");
  const [removingWatchlistItemId, setRemovingWatchlistItemId] = useState("");

  const loadWatchlist = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const [savedWatchlistItems, plans] = await Promise.all([
        getWatchlist(),
        getSemesterPlans(),
      ]);
      setWatchlistItems(savedWatchlistItems);
      setSemesterPlans(plans);
      setSelectedSemesterPlanId((currentPlanId) => {
        if (plans.some((plan) => plan.id === currentPlanId)) {
          return currentPlanId;
        }

        return plans[0]?.id ?? "";
      });
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

  function upsertSemesterPlan(plan: SemesterPlan) {
    setSemesterPlans((currentPlans) => {
      const existingIndex = currentPlans.findIndex((currentPlan) => currentPlan.id === plan.id);

      if (existingIndex === -1) {
        return [plan, ...currentPlans];
      }

      return currentPlans.map((currentPlan) => (currentPlan.id === plan.id ? plan : currentPlan));
    });
  }

  async function handleAddToPlan(moduleId: string) {
    if (!selectedSemesterPlanId) {
      setError("Create or select a semester plan before adding modules.");
      setSuccess("");
      return;
    }

    setError("");
    setSuccess("");
    setAddingModuleId(moduleId);

    try {
      const response = await addModuleToSemesterPlan(selectedSemesterPlanId, moduleId);
      upsertSemesterPlan(response.semesterPlan);
      setSelectedSemesterPlanId(response.semesterPlan.id);
      setSuccess(response.message);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Module could not be added to plan.");
    } finally {
      setAddingModuleId("");
    }
  }

  async function handleRemoveFromWatchlist(watchlistItemId: string) {
    setError("");
    setSuccess("");
    setRemovingWatchlistItemId(watchlistItemId);

    try {
      const response = await removeModuleFromWatchlist(watchlistItemId);
      setWatchlistItems((currentItems) =>
        currentItems.filter((watchlistItem) => watchlistItem.id !== watchlistItemId),
      );
      setSuccess(response.message);
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Module could not be removed from watchlist.",
      );
    } finally {
      setRemovingWatchlistItemId("");
    }
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

      {(error || success) && (
        <Alert variant={error ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error || success}</span>
            {error && (
              <Button onClick={loadWatchlist} size="sm" type="button" variant="outline">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            )}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Study Plan Target</CardTitle>
          <CardDescription>Select where liked modules should be added.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            aria-label="Select semester plan"
            className={selectClassName()}
            disabled={loading || semesterPlans.length === 0}
            value={selectedSemesterPlanId}
            onChange={(event) => setSelectedSemesterPlanId(event.target.value)}
          >
            {semesterPlans.length === 0 ? (
              <option value="">No semester plans yet</option>
            ) : (
              semesterPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.year} {plan.term}
                </option>
              ))
            )}
          </select>
          {semesterPlans.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground">
              Create a semester plan in Planner before adding liked modules to your plan.
            </p>
          )}
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
            <p>No modules in your watchlist yet. Like modules from search to save them here.</p>
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
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="flex items-center gap-1 rounded-md border border-accent/40 bg-accent/10 px-2 py-1 text-xs text-accent">
                      <BookmarkCheck className="h-3.5 w-3.5" />
                      Saved
                    </div>
                    <div className="rounded-md border border-border bg-background/60 px-2 py-1 text-xs text-muted-foreground">
                      {watchlistItem.module.credits} credit
                      {watchlistItem.module.credits === 1 ? "" : "s"}
                    </div>
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
                <div className="grid gap-2 sm:grid-cols-3">
                  <Button
                    disabled={addingModuleId === watchlistItem.moduleId}
                    onClick={() => handleAddToPlan(watchlistItem.moduleId)}
                    type="button"
                  >
                    {addingModuleId === watchlistItem.moduleId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Add to Plan
                  </Button>
                  <Button asChild type="button" variant="secondary">
                    <Link to={`/planner?query=${encodeURIComponent(watchlistItem.module.code)}`}>
                      <Search className="h-4 w-4" />
                      View
                    </Link>
                  </Button>
                  <Button
                    disabled={removingWatchlistItemId === watchlistItem.id}
                    onClick={() => handleRemoveFromWatchlist(watchlistItem.id)}
                    type="button"
                    variant="outline"
                  >
                    {removingWatchlistItemId === watchlistItem.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
