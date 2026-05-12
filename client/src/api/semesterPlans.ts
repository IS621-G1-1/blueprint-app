import type { SemesterPlan } from "@/types/planner";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:4000";

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

interface SemesterPlansResponse {
  semesterPlans: SemesterPlan[];
}

interface SemesterPlanResponse {
  message: string;
  semesterPlan: SemesterPlan;
}

interface MessageResponse {
  message: string;
}

function getAuthHeaders() {
  const token = localStorage.getItem("blueprint_token");

  return {
    Authorization: `Bearer ${token ?? ""}`,
    "Content-Type": "application/json",
  };
}

async function parseResponse<TResponse>(response: Response): Promise<TResponse> {
  const data = (await response.json().catch(() => ({}))) as TResponse | ApiErrorResponse;

  if (!response.ok) {
    const errorData = data as ApiErrorResponse;
    throw new Error(errorData.error ?? errorData.message ?? "Request failed. Please try again.");
  }

  return data as TResponse;
}

export async function getSemesterPlans() {
  const response = await fetch(`${API_BASE_URL}/semester-plans`, {
    headers: getAuthHeaders(),
  });

  const data = await parseResponse<SemesterPlansResponse>(response);
  return data.semesterPlans;
}

export async function createOrLoadSemesterPlan(payload: { year: number; term: string }) {
  const response = await fetch(`${API_BASE_URL}/semester-plans`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse<SemesterPlanResponse>(response);
}

export async function addModuleToSemesterPlan(semesterPlanId: string, moduleId: string) {
  const response = await fetch(`${API_BASE_URL}/semester-plans/${semesterPlanId}/modules`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ moduleId }),
  });

  return parseResponse<SemesterPlanResponse>(response);
}

export async function removeModuleFromSemesterPlan(
  semesterPlanId: string,
  plannedModuleId: string,
) {
  const response = await fetch(
    `${API_BASE_URL}/semester-plans/${semesterPlanId}/modules/${plannedModuleId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  return parseResponse<MessageResponse>(response);
}
