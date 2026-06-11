import type { Module } from "@/types/planner";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:4000";

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

interface ModulesResponse {
  modules: Module[];
}

interface ModuleResponse {
  module: Module;
}

function getAuthHeaders() {
  const token = localStorage.getItem("blueprint_token");

  return {
    Authorization: `Bearer ${token ?? ""}`,
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

export async function getModules() {
  const response = await fetch(`${API_BASE_URL}/modules`, {
    headers: getAuthHeaders(),
  });

  const data = await parseResponse<ModulesResponse>(response);
  return data.modules;
}

export async function searchModules(query: string) {
  const params = new URLSearchParams({ query });
  const response = await fetch(`${API_BASE_URL}/modules/search?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  const data = await parseResponse<ModulesResponse>(response);
  return data.modules;
}

export async function getModuleDetails(identifier: string) {
  const response = await fetch(`${API_BASE_URL}/modules/${encodeURIComponent(identifier)}`, {
    headers: getAuthHeaders(),
  });

  const data = await parseResponse<ModuleResponse>(response);
  return data.module;
}
