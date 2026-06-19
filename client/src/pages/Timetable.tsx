import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, Loader2, RefreshCw } from "lucide-react";
import { getSemesterPlans } from "@/api/semesterPlans";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Module, SemesterPlan } from "@/types/planner";

const DAYS = [
  { key: "Mon", label: "Monday" },
  { key: "Tue", label: "Tuesday" },
  { key: "Wed", label: "Wednesday" },
  { key: "Thu", label: "Thursday" },
  { key: "Fri", label: "Friday" },
  { key: "Sat", label: "Saturday" },
  { key: "Sun", label: "Sunday" },
] as const;

const DAY_ALIASES: Record<string, string> = {
  monday: "Mon",
  mon: "Mon",
  tuesday: "Tue",
  tue: "Tue",
  tues: "Tue",
  wednesday: "Wed",
  wed: "Wed",
  thursday: "Thu",
  thu: "Thu",
  thur: "Thu",
  thurs: "Thu",
  friday: "Fri",
  fri: "Fri",
  saturday: "Sat",
  sat: "Sat",
  sunday: "Sun",
  sun: "Sun",
};

const DEFAULT_START_MINUTES = 8 * 60;
const DEFAULT_END_MINUTES = 22 * 60;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT_REM = 2;

interface Lesson {
  id: string;
  module: Module;
  day: string;
  startMinutes: number;
  endMinutes: number;
  startLabel: string;
  endLabel: string;
  hasClash: boolean;
}

function selectClassName() {
  return "flex h-10 w-full rounded-md border border-input bg-background/70 px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";
}

function parseClockTime(value: string) {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  const period = match[3].toUpperCase();

  if (hour < 1 || hour > 12 || minute < 0 || minute >= 60) {
    return null;
  }

  const normalizedHour = (hour % 12) + (period === "PM" ? 12 : 0);
  return normalizedHour * 60 + minute;
}

function formatMinutes(minutes: number) {
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

function parseSchedule(module: Module): Lesson[] {
  if (!module.schedule) {
    return [];
  }

  const scheduleParts = module.schedule
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  return scheduleParts.flatMap((schedulePart, scheduleIndex) => {
    const match = schedulePart.match(
      /^([A-Za-z/,\s]+?)\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM))$/i,
    );

    if (!match) {
      return [];
    }

    const startMinutes = parseClockTime(match[2]);
    const endMinutes = parseClockTime(match[3]);

    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return [];
    }

    const dayKeys = match[1]
      .split(/[/,]/)
      .map((day) => DAY_ALIASES[day.trim().toLowerCase()])
      .filter((day): day is string => Boolean(day));

    return dayKeys.map((day, dayIndex) => ({
      id: `${module.id}-${scheduleIndex}-${dayIndex}`,
      module,
      day,
      startMinutes,
      endMinutes,
      startLabel: formatMinutes(startMinutes),
      endLabel: formatMinutes(endMinutes),
      hasClash: false,
    }));
  });
}

function markClashes(lessons: Lesson[]) {
  return lessons.map((lesson) => ({
    ...lesson,
    hasClash: lessons.some(
      (otherLesson) =>
        otherLesson.id !== lesson.id &&
        otherLesson.day === lesson.day &&
        lesson.startMinutes < otherLesson.endMinutes &&
        otherLesson.startMinutes < lesson.endMinutes,
    ),
  }));
}

function buildTimeSlots(startMinutes: number, endMinutes: number) {
  const slots = [];

  for (let minutes = startMinutes; minutes <= endMinutes; minutes += 60) {
    slots.push(minutes);
  }

  return slots;
}

