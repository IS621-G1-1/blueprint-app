export interface Module {
  id: string;
  code: string;
  name: string;
  credits: number;
  description: string | null;
  school: string | null;
  createdAt: string;
}

export interface PlannedModule {
  id: string;
  semesterPlanId: string;
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
