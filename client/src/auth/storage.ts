// Single JWT in localStorage. No refresh token (server issues 7-day JWTs;
// user re-logs in after expiry).

const ACCESS = "blueprint.access_token";

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS),
  set: (access: string) => {
    localStorage.setItem(ACCESS, access);
  },
  clear: () => {
    localStorage.removeItem(ACCESS);
  },
};
