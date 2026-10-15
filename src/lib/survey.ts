import type {
  SurveyAnswers,
  SurveyAnswerValue,
  SurveyProfileField,
  SurveyQuestion,
} from "@/data/survey-questions";

export type SurveyFieldErrors = Record<string, string>;

/**
 * An answer is considered empty when it is missing, a blank string, or an
 * empty selection. Booleans are always valid answers (including `false`).
 */
export function isEmptyAnswer(value: SurveyAnswerValue | undefined): boolean {
  if (value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * Shared validation used by both the client experience and the server route.
 * Returns a map of question id → user-facing error message.
 */
export function validateSurveyAnswers(
  questions: SurveyQuestion[],
  answers: SurveyAnswers,
): SurveyFieldErrors {
  const errors: SurveyFieldErrors = {};

  for (const question of questions) {
    const value = answers[question.id];

    if (question.required && isEmptyAnswer(value)) {
      errors[question.id] = "This question is required.";
      continue;
    }

    const isText =
      question.type === "short-text" || question.type === "long-text";
    if (isText && typeof value === "string" && question.maxLength) {
      if (value.length > question.maxLength) {
        errors[question.id] = `Please use ${question.maxLength} characters or fewer.`;
      }
    }
  }

  return errors;
}

/**
 * Validates the respondent-profile fields. Optional-but-answered values are
 * still checked against the allowed option values / length limits so that
 * malformed data never reaches the database.
 */
export function validateSurveyProfile(
  fields: SurveyProfileField[],
  answers: SurveyAnswers,
): SurveyFieldErrors {
  const errors: SurveyFieldErrors = {};

  for (const field of fields) {
    const value = answers[field.id];

    if (field.required && isEmptyAnswer(value)) {
      errors[field.id] = "This field is required.";
      continue;
    }

    if (field.type === "select" && !isEmptyAnswer(value)) {
      if (
        typeof value !== "string" ||
        !field.options?.some((option) => option.value === value)
      ) {
        errors[field.id] = "Please choose one of the listed options.";
      }
      continue;
    }

    if (field.type === "short-text" && typeof value === "string") {
      if (field.maxLength && value.length > field.maxLength) {
        errors[field.id] = `Please use ${field.maxLength} characters or fewer.`;
      }
    }
  }

  return errors;
}

/** True when there is nothing left to validate. */
export function hasErrors(errors: SurveyFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** The human-readable label of a chosen option, for the completion summary. */
export function getChosenOptionLabel(
  question: SurveyQuestion,
  answers: SurveyAnswers,
): string | undefined {
  const value = answers[question.id];
  if (typeof value !== "string") return undefined;
  return question.options?.find((option) => option.value === value)?.label;
}
