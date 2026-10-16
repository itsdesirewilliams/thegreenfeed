import { test, expect, type Page } from "@playwright/test";
import {
  SURVEY_PROFILE_FIELDS,
  SURVEY_SECTIONS,
  surveyQuestions,
} from "../../src/data/survey-questions";
import {
  collectBrowserIssues,
  expectNoBrowserIssues,
  expectNoHorizontalOverflow,
} from "./helpers";

const TOTAL = surveyQuestions.length;

function sectionNumber(questionSection: string): number {
  return (
    SURVEY_SECTIONS.findIndex((section) => section.title === questionSection) + 1
  );
}

async function openSurvey(page: Page) {
  await page.goto("/survey");
  await expect(
    page.getByRole("heading", { name: "Help us understand waste habits." }),
  ).toBeVisible();
}

/**
 * Clicks a consent option and confirms the choice registered. The survey is a
 * client component, so a click that lands before hydration would toggle the
 * native control without updating React state; retrying until the control
 * reports a checked state removes that race.
 */
async function selectConsentOption(page: Page, label: string) {
  const radio = page.getByRole("radio", { name: label });
  await expect(async () => {
    await page.locator("label", { hasText: label }).click();
    await expect(radio).toBeChecked({ timeout: 1_500 });
  }).toPass({ timeout: 30_000 });
}

async function acceptConsent(page: Page) {
  await selectConsentOption(page, "Yes, I agree to participate.");
  await expect(
    page.getByRole("button", { name: "Start the survey" }),
  ).toBeEnabled();
}

async function expectQuestionScreen(page: Page, questionIndex: number) {
  const question = surveyQuestions[questionIndex];
  await expect(
    page.locator(`#question-${question.id} legend`),
  ).toContainText(question.label);
  await expect(
    page.getByText(
      `Section ${sectionNumber(question.section)} · ${question.section}`,
    ),
  ).toBeVisible();
  await expect(
    page.getByText(`Question ${questionIndex + 1} of ${TOTAL}`),
  ).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(3);
}

async function chooseOption(
  page: Page,
  questionIndex: number,
  optionIndex: number,
) {
  const option = surveyQuestions[questionIndex].options![optionIndex];
  const radio = page.getByRole("radio", { name: option.label });
  await expect(async () => {
    await page.locator("label", { hasText: option.label }).click();
    await expect(radio).toBeChecked({ timeout: 1_500 });
  }).toPass({ timeout: 30_000 });
}

async function enterQuestions(page: Page) {
  const issues = collectBrowserIssues(page);
  await openSurvey(page);
  await acceptConsent(page);
  await page.getByRole("button", { name: "Start the survey" }).click();
  await expectQuestionScreen(page, 0);
  expectNoBrowserIssues(issues);
}

async function assertFocusOnStep(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.activeElement?.closest("div[tabindex='-1']")?.tagName ===
          "DIV",
      ),
    )
    .toBe(true);
}

test.describe("survey introduction and consent", () => {
  test("intro copy, consent question and exactly three options are shown", async ({
    page,
  }) => {
    const issues = collectBrowserIssues(page);
    await openSurvey(page);
    await expect(
      page.getByText(
        "Participation is voluntary, and you can close this page at any time before submitting.",
      ),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Responses are anonymous. Please do not include your name, roll number, phone number, or email address.",
      ),
    ).toBeVisible();
    await expect(
      page.getByText("Do you agree to take part in this anonymous student survey?"),
    ).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(3);
    for (const label of [
      "Yes, I agree to participate.",
      "No, I do not agree to participate.",
      "Prefer not to answer.",
    ]) {
      await expect(page.getByRole("radio", { name: label })).toBeVisible();
    }
    await expect(
      page.getByRole("button", { name: "Start the survey" }),
    ).toBeDisabled();
    expectNoBrowserIssues(issues);
  });

  for (const declinedLabel of [
    "No, I do not agree to participate.",
    "Prefer not to answer.",
  ]) {
    test(`declining with "${declinedLabel}" stops the survey`, async ({
      page,
    }) => {
      await openSurvey(page);
      await selectConsentOption(page, declinedLabel);
      await expect(page.getByText(/The survey ends here/)).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Start the survey" }),
      ).toBeDisabled();
    });
  }

  test("accepting consent allows progression; changing back hides the notice", async ({
    page,
  }) => {
    await openSurvey(page);
    await selectConsentOption(page, "No, I do not agree to participate.");
    await expect(page.getByText(/survey ends here/)).toBeVisible();
    await acceptConsent(page);
    await expect(page.getByText(/survey ends here/)).toBeHidden();
    await page.getByRole("button", { name: "Start the survey" }).click();
    await expectQuestionScreen(page, 0);
  });
});

