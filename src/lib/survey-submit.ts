import type { SurveyAnswers } from "@/data/survey-questions";
import { SURVEY_SCHEMA_VERSION } from "@/data/survey-questions";

export type SurveySubmitError = Error & { status?: number };

/**
 * Posts validated answers to the server-side route handler, which performs the
 * authoritative validation and the Supabase insert. Success is only reported
 * after the server confirms the submission was recorded.
 */
export async function submitSurveyAnswers(
  answers: SurveyAnswers,
): Promise<void> {
  let response: Response;

  try {
    response = await fetch("/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, schemaVersion: SURVEY_SCHEMA_VERSION }),
    });
  } catch {
    throw new Error(
      "There was a network problem and your response was not saved. Please check your connection and try again.",
    ) as SurveySubmitError;
  }

  if (response.ok) return;

  let message = "Your response could not be saved. Please try again.";
  try {
    const data = (await response.json()) as { error?: unknown };
    if (typeof data?.error === "string" && data.error.length > 0) {
      message = data.error;
    }
  } catch {
    // Response had no usable JSON body; keep the generic message.
  }

  const error = new Error(message) as SurveySubmitError;
  error.status = response.status;
  throw error;
}
