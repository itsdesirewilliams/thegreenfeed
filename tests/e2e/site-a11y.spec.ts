import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { blogPosts } from "../../src/data/blog-posts";
import {
  SITE_VIEWPORTS,
  collectBrowserIssues,
  expectNoBrowserIssues,
  expectNoHorizontalOverflow,
} from "./helpers";

const PAGE_PATHS = [
  "/",
  "/about",
  "/blog",
  `/blog/${blogPosts[0].slug}`,
  "/survey",
];

test.describe("responsive layout", () => {
  for (const path of PAGE_PATHS) {
    test(`no horizontal overflow on ${path} at all required viewports`, async ({
      page,
    }) => {
      for (const viewport of SITE_VIEWPORTS) {
        await page.setViewportSize(viewport);
        await page.goto(path);
        await expect(page.locator("main#main")).toBeVisible();
        await expectNoHorizontalOverflow(page);
        await page.setViewportSize({ width: 1440, height: 900 });
      }
    });
  }

  test("mobile navigation sheet opens and reaches every page at mobile width", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const menuButton = page.getByRole("button", {
      name: "Open navigation menu",
    });
    await expect(async () => {
      await menuButton.click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 1_500 });
    }).toPass({ timeout: 30_000 });
    const sheet = page.getByRole("dialog");
    for (const label of ["Home", "About", "Blog", "Survey"]) {
      await expect(sheet.getByRole("link", { name: label })).toBeVisible();
    }
    await sheet.getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(
      page.getByRole("heading", { name: "Meet Hannah Lepathy" }),
    ).toBeVisible();
  });

  test("header and footer navigation visible and reachable at desktop", async ({
    page,
  }) => {
    await page.goto("/");
    const headerNav = page.getByRole("navigation", { name: "Main" });
    await expect(headerNav.getByRole("link", { name: "About" })).toBeVisible();
    const footerNav = page.getByRole("navigation", { name: "Footer" });
    for (const label of ["Home", "About", "Blog", "Survey"]) {
      await expect(footerNav.getByRole("link", { name: label })).toBeVisible();
    }
  });
});

test.describe("axe accessibility scans", () => {
  for (const path of PAGE_PATHS) {
    test(`no critical or serious axe violations on ${path}`, async ({
      page,
    }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const serious = results.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      );
      const summary = serious
        .map(
          (violation) =>
            `${violation.id} (${violation.impact}): ${violation.nodes
              .slice(0, 3)
              .map((node) => node.target.join(" "))
              .join(", ")}`,
        )
        .join("\n");
      expect
        .soft(serious, `axe serious violations on ${path}:\n${summary}`)
        .toEqual([]);
    });
  }

  test("survey intro and consent screen has no critical or serious violations", async ({
    page,
  }) => {
    await page.goto("/survey");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = results.violations.filter((violation) =>
      ["critical", "serious"].includes(violation.impact ?? ""),
    );
    expect
      .soft(
        serious.map((violation) => violation.id),
        "axe violations on survey intro",
      )
      .toEqual([]);
  });

  test("a mid-survey question screen has no critical or serious violations", async ({
    page,
  }) => {
    await page.goto("/survey");
    const consent = page.getByRole("radio", {
      name: "Yes, I agree to participate.",
    });
    await expect(async () => {
      await page
        .locator("label", { hasText: "Yes, I agree to participate." })
        .click();
      await expect(consent).toBeChecked({ timeout: 1_500 });
    }).toPass({ timeout: 30_000 });
    const startButton = page.getByRole("button", { name: "Start the survey" });
    await expect(startButton).toBeEnabled();
    await startButton.click();
    await expect(page.locator("#question-q1 legend")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .include("main")
      .analyze();
    const serious = results.violations.filter((violation) =>
      ["critical", "serious"].includes(violation.impact ?? ""),
    );
    expect(serious.map((v) => v.id)).toEqual([]);
  });
});

test.describe("unexpected errors guard", () => {
  test("no console or page errors across pages and viewports", async ({
    page,
  }) => {
    const issues = collectBrowserIssues(page);
    for (const viewport of SITE_VIEWPORTS) {
      await page.setViewportSize(viewport);
      for (const path of ["/", "/blog", "/survey"]) {
        await page.goto(path);
        await expect(page.locator("main#main")).toBeVisible();
      }
    }
    expectNoBrowserIssues(issues);
  });
});
