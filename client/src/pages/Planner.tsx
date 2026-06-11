import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { getModuleDetails, getModules, searchModules } from "@/api/modules";
import {
  addModuleToSemesterPlan,
  createOrLoadSemesterPlan,
  getSemesterPlans,
  removeModuleFromSemesterPlan,
} from "@/api/semesterPlans";
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
import { Label } from "@/components/ui/label";
import type { Module, SemesterPlan } from "@/types/planner";

const TERMS = ["Term 1", "Term 2", "Special Term"];

function getCurrentAcademicYear() {
  return new Date().getFullYear();
}

function selectClassName() {
  return "flex h-10 w-full rounded-md border border-input bg-background/70 px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-md border border-border bg-background/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6">{value || "Not available"}</p>
    </div>
  );
}

export function Planner() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("query") ?? "";
  const [semesterPlans, setSemesterPlans] = useState<SemesterPlan[]>([]);
  const [selectedSemesterPlanId, setSelectedSemesterPlanId] = useState("");
  const [year, setYear] = useState(getCurrentAcademicYear());
  const [term, setTerm] = useState(TERMS[0]);
  const [query, setQuery] = useState(initialQuery);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleDetails, setSelectedModuleDetails] = useState<Module | null>(null);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingModules, setLoadingModules] = useState(true);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingModuleDetailsId, setLoadingModuleDetailsId] = useState("");
  const [addingModuleId, setAddingModuleId] = useState("");
  const [removingPlannedModuleId, setRemovingPlannedModuleId] = useState("");

  const selectedSemesterPlan = useMemo(
    () => semesterPlans.find((plan) => plan.id === selectedSemesterPlanId) ?? null,
    [selectedSemesterPlanId, semesterPlans],
  );

  const totalCredits =
    selectedSemesterPlan?.plannedModules.reduce(
      (total, plannedModule) => total + plannedModule.module.credits,
      0,
    ) ?? 0;

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const [plans, catalogueModules] = await Promise.all([
          getSemesterPlans(),
          initialQuery ? searchModules(initialQuery) : getModules(),
        ]);

        if (!isMounted) {
          return;
        }

        setSemesterPlans(plans);
        setModules(catalogueModules);

        if (plans[0]) {
          setSelectedSemesterPlanId(plans[0].id);
          setYear(plans[0].year);
          setTerm(plans[0].term);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Planner data could not load.");
        }
      } finally {
        if (isMounted) {
          setLoadingPlans(false);
          setLoadingModules(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [initialQuery]);

  function upsertSemesterPlan(plan: SemesterPlan) {
    setSemesterPlans((currentPlans) => {
      const existingIndex = currentPlans.findIndex((currentPlan) => currentPlan.id === plan.id);

      if (existingIndex === -1) {
        return [plan, ...currentPlans];
      }

      return currentPlans.map((currentPlan) => (currentPlan.id === plan.id ? plan : currentPlan));
    });
  }

  async function handleCreateOrLoadSemesterPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setCreatingPlan(true);

    try {
      const response = await createOrLoadSemesterPlan({ year, term });
      upsertSemesterPlan(response.semesterPlan);
      setSelectedSemesterPlanId(response.semesterPlan.id);
      setSuccess(response.message);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Semester plan could not be created.",
      );
    } finally {
      setCreatingPlan(false);
    }
  }

  async function handleSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError("");
    setDetailError("");
    setSuccess("");
    setSelectedModuleDetails(null);
    setSearching(true);

    try {
      const searchResults = await searchModules(query);
      setModules(searchResults);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Module search failed.");
    } finally {
      setSearching(false);
      setLoadingModules(false);
    }
  }

  async function handleViewModuleDetails(moduleId: string) {
    setError("");
    setDetailError("");
    setSuccess("");
    setLoadingModuleDetailsId(moduleId);

    try {
      const moduleDetails = await getModuleDetails(moduleId);
      setSelectedModuleDetails(moduleDetails);
    } catch (detailsError) {
      setSelectedModuleDetails(null);
      setDetailError(
        detailsError instanceof Error ? detailsError.message : "Module details could not load.",
      );
    } finally {
      setLoadingModuleDetailsId("");
    }
  }

  async function handleAddModule(moduleId: string) {
    if (!selectedSemesterPlan) {
      setError("Create or select a semester plan before adding modules.");
      setSuccess("");
      return;
    }

    setError("");
    setSuccess("");
    setAddingModuleId(moduleId);

    try {
      const response = await addModuleToSemesterPlan(selectedSemesterPlan.id, moduleId);
      upsertSemesterPlan(response.semesterPlan);
      setSuccess(response.message);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Module could not be added.");
    } finally {
      setAddingModuleId("");
    }
  }

  async function handleRemoveModule(plannedModuleId: string) {
    if (!selectedSemesterPlan) {
      return;
    }

    setError("");
    setSuccess("");
    setRemovingPlannedModuleId(plannedModuleId);

    try {
      await removeModuleFromSemesterPlan(selectedSemesterPlan.id, plannedModuleId);
      const updatedPlans = await getSemesterPlans();
      setSemesterPlans(updatedPlans);
      setSelectedSemesterPlanId(selectedSemesterPlan.id);
      setSuccess("Module removed from semester plan");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Module could not be removed.");
    } finally {
      setRemovingPlannedModuleId("");
    }
  }

  function handleSelectSemesterPlan(planId: string) {
    setSelectedSemesterPlanId(planId);
    const plan = semesterPlans.find((semesterPlan) => semesterPlan.id === planId);

    if (plan) {
      setYear(plan.year);
      setTerm(plan.term);
    }
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <header className="rounded-md border border-blue-400/30 bg-blue-950/25 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          Planner
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">Academic Planner</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Search modules and build your semester plan.
        </p>
      </header>

        {(error || detailError || success) && (
          <Alert variant={error || detailError ? "destructive" : "default"}>
            <AlertDescription>{error || detailError || success}</AlertDescription>
          </Alert>
        )}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Semester Plan</CardTitle>
                <CardDescription>Create a semester plan or switch between existing plans.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleCreateOrLoadSemesterPlan}>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      min={2000}
                      max={2100}
                      type="number"
                      value={year}
                      onChange={(event) => setYear(Number(event.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="term">Term</Label>
                    <select
                      id="term"
                      className={selectClassName()}
                      value={term}
                      onChange={(event) => setTerm(event.target.value)}
                    >
                      {TERMS.map((termOption) => (
                        <option key={termOption} value={termOption}>
                          {termOption}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button className="self-end" disabled={creatingPlan} type="submit">
                    {creatingPlan && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create / Load Semester Plan
                  </Button>
                </form>

                <div className="space-y-2">
                  <Label htmlFor="semesterPlan">Selected semester</Label>
                  <select
                    id="semesterPlan"
                    className={selectClassName()}
                    disabled={loadingPlans || semesterPlans.length === 0}
                    value={selectedSemesterPlanId}
                    onChange={(event) => handleSelectSemesterPlan(event.target.value)}
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Module Search</CardTitle>
                <CardDescription>Find modules by code or name.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSearch}>
                  <Input
                    aria-label="Search module code or name"
                    placeholder="Search IS621, software, digital..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <Button disabled={searching} type="submit">
                    {searching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Search
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {loadingModules ? (
                <Card className="md:col-span-2">
                  <CardContent className="flex items-center gap-2 pt-6 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading modules...
                  </CardContent>
                </Card>
              ) : modules.length === 0 ? (
                <Card className="md:col-span-2">
                  <CardContent className="pt-6 text-muted-foreground">
                    No modules match your search.
                  </CardContent>
                </Card>
              ) : (
                modules.map((module) => (
                  <Card key={module.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="inline-flex rounded-md border border-accent/40 bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
                            {module.code}
                          </div>
                          <CardTitle className="mt-3 text-lg leading-tight">{module.name}</CardTitle>
                        </div>
                        <div className="shrink-0 rounded-md border border-border bg-background/60 px-2 py-1 text-xs text-muted-foreground">
                          {module.credits} credit{module.credits === 1 ? "" : "s"}
                        </div>
                      </div>
                      {module.school && (
                        <CardDescription>Teaching faculty: {module.school}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {module.description && (
                        <p className="text-sm leading-6 text-muted-foreground">
                          {module.description}
                        </p>
                      )}
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button
                          disabled={loadingModuleDetailsId === module.id}
                          onClick={() => handleViewModuleDetails(module.id)}
                          type="button"
                          variant="secondary"
                        >
                          {loadingModuleDetailsId === module.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                          View details
                        </Button>
                        <Button
                          disabled={addingModuleId === module.id}
                          onClick={() => handleAddModule(module.id)}
                          type="button"
                        >
                          {addingModuleId === module.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-xl">Module Details</CardTitle>
                <CardDescription>
                  Review requirements, availability, and schedule before adding a module.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingModuleDetailsId && !selectedModuleDetails ? (
                  <div className="flex items-center gap-2 rounded-md border border-border bg-background/50 p-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading module details...
                  </div>
                ) : selectedModuleDetails ? (
                  <>
                    <div>
                      <div className="inline-flex rounded-md border border-accent/40 bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
                        {selectedModuleDetails.code}
                      </div>
                      <h2 className="mt-3 text-xl font-semibold leading-tight">
                        {selectedModuleDetails.name}
                      </h2>
                      {selectedModuleDetails.school && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Teaching faculty: {selectedModuleDetails.school}
                        </p>
                      )}
                    </div>

                    <DetailField
                      label="Description"
                      value={selectedModuleDetails.description ?? "No description available"}
                    />
                    <DetailField label="Credits" value={selectedModuleDetails.credits} />
                    <DetailField
                      label="Prerequisites"
                      value={selectedModuleDetails.prerequisites ?? "None listed"}
                    />

                    <div className="rounded-md border border-border bg-background/50 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        Term Availability
                      </div>
                      {selectedModuleDetails.termAvailability.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedModuleDetails.termAvailability.map((termOption) => (
                            <span
                              className="rounded-md border border-blue-400/25 bg-blue-950/40 px-2 py-1 text-xs text-blue-100"
                              key={termOption}
                            >
                              {termOption}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">Not announced</p>
                      )}
                    </div>

                    <div className="rounded-md border border-border bg-background/50 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Schedule
                      </div>
                      <p className="mt-2 text-sm leading-6">
                        {selectedModuleDetails.schedule ?? "Schedule to be confirmed"}
                      </p>
                    </div>

                    {selectedModuleDetails.gradingBasis && (
                      <DetailField label="Grading basis" value={selectedModuleDetails.gradingBasis} />
                    )}
                    {selectedModuleDetails.examDates && (
                      <DetailField label="Exam dates" value={selectedModuleDetails.examDates} />
                    )}
                  </>
                ) : (
                  <p className="rounded-md border border-border bg-background/50 p-4 text-sm text-muted-foreground">
                    Select a module from the search results to view detailed information.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-xl">Selected Semester Modules</CardTitle>
                <CardDescription>
                  {selectedSemesterPlan
                    ? `${selectedSemesterPlan.year} ${selectedSemesterPlan.term}`
                    : "Create or select a semester plan"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border border-border bg-background/50 p-4">
                  <p className="text-sm text-muted-foreground">Total credits</p>
                  <p className="mt-1 text-2xl font-semibold text-accent">{totalCredits}</p>
                </div>

                {!selectedSemesterPlan || selectedSemesterPlan.plannedModules.length === 0 ? (
                  <p className="rounded-md border border-border bg-background/50 p-4 text-sm text-muted-foreground">
                    No modules added yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedSemesterPlan.plannedModules.map((plannedModule) => (
                      <div
                        className="rounded-md border border-border bg-background/50 p-4"
                        key={plannedModule.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-accent">
                              {plannedModule.module.code}
                            </p>
                            <p className="mt-1 text-sm font-medium">{plannedModule.module.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {plannedModule.module.credits} credit
                              {plannedModule.module.credits === 1 ? "" : "s"}
                            </p>
                          </div>
                          <Button
                            aria-label={`Remove ${plannedModule.module.code}`}
                            disabled={removingPlannedModuleId === plannedModule.id}
                            onClick={() => handleRemoveModule(plannedModule.id)}
                            size="icon"
                            type="button"
                            variant="outline"
                          >
                            {removingPlannedModuleId === plannedModule.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
    </div>
  );
}
