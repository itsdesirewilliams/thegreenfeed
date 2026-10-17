import { test, expect } from "@playwright/test";

/**
 * Regression tests for the admin-area security fix.
 *
 * Cache Components/PPR used to render admin pages as a streamed shell, so a
 * page-level `redirect()` still shipped a 200 body containing rendered
 * respondent data, and production responses were `Cache-Control: public` with a
 * `Vary` that omitted `Cookie` — so a CDN could serve a respondent's details to
 * anyone. `src/proxy.ts` now rejects unauthenticated `/admin/*` requests before
 * any route renders, and every admin response is marked `no-store`.
 *
 * These tests assert the unauthenticated surface only: in the e2e environment no
 * admin credentials are configured, so `/admin/login` is the only reachable page.
 */

const PROTECTED_PAGES = [
  "/admin",
  "/admin/responses",
  "/admin/analysis",
  "/admin/questions",
  "/admin/exports",
  "/admin/testing",
];

const PROTECTED_EXPORTS = ["/admin/exports/raw", "/admin/exports/aggregate"];

/** A well-formed id that must not be reachable without a session. */
const PROTECTED_DETAIL = "/admin/responses/00000000-0000-4000-8000-000000000000";

const PROTECTED_PATHS = [
  ...PROTECTED_PAGES,
  PROTECTED_DETAIL,
  ...PROTECTED_EXPORTS,
];

/**
 * Labels that only appear when respondent data has actually been rendered on
 * the admin response-detail table. (A respondent's name is not a safe marker:
 * the site's public OG metadata legitimately contains the author's name.)
 */
const RESPONDENT_MARKERS = [
  "Full name",
  "Phone number",
  "Programme / course",
];

function isRedirect(status: number): boolean {
  return [301, 302, 303, 307, 308].includes(status);
}

test.describe("admin area is guarded", () => {
  for (const path of PROTECTED_PATHS) {
    test(`unauthenticated GET ${path} redirects to the login screen`, async ({
      request,
    }) => {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(isRedirect(response.status()), "status").toBe(true);
      expect(response.headers()["location"] ?? "").toMatch(/\/admin\/login$/);
    });
  }

  test("protected responses never contain respondent information", async ({
    request,
  }) => {
    for (const path of PROTECTED_PATHS) {
      const response = await request.get(path, { maxRedirects: 0 });
      const body = await response.text();
      for (const marker of RESPONDENT_MARKERS) {
        expect(body, `${path} must not leak "${marker}"`).not.toContain(marker);
      }
    }
  });

  test("admin responses are not publicly cacheable", async ({ request }) => {
    for (const path of [...PROTECTED_PATHS, "/admin/login"]) {
      const response = await request.get(path, { maxRedirects: 0 });
      const cacheControl = response.headers()["cache-control"] ?? "";
      expect(cacheControl, `${path} must not be public`).not.toMatch(
        /\bpublic\b/,
      );
      expect(cacheControl, `${path} must be private or no-store`).toMatch(
        /no-store|private/,
      );
    }
  });

  test("a browser visit to a protected page lands on the login screen", async ({
    page,
  }) => {
    await page.goto("/admin/responses");
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(
      page.getByRole("heading", { name: "Admin sign in" }),
    ).toBeVisible();

    const content = await page.content();
    for (const marker of RESPONDENT_MARKERS) {
      expect(content, `login screen must not leak "${marker}"`).not.toContain(
        marker,
      );
    }
  });

  test("the admin login page stays reachable without a session", async ({
    page,
  }) => {
    const response = await page.goto("/admin/login");
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: "Admin sign in" }),
    ).toBeVisible();
    await expect(
      page.getByText(/confidential survey responses/),
    ).toBeVisible();
  });
});
