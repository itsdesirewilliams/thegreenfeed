import { test, expect } from "@playwright/test";
import { SURVEY_SCHEMA_VERSION, surveyQuestions } from "../../src/data/survey-questions";

/**
 * Server-side validation and security tests for POST /api/survey.
 *
 * Every request here is rejected before the database insert, so no rows are
 * ever created. The e2e web server runs with SURVEY_DEV_PREVIEW=1; the
 * production "survey closed" guard (HTTP 503) is verified separately against a
 * production build.
 */

const ENDPOINT = "/api/survey";

function fullAnswers(overrides: Record<string, unknown> = {}) {
  const answers: Record<string, unknown> = { consent: true };
  for (const question of surveyQuestions) {
    answers[question.id] = question.options![0].value;
  }
  return { schemaVersion: SURVEY_SCHEMA_VERSION, answers: { ...answers, ...overrides } };
}

test.describe("survey API rejects invalid submissions (no rows written)", () => {
  test("valid endpoint rejects missing consent", async ({ request }) => {
    const payload = fullAnswers();
    delete (payload.answers as Record<string, unknown>).consent;
    const response = await request.post(ENDPOINT, { data: payload });
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toMatch(/consent/i);
  });

  test("rejects invalid consent values", async ({ request }) => {
    for (const value of ["yes", "true", 1, false]) {
      const response = await request.post(ENDPOINT, {
        data: fullAnswers({ consent: value }),
      });
      expect(response.status(), `consent=${JSON.stringify(value)}`).toBe(400);
      expect((await response.json()).error).toMatch(/consent/i);
    }
  });

  test("rejects missing question answers", async ({ request }) => {
    const payload = fullAnswers();
    const answers = payload.answers as Record<string, unknown>;
    for (const question of surveyQuestions.slice(1)) delete answers[question.id];
    const response = await request.post(ENDPOINT, { data: payload });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/required/i);
    expect(Object.keys(body.fields)).toContain("q2");
  });

  test("rejects unknown answer keys", async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: fullAnswers({ not_a_question: "a" }),
    });
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toMatch(/not recognised/i);
  });

  test("rejects invalid option values and wrong value types", async ({
    request,
  }) => {
    const invalidOption = await request.post(ENDPOINT, {
      data: fullAnswers({ q1: "z" }),
    });
    expect(invalidOption.status()).toBe(400);

    const wrongType = await request.post(ENDPOINT, {
      data: fullAnswers({ q1: 42 }),
    });
    expect(wrongType.status()).toBe(400);
  });

  test("rejects incorrect schema versions", async ({ request }) => {
    const payload = fullAnswers();
    payload.schemaVersion = "v1";
    const response = await request.post(ENDPOINT, { data: payload });
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toMatch(/changed/i);
  });

  test("rejects malformed JSON", async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      headers: { "content-type": "application/json" },
      data: "{ this is not json",
    });
    expect(response.status()).toBe(400);
  });

  test("rejects non-JSON content types", async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      headers: { "content-type": "text/plain" },
      data: JSON.stringify(fullAnswers()),
    });
    expect(response.status()).toBe(415);
  });

  test("rejects oversized request bodies", async ({ request }) => {
    const payload = fullAnswers({ q1: "a".repeat(25_000) });
    const response = await request.post(ENDPOINT, { data: payload });
    expect(response.status()).toBe(413);
  });

  test("rejects cross-origin submissions", async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      headers: { origin: "https://evil.example" },
      data: fullAnswers({ q1: "z" }),
    });
    expect(response.status()).toBe(403);
  });

  test("rejects non-POST methods", async ({ request }) => {
    const response = await request.get(ENDPOINT);
    expect(response.status()).toBe(405);
  });

  test("error responses never echo answers or credentials", async ({
    request,
  }) => {
    const response = await request.post(ENDPOINT, {
      data: fullAnswers({ q1: "z", consent: false }),
    });
    const raw = await response.text();
    expect(raw).not.toMatch(/SUPABASE_SECRET_KEY|service_role|eyJ/i);
    expect(raw.length).toBeLessThan(2_000);
  });
});
