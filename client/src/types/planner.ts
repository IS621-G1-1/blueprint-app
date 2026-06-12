export interface Module {
  id: string;
  code: string;
  name: string;
  credits: number;
  description: string | null;
  school: string | null;
  prerequisites: string | null;
  termAvailability: string[];
  schedule: string | null;
  gradingBasis: string | null;
  examDates: string | null;
  createdAt: string;
}

export interface PlannedModule {
  id: string;
  semesterPlanId: string;
  moduleId: string;
  createdAt: string;
  module: Module;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  moduleId: string;
  createdAt: string;
  module: Module;
}

export interface SemesterPlan {
  id: string;
  userId: string;
  year: number;
  term: string;
  createdAt: string;
  updatedAt: string;
  plannedModules: PlannedModule[];
}
