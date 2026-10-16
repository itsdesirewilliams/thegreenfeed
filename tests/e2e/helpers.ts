import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Shared e2e helpers for TheGreenFeed browser tests.
 */

export const SITE_VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 700 },
] as const;

/**
 * Collects browser console errors and uncaught page errors. Assert at the end
 * of a test with expectNoBrowserIssues.
 */
export function collectBrowserIssues(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    pageErrors.push(String(error));
  });
  return { consoleErrors, pageErrors };
}

/** Asserts the page ran without uncaught errors or console errors. */
export function expectNoBrowserIssues(issues: {
  consoleErrors: string[];
  pageErrors: string[];
}) {
  expect(issues.pageErrors, "uncaught page errors").toEqual([]);
  expect(issues.consoleErrors, "console errors").toEqual([]);
}

/** The document must not scroll horizontally (no layout overflow). */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const documentElement = document.documentElement;
    return {
      scrollWidth: documentElement.scrollWidth,
      clientWidth: documentElement.clientWidth,
      scrollLeft: documentElement.scrollLeft,
    };
  });
  expect(
    overflow.scrollWidth,
    `horizontal overflow: scrollWidth ${overflow.scrollWidth} vs clientWidth ${overflow.clientWidth}`,
  ).toBeLessThanOrEqual(overflow.clientWidth + 1);
  expect(overflow.scrollLeft, "already scrolled horizontally").toBe(0);
}

/** Mona Sans must be the only loaded font family, and body/headings use it. */
export async function expectMonaSansOnly(page: Page) {
  const fontFamilies = await page.evaluate(() =>
    Array.from(document.fonts)
      .map((face) => face.family)
      // Next.js dev tooling injects an internal font (e.g. "__nextjs-Geist")
      // for the dev overlay; it is not part of the site's typography.
      .filter((family) => !family.startsWith("__nextjs-")),
  );
  expect(fontFamilies.length, "fonts are loaded").toBeGreaterThan(0);
  for (const family of fontFamilies) {
    expect(family, `loaded @font-face family`).toMatch(/Mona Sans/);
  }
  const usedFonts = await page.evaluate(() => {
    const samples: string[] = [];
    const direct = document.querySelector<HTMLElement>("body");
    if (direct) samples.push(getComputedStyle(direct).fontFamily);
    for (const selector of ["h1", "header a", "footer p"]) {
      const element = document.querySelector<HTMLElement>(selector);
      if (element) samples.push(getComputedStyle(element).fontFamily);
    }
    return samples;
  });
  expect(usedFonts.length).toBeGreaterThan(0);
  for (const used of usedFonts) {
    expect(used, "computed font-family").toContain("Mona Sans");
    expect(used, "computed font-family").not.toMatch(
      /Manrope|Instrument|Georgia|serif/i,
    );
  }
}

/** Every visible <img> must have successfully loaded bitmap data. */
export async function expectAllImagesLoaded(page: Page) {
  const images = page.locator("img");
  const count = await images.count();
  for (let index = 0; index < count; index++) {
    const image = images.nth(index);
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(
        async () =>
          image.evaluate(
            (element: HTMLImageElement) =>
              element.complete && element.naturalWidth > 0,
          ),
        { message: `image ${index} loaded` },
      )
      .toBe(true);
  }
}
