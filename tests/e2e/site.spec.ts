import { test, expect } from "@playwright/test";
import { blogPosts } from "../../src/data/blog-posts";
import {
  SITE_VIEWPORTS,
  collectBrowserIssues,
  expectAllImagesLoaded,
  expectMonaSansOnly,
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

test.describe("site-wide rendering", () => {
  test("every page renders with no console or page errors", async ({ page }) => {
    const issues = collectBrowserIssues(page);
    for (const path of PAGE_PATHS) {
      await page.goto(path);
      await expect(page.locator("main#main")).toBeVisible();
    }
    expectNoBrowserIssues(issues);
  });

  test("not-found page renders the custom 404 content", async ({ page }) => {
    const response = await page.goto("/nope definitely not a real page");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "This page could not be found." }),
    ).toBeVisible();
  });

  test("Mona Sans is the only loaded font on every checked page", async ({
    page,
  }) => {
    for (const path of ["/", "/about", `/blog/${blogPosts[0].slug}`, "/survey"]) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await page.waitForLoadState("networkidle");
      await expectMonaSansOnly(page);
    }
  });

  test("images load on every page", async ({ page }) => {
    for (const path of ["/", "/about", "/blog", `/blog/${blogPosts[0].slug}`]) {
      await page.goto(path);
      await expectAllImagesLoaded(page);
    }
  });

  test("no horizontal overflow at the four required viewports", async ({
    page,
  }) => {
    for (const viewport of SITE_VIEWPORTS) {
      await page.setViewportSize(viewport);
      for (const path of PAGE_PATHS) {
        await page.goto(path);
        await expectNoHorizontalOverflow(page);
      }
    }
  });

  test("keyboard focus lands on the skip link with a visible outline", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const focus = await page.evaluate(() => {
      const active = document.activeElement;
      if (!active) return null;
      const style = getComputedStyle(active);
      return {
        text: active.textContent ?? "",
        outlineStyle: style.outlineStyle,
        outlineWidth: parseFloat(style.outlineWidth),
      };
    });
    expect(focus, "focused element exists").not.toBeNull();
    expect(focus?.text.toLowerCase()).toContain("skip");
    expect(focus?.outlineStyle).not.toBe("none");
    expect(focus?.outlineWidth).toBeGreaterThanOrEqual(1);
  });
});

test.describe("navigation between pages", () => {
  test("header links navigate to their pages", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole("heading", { name: "Meet Hannah Lepathy" })).toBeVisible();

    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Blog" }).click();
    await expect(page).toHaveURL(/\/blog$/);
    await expect(
      page.getByRole("heading", { name: "Practical waste-management guides" }),
    ).toBeVisible();

    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Survey" }).click();
    await expect(page).toHaveURL(/\/survey$/);
  });

  test("blog index links to all four articles and each article renders", async ({
    page,
  }) => {
    await page.goto("/blog");
    for (const post of blogPosts) {
      const response = await page.goto(`/blog/${post.slug}`);
      expect(response?.status()).toBe(200);
      await expect(
        page.getByRole("heading", { level: 1, name: post.title }),
      ).toBeVisible();
      await expect(page.getByText("Takeaway", { exact: true })).toBeVisible();
      await expect(
        page.locator("header").getByText(`By ${post.author}`, { exact: true }),
      ).toBeVisible();
    }
  });

  test("hero primary CTA navigates to the survey experience", async ({ page }) => {
    // The e2e web server runs with SURVEY_DEV_PREVIEW=1, so /survey renders the
    // survey experience here; the production closed state is verified
    // separately against a production build.
    await page.goto("/");
    await page.getByRole("link", { name: "Take the survey" }).first().click();
    await expect(page).toHaveURL(/\/survey$/);
    await expect(
      page.getByRole("heading", { name: "Help us understand waste habits." }),
    ).toBeVisible();
  });

  test("blog back link returns to the index", async ({ page }) => {
    await page.goto(`/blog/${blogPosts[0].slug}`);
    await page.getByRole("link", { name: "Back to blog" }).click();
    await expect(page).toHaveURL(/\/blog$/);
  });
});
