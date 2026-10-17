/**
 * TheGreenFeed — campus waste-management survey (current instrument).
 *
 * This module is the facade the rest of the app imports. It exposes the
 * CURRENT published instrument (`v4`, the redesigned questionnaire) plus the
 * shared student-details / consent flow. Historical instruments live in
 * `src/data/survey/v3.ts` and are selected by `schema_version` at analysis time
 * so legacy rows stay interpretable.
 *
 * Option values are the canonical letters `a` / `b` / `c`… ; the human-readable
 * labels act as the codebook for later aggregate analysis. Treat responses as
 * categorical data; never sum them into a single score or claim causal effects
 * from self-reports.
 *
 * PAYLOAD CONTRACT / SCHEMA VERSION
 * - `v4` (current) is the redesigned instrument (`src/data/survey/v4.ts`).
 * - `v3` adds the student-details keys `profile_full_name`, `profile_programme`
 *   and `profile_phone` to `consent` + the 16 research answers.
 * - `v2` (legacy) is the same payload without a name or phone.
 * The server keeps accepting `v2`/`v3` during rollout so respondents who loaded
 * the previous page are not turned away, and records each row under the version
 * the client declared.
 */
import { V4_INSTRUMENT } from "./survey/v4";

export const SURVEY_SCHEMA_VERSION = "v4";

export const SURVEY_PUBLISHED = true;

export {
  CURRENT_SURVEY_VERSION,
  SURVEY_LEGACY_SCHEMA_VERSIONS,
  SURVEY_INSTRUMENT_VERSIONS,
  SURVEY_UNSUPPORTED_VERSIONS,
  SURVEY_UNSUPPORTED_VERSION_NOTE,
  isSupportedSurveyVersion,
  assertSupportedSurveyVersion,
  getInstrument,
  getInstrumentQuestions,
  getInstrumentSections,
  getQuestionForVersion,
} from "./survey/registry";

export {
  SURVEY_CONSENT_ID,
  SURVEY_CONSENT_STATEMENT,
  SURVEY_PHONE_PATTERN,
  SURVEY_PROFILE_FIELDS,
  getProfileFieldOptions,
  isValidSurveyPhone,
} from "./survey/profile";

export const SURVEY_SECTIONS = V4_INSTRUMENT.sections;
export const surveyQuestions = V4_INSTRUMENT.questions;

export type {
  SurveyQuestionType,
  SurveyOption,
  SurveyQuestion,
  SurveySection,
  SurveyProfileFieldType,
  SurveyProfileOptionGroup,
  SurveyProfileField,
  SurveyAnswerValue,
  SurveyAnswers,
  SurveyInstrument,
} from "./survey/types";

export function getSurveyQuestion(id: string) {
  return V4_INSTRUMENT.questions.find((question) => question.id === id);
}
