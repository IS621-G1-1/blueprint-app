// localStorage keys for the auth tokens. Centralized so the AuthContext and the
// API client both reference the same strings.

const ACCESS = "blueprint.access_token";
const REFRESH = "blueprint.refresh_token";

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS),
  getRefresh: () => localStorage.getItem(REFRESH),
  set: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  },
};
