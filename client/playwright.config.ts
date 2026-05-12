import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:5173",
  },
  webServer: {
    command: "docker compose -f ../docker-compose.yaml up --wait",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
