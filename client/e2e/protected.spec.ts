import { expect, test } from "@playwright/test";

test.describe("Protected routes", () => {
  test("unauthenticated user visiting /dashboard is redirected to /login", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/login");
  });

  test("unauthenticated user visiting /planner is redirected to /login", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/planner");
    await expect(page).toHaveURL("/login");
  });

  test("authenticated user can navigate between protected routes", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "ara@smu.edu.sg");
    await page.fill('input[type="password"]', "password96");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard");

    await page.getByRole("link", { name: "Planner" }).click();
    await expect(page).toHaveURL("/planner");

    await page.getByRole("link", { name: "Home", exact: true }).click();
    await expect(page).toHaveURL("/dashboard");
  });
});
