import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  changePassword,
  clearAuthSession,
  getAuthHeaders,
  login,
  persistAuthSession,
  readStoredUser,
  requestRegistration,
} from "./auth";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("auth api helpers", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    localStorage.clear();
  });

  it("trims registration names and emails before posting", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "sent" }));

    await requestRegistration({
      name: "  Ada Student  ",
      email: "  Ada@SIS.SMU.EDU.SG  ",
      password: "password12345",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/auth/register/request",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Ada Student",
          email: "Ada@SIS.SMU.EDU.SG",
          password: "password12345",
        }),
      }),
    );
  });

  it("trims login emails before posting", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        message: "ok",
        token: "token-1",
        user: { id: "user-1", email: "ada@smu.edu.sg", name: "Ada", role: "STUDENT" },
      }),
    );

    await login({ email: "  ada@smu.edu.sg  ", password: "password12345" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/auth/login",
      expect.objectContaining({
        body: JSON.stringify({
          email: "ada@smu.edu.sg",
          password: "password12345",
        }),
      }),
    );
  });

  it("throws ApiError with the server status and message", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Invalid email or password" }, { status: 401 }));

    await expect(login({ email: "ada@smu.edu.sg", password: "wrong" })).rejects.toMatchObject({
      name: "ApiError",
      message: "Invalid email or password",
      status: 401,
    } satisfies Partial<ApiError>);
  });

  it("builds auth headers from the stored token", () => {
    localStorage.setItem("blueprint_token", "token-1");

    expect(getAuthHeaders()).toEqual({
      Authorization: "Bearer token-1",
      "Content-Type": "application/json",
    });
  });

  it("persists, reads, and clears auth session state", () => {
    const response = {
      message: "ok",
      token: "token-1",
      user: { id: "user-1", email: "ada@smu.edu.sg", name: "Ada", role: "STUDENT" },
    };

    persistAuthSession(response);
    expect(readStoredUser()).toEqual(response.user);
    expect(localStorage.getItem("blueprint_token")).toBe("token-1");

    clearAuthSession();
    expect(readStoredUser()).toBeNull();
    expect(localStorage.getItem("blueprint_token")).toBeNull();
  });

  it("returns null when stored user JSON is invalid", () => {
    localStorage.setItem("blueprint_user", "{bad json");

    expect(readStoredUser()).toBeNull();
  });

  it("sends authenticated change-password requests", async () => {
    localStorage.setItem("blueprint_token", "token-1");
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "changed" }));

    await changePassword({
      currentPassword: "old-password",
      newPassword: "new-password-123",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/auth/change-password",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer token-1",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: "old-password",
          newPassword: "new-password-123",
        }),
      }),
    );
  });
});