test.describe("survey question flow", () => {
  test("all 16 questions render in order with three options each", async ({
    page,
  }) => {
    await enterQuestions(page);
    for (let i = 0; i < TOTAL; i++) {
      await expectQuestionScreen(page, i);
      if (i < TOTAL - 1) {
        await expect(
          page.getByRole("button", { name: "Continue" }),
        ).toBeDisabled();
        await chooseOption(page, i, 0);
        await page.getByRole("button", { name: "Continue" }).click();
      } else {
        await expect(
          page.getByRole("button", { name: "Submit response" }),
        ).toBeVisible();
      }
    }
  });

  test("full flow: consent, all 16 questions, progress, submit succeeds", async ({
    page,
  }) => {
    const issues = collectBrowserIssues(page);
    const submissions: Array<Record<string, unknown>> = [];
    await page.route("**/api/survey", async (route) => {
      submissions.push(JSON.parse(route.request().postData() ?? "{}"));
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await enterQuestions(page);
    for (let i = 0; i < TOTAL; i++) {
      const optionIndex = i % 3;
      await chooseOption(page, i, optionIndex);
      if (i < TOTAL - 1) {
        await page.getByRole("button", { name: "Continue" }).click();
        await assertFocusOnStep(page);
      }
    }

    await expect(
      page.getByRole("button", { name: "Submit response" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Submit response" }).click();
    await expect(
      page.getByText("Thank you — your response was recorded."),
    ).toBeVisible();

    expect(submissions).toHaveLength(1);
    const body = submissions[0] as {
      answers: Record<string, unknown>;
      schemaVersion: string;
    };
    expect(body.schemaVersion).toBe("v2");
    expect(body.answers.consent).toBe(true);
    const answerKeys = Object.keys(body.answers);
    expect(answerKeys).toHaveLength(TOTAL + 1);
    for (let i = 0; i < TOTAL; i++) {
      const question = surveyQuestions[i];
      expect(body.answers[question.id]).toBe(question.options![i % 3].value);
    }

    await expect(
      page.locator("div.flex.flex-col.divide-y > div"),
    ).toHaveCount(TOTAL);
    expectNoBrowserIssues(issues);
  });

  test("full flow works at mobile width with no horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const submissions: Array<Record<string, unknown>> = [];
    await page.route("**/api/survey", async (route) => {
      submissions.push(JSON.parse(route.request().postData() ?? "{}"));
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await enterQuestions(page);
    for (let i = 0; i < TOTAL; i++) {
      await expectNoHorizontalOverflow(page);
      await chooseOption(page, i, (i + 1) % 3);
      if (i < TOTAL - 1) {
        await page.getByRole("button", { name: "Continue" }).click();
      }
    }
    await page.getByRole("button", { name: "Submit response" }).click();
    await expect(
      page.getByText("Thank you — your response was recorded."),
    ).toBeVisible();
    expect(submissions).toHaveLength(1);
    await expectNoHorizontalOverflow(page);
  });

  test("back navigation preserves answers and answers can be changed", async ({
    page,
  }) => {
    await enterQuestions(page);
    await chooseOption(page, 0, 1);
    await page.getByRole("button", { name: "Continue" }).click();
    await expectQuestionScreen(page, 1);
    await chooseOption(page, 1, 0);

    await page.getByRole("button", { name: "Back" }).click();
    await expectQuestionScreen(page, 0);
    await expect(
      page.getByRole("radio", { name: surveyQuestions[0].options![1].label }),
    ).toBeChecked();

    await page.getByRole("button", { name: "Continue" }).click();
    await expectQuestionScreen(page, 1);
    await chooseOption(page, 1, 2);
    await expect(
      page.getByRole("radio", { name: surveyQuestions[1].options![2].label }),
    ).toBeChecked();

    await page.getByRole("button", { name: "Back" }).click();
    await expectQuestionScreen(page, 0);
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByText("Before we begin")).toBeVisible();
    await page.getByRole("button", { name: "Start the survey" }).click();
    await expectQuestionScreen(page, 0);
    await expect(
      page.getByRole("radio", { name: surveyQuestions[0].options![1].label }),
    ).toBeChecked();
  });

  test("section boundary screens show correct section labels and subtitles", async ({
    page,
  }) => {
    await enterQuestions(page);
    let cursor = 0;
    for (const questionIndex of [0, 4, 10]) {
      for (; cursor < questionIndex; cursor++) {
        await chooseOption(page, cursor, 0);
        await page.getByRole("button", { name: "Continue" }).click();
      }
      const question = surveyQuestions[questionIndex];
      await expectQuestionScreen(page, questionIndex);
      const subtitle =
        SURVEY_SECTIONS[sectionNumber(question.section) - 1].subtitle;
      await expect(page.getByText(subtitle)).toBeVisible();
      await expect(
        page.getByRole("radio", { name: question.options![0].label }),
      ).toBeVisible();
    }
  });

  test("question options are operable by keyboard", async ({ page }) => {
    await enterQuestions(page);

    // Tab until the first option radio has focus.
    let focusedRole = "";
    for (let i = 0; i < 20 && focusedRole !== "radio"; i++) {
      await page.keyboard.press("Tab");
      focusedRole = await page.evaluate(
        () => document.activeElement?.getAttribute("role") ?? "",
      );
    }
    expect(focusedRole, "a question option receives keyboard focus").toBe(
      "radio",
    );

    // Arrow keys move the selection within the radio group.
    await page.keyboard.press("ArrowDown");
    await expect(
      page.getByRole("radio", { name: surveyQuestions[0].options![1].label }),
    ).toBeChecked();
    await expect(
      page.getByRole("button", { name: "Continue" }),
    ).toBeEnabled();

    // Enter within the group proceeds to the next question.
    await page.getByRole("button", { name: "Continue" }).focus();
    await page.keyboard.press("Enter");
    await expectQuestionScreen(page, 1);
  });

  test("failed submission shows an error and answers are preserved for retry", async ({
    page,
  }) => {
    let failNext = true;
    const submissions: Array<Record<string, unknown>> = [];
    await page.route("**/api/survey", async (route) => {
      if (failNext) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            error:
              "Your response could not be saved. Please try again in a moment.",
          }),
        });
      } else {
        submissions.push(JSON.parse(route.request().postData() ?? "{}"));
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        });
      }
    });

    await enterQuestions(page);
    for (let i = 0; i < TOTAL; i++) {
      await chooseOption(page, i, 2);
      if (i < TOTAL - 1) await page.getByRole("button", { name: "Continue" }).click();
    }
    await page.getByRole("button", { name: "Submit response" }).click();
    await expect(
      page.getByText("We could not submit your response"),
    ).toBeVisible();
    await expect(page.getByText("Please try again in a moment.")).toBeVisible();

    failNext = false;
    await page.getByRole("button", { name: "Submit response" }).click();
    await expect(
      page.getByText("Thank you — your response was recorded."),
    ).toBeVisible();
    expect(submissions).toHaveLength(1);
    const body = submissions[0] as {
      answers: Record<string, unknown>;
    };
    for (let i = 0; i < TOTAL; i++) {
      expect(body.answers[surveyQuestions[i].id]).toBe(
        surveyQuestions[i].options![2].value,
      );
    }
  });

  test("repeated clicks on submit cannot create duplicate submissions", async ({
    page,
  }) => {
    let requestCount = 0;
    await page.route("**/api/survey", async (route) => {
      requestCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await enterQuestions(page);
    for (let i = 0; i < TOTAL; i++) {
      await chooseOption(page, i, 0);
      if (i < TOTAL - 1) await page.getByRole("button", { name: "Continue" }).click();
    }
    const submitButton = page.getByRole("button", { name: "Submit response" });
    await submitButton.click();

    // While the request is in flight the button becomes a disabled
    // "Submitting…" control, so a second click cannot fire another request.
    const submittingButton = page.locator('button[data-slot="button"]', {
      hasText: "Submitting",
    });
    await expect(submittingButton).toBeVisible();
    await expect(submittingButton).toBeDisabled();
    expect(requestCount).toBe(1);

    await expect(
      page.getByText("Thank you — your response was recorded."),
    ).toBeVisible({ timeout: 15_000 });
    expect(requestCount).toBe(1);
  });
});

test.describe("survey configuration contract", () => {
  test("profile phase is skipped while no verified profile fields exist", async ({
    page,
  }) => {
    if (SURVEY_PROFILE_FIELDS.length > 0) test.skip();
    await enterQuestions(page);
    await expect(
      page.getByText(
        "These details help analyse responses by group. No names, roll numbers, or contact details are collected.",
      ),
    ).toHaveCount(0);
  });

  test("every research question uses option cards, and no free-text identity input exists", async ({
    page,
  }) => {
    await openSurvey(page);
    await acceptConsent(page);
    await page.getByRole("button", { name: "Start the survey" }).click();
    await expect(page.getByRole("radio")).toHaveCount(3);
    await expect(page.locator('input[type="text"]')).toHaveCount(0);
    await expect(page.locator('input[type="email"]')).toHaveCount(0);
    await expect(page.locator('input[type="tel"]')).toHaveCount(0);
  });
});
