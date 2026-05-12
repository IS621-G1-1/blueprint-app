import { expect, test } from "@playwright/test";

test.describe("Login", () => {
  test("redirects to dashboard on valid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "ara@smu.edu.sg");
    await page.fill('input[type="password"]', "password96");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Hello aravinth");
  });

  test("shows error on invalid password", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "ara@smu.edu.sg");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("shows error on unknown email", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "nobody@smu.edu.sg");
    await page.fill('input[type="password"]', "password96");
    await page.click('button[type="submit"]');
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });
});