export function Timetable() {
  const [semesterPlans, setSemesterPlans] = useState<SemesterPlan[]>([]);
  const [selectedSemesterPlanId, setSelectedSemesterPlanId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTimetable = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const plans = await getSemesterPlans();
      setSemesterPlans(plans);
      setSelectedSemesterPlanId((currentPlanId) => {
        if (plans.some((plan) => plan.id === currentPlanId)) {
          return currentPlanId;
        }

        return plans[0]?.id ?? "";
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Timetable could not load.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadTimetable();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadTimetable]);

  const selectedSemesterPlan = useMemo(
    () => semesterPlans.find((plan) => plan.id === selectedSemesterPlanId) ?? null,
    [selectedSemesterPlanId, semesterPlans],
  );

  const plannedModules = useMemo(
    () => selectedSemesterPlan?.plannedModules ?? [],
    [selectedSemesterPlan],
  );

  const lessons = useMemo(
    () => markClashes(plannedModules.flatMap((plannedModule) => parseSchedule(plannedModule.module))),
    [plannedModules],
  );

  const unscheduledModules = useMemo(
    () =>
      plannedModules.filter(
        (plannedModule) => plannedModule.module.schedule && parseSchedule(plannedModule.module).length === 0,
      ),
    [plannedModules],
  );

  const timetableStart = useMemo(() => {
    const earliestLesson = Math.min(...lessons.map((lesson) => lesson.startMinutes));

    if (!Number.isFinite(earliestLesson)) {
      return DEFAULT_START_MINUTES;
    }

    return Math.min(DEFAULT_START_MINUTES, Math.floor(earliestLesson / 60) * 60);
  }, [lessons]);

  const timetableEnd = useMemo(() => {
    const latestLesson = Math.max(...lessons.map((lesson) => lesson.endMinutes));

    if (!Number.isFinite(latestLesson)) {
      return DEFAULT_END_MINUTES;
    }

    return Math.max(DEFAULT_END_MINUTES, Math.ceil(latestLesson / 60) * 60);
  }, [lessons]);

  const rowCount = Math.max(1, (timetableEnd - timetableStart) / SLOT_MINUTES);
  const timeSlots = buildTimeSlots(timetableStart, timetableEnd);
  const hasClashes = !error && lessons.some((lesson) => lesson.hasClash);
  const hasNoModules = !loading && !error && plannedModules.length === 0;
  const hasNoScheduledLessons = !loading && !error && plannedModules.length > 0 && lessons.length === 0;

  return (
    <div className="space-y-5">
      <Card className="border-blue-400/35 bg-card/90">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-md border border-accent/40 bg-accent/10 text-accent">
                <CalendarDays className="h-5 w-5" />
              </div>
              <CardTitle>Timetable</CardTitle>
              <CardDescription>
                Weekly view for modules already added to your semester plan.
              </CardDescription>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-72">
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
              <Button disabled={loading} onClick={loadTimetable} type="button" variant="outline">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Retry
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>{error}</span>
                <Button onClick={loadTimetable} size="sm" type="button" variant="outline">
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {hasClashes && (
            <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Timetable clash detected. Conflicting lessons are highlighted below.
              </AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center gap-2 rounded-md border border-border bg-background/50 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading timetable...
            </div>
          ) : hasNoModules ? (
            <div className="rounded-md border border-dashed border-border bg-background/50 p-6 text-sm text-muted-foreground">
              No modules in this semester plan yet. Add modules in Planner to build your weekly schedule.
            </div>
          ) : hasNoScheduledLessons ? (
            <div className="rounded-md border border-dashed border-border bg-background/50 p-6 text-sm text-muted-foreground">
              Your planned modules do not have schedule data yet.
            </div>
          ) : !error ? (
            <div className="overflow-x-auto">
              <div className="min-w-[940px]">
                <div className="grid grid-cols-[5rem_repeat(7,minmax(8rem,1fr))] border-b border-border text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <div className="border-r border-border px-2 py-3">Time</div>
                  {DAYS.map((day) => (
                    <div className="border-r border-border px-3 py-3 last:border-r-0" key={day.key}>
                      {day.label}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-[5rem_repeat(7,minmax(8rem,1fr))]">
                  <div
                    className="relative border-r border-border"
                    style={{ height: `${rowCount * SLOT_HEIGHT_REM}rem` }}
                  >
                    {timeSlots.map((slot) => (
                      <div
                        className="absolute left-0 right-0 border-t border-border/70 px-2 pt-1 text-xs text-muted-foreground"
                        key={slot}
                        style={{
                          top: `${((slot - timetableStart) / SLOT_MINUTES) * SLOT_HEIGHT_REM}rem`,
                        }}
                      >
                        {formatMinutes(slot)}
                      </div>
                    ))}
                  </div>

                  {DAYS.map((day) => {
                    const dayLessons = lessons.filter((lesson) => lesson.day === day.key);

                    return (
                      <div
                        className="relative border-r border-border bg-background/25 last:border-r-0"
                        key={day.key}
                        style={{ height: `${rowCount * SLOT_HEIGHT_REM}rem` }}
                      >
                        {Array.from({ length: rowCount + 1 }).map((_, index) => (
                          <div
                            className="absolute left-0 right-0 border-t border-border/45"
                            key={index}
                            style={{ top: `${index * SLOT_HEIGHT_REM}rem` }}
                          />
                        ))}

                        {dayLessons.map((lesson) => {
                          const top =
                            ((lesson.startMinutes - timetableStart) / SLOT_MINUTES) *
                            SLOT_HEIGHT_REM;
                          const height =
                            ((lesson.endMinutes - lesson.startMinutes) / SLOT_MINUTES) *
                            SLOT_HEIGHT_REM;

                          return (
                            <div
                              className={cn(
                                "absolute left-2 right-2 z-10 overflow-hidden rounded-md border p-2 text-xs shadow-sm",
                                lesson.hasClash
                                  ? "border-destructive bg-destructive/20 text-destructive"
                                  : "border-accent/50 bg-accent/15 text-foreground",
                              )}
                              key={lesson.id}
                              style={{
                                top: `${top}rem`,
                                height: `${Math.max(height, 2.5)}rem`,
                              }}
                              title={`${lesson.module.code} ${lesson.startLabel} - ${lesson.endLabel}`}
                            >
                              <p className="font-semibold leading-tight">{lesson.module.code}</p>
                              <p className="mt-1 leading-tight text-current/85">
                                {lesson.startLabel} - {lesson.endLabel}
                              </p>
                              <p className="mt-1 truncate leading-tight text-current/75">
                                {lesson.module.name}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {unscheduledModules.length > 0 && !loading && !error && (
        <Card className="border-blue-400/25 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg">Unshown Modules</CardTitle>
            <CardDescription>These modules have schedule text that could not be placed.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {unscheduledModules.map((plannedModule) => (
              <div
                className="rounded-md border border-border bg-background/50 p-3 text-sm"
                key={plannedModule.id}
              >
                <p className="font-semibold">{plannedModule.module.code}</p>
                <p className="mt-1 text-muted-foreground">{plannedModule.module.schedule}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
