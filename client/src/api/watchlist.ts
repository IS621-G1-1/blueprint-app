import type { WatchlistItem } from "@/types/planner";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:4000";

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

interface WatchlistResponse {
  watchlistItems: WatchlistItem[];
}

interface WatchlistItemResponse {
  message: string;
  watchlistItem: WatchlistItem;
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

export async function getWatchlist() {
  const response = await fetch(`${API_BASE_URL}/watchlist`, {
    headers: getAuthHeaders(),
  });

  const data = await parseResponse<WatchlistResponse>(response);
  return data.watchlistItems;
}

export async function addModuleToWatchlist(moduleId: string) {
  const response = await fetch(`${API_BASE_URL}/watchlist`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ moduleId }),
  });

  return parseResponse<WatchlistItemResponse>(response);
}

export async function removeModuleFromWatchlist(watchlistItemId: string) {
  const response = await fetch(`${API_BASE_URL}/watchlist/${encodeURIComponent(watchlistItemId)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return parseResponse<MessageResponse>(response);
}
