/**
 * Shared types for the versioned survey instruments.
 *
 * A single published instrument is described by a `SurveyInstrument`
 * (`version` + `sections` + `questions`). Historical instruments are frozen in
 * `v2.ts` / `v3.ts` / `v4.ts` and selected through `registry.ts`, so stored
 * rows can always be interpreted with the exact wording that produced them.
 *
 * Respondent-profile fields (name, programme, phone) and the consent statement
 * are identical across versions and live in `profile.ts`.
 */

export type SurveyQuestionType =
  | "short-text"
  | "long-text"
  | "single-choice"
  | "multiple-choice"
  | "yes-no";

export type SurveyOption = {
  value: string;
  label: string;
};

export type SurveyQuestion = {
  /** Stable identifier used as the answer key and for server-side validation. */
  id: string;
  type: SurveyQuestionType;
  label: string;
  description?: string;
  required: boolean;
  options?: SurveyOption[];
  /** Optional text constraints for short/long text answers. */
  maxLength?: number;
  /** Title of the survey section this question belongs to. */
  section: string;
};

export type SurveySection = {
  number: number;
  title: string;
  subtitle: string;
};

export type SurveyProfileFieldType = "select" | "short-text" | "tel";

/**
 * A labelled, non-selectable group of options inside a select field. Used for
 * display grouping only — validation and storage use the flattened options.
 */
export type SurveyProfileOptionGroup = {
  label: string;
  options: SurveyOption[];
};

export type SurveyProfileField = {
  /** Stable identifier used as the answer key. */
  id: string;
  label: string;
  description?: string;
  type: SurveyProfileFieldType;
  required: boolean;
  /**
   * When set, the server only treats the field as required for submissions at
   * this schema version or later. Lets legacy payloads stay valid during
   * rollout without weakening the current contract.
   */
  requiredFrom?: string;
  options?: SurveyOption[];
  /** Grouped display options for a select field (alternative to `options`). */
  groups?: SurveyProfileOptionGroup[];
  maxLength?: number;
  placeholder?: string;
};

/** A single answer value, keyed by question id in `SurveyAnswers`. */
export type SurveyAnswerValue = string | string[] | boolean;

export type SurveyAnswers = Record<string, SurveyAnswerValue>;

/** One immutable, versioned questionnaire. */
export type SurveyInstrument = {
  version: string;
  sections: SurveySection[];
  questions: SurveyQuestion[];
};
