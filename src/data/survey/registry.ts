import { V3_INSTRUMENT } from "./v3";
import { V4_INSTRUMENT } from "./v4";
import type { SurveyInstrument, SurveyQuestion, SurveySection } from "./types";

/**
 * Version registry for the survey instruments.
 *
 * `schema_version` on a stored row names the instrument that produced it. `v2`
 * and `v3` share the same 16 questions (v2 predates the student-details
 * screen), so both resolve to the frozen `V3_INSTRUMENT`. `v4` resolves to the
 * redesigned instrument. New versions are added here, never by editing an old
 * one.
 *
 * Unknown versions are NEVER silently interpreted as the current instrument.
 * `getInstrumentQuestions` / `getInstrumentSections` throw for a version that
 * is not in `SURVEY_INSTRUMENT_VERSIONS`, so a mis-tagged row cannot be
 * analysed or rendered with the wrong questionnaire. Callers that must handle
 * stored rows with an unrecognised version check `isSupportedSurveyVersion` first.
 */

export const CURRENT_SURVEY_VERSION = "v4";

/** Payload versions still accepted during rollout (current version excluded). */
export const SURVEY_LEGACY_SCHEMA_VERSIONS = ["v3", "v2"] as const;

/** Every version this codebase can interpret, newest first. */
export const SURVEY_INSTRUMENT_VERSIONS = ["v4", "v3", "v2"] as const;

/**
 * Versions this codebase cannot interpret. `v1` was never a published
 * instrument — it is only the placeholder default of the `schema_version`
 * column in the original migration, and the first shipped instrument was
 * tagged `v2`. Any row tagged `v1` (or any other unrecognised tag) is treated
 * as unsupported/legacy and excluded from version-specific analysis and
 * exports rather than being reinterpreted as the current instrument.
 */
export const SURVEY_UNSUPPORTED_VERSIONS = ["v1"] as const;

export const SURVEY_UNSUPPORTED_VERSION_NOTE =
  "v1 was never a published instrument (it was only the database default before v2). Rows tagged v1, or with any unrecognised version, are treated as unsupported legacy data: they are stored and counted, but excluded from version-specific analysis and research exports.";

const SUPPORTED = new Set<string>(SURVEY_INSTRUMENT_VERSIONS);

/** True when `version` names an instrument this codebase can interpret. */
export function isSupportedSurveyVersion(version: string): boolean {
  return SUPPORTED.has(version);
}

/** Throws a descriptive error when `version` cannot be interpreted. */
export function assertSupportedSurveyVersion(version: string): void {
  if (!SUPPORTED.has(version)) {
    throw new Error(
      `Unsupported survey version "${version}". Known versions: ${SURVEY_INSTRUMENT_VERSIONS.join(
        ", ",
      )}.`,
    );
  }
}

const INSTRUMENTS: Record<string, SurveyInstrument> = {
  v2: V3_INSTRUMENT,
  v3: V3_INSTRUMENT,
  v4: V4_INSTRUMENT,
};

/** The instrument for a stored `schema_version`, or `undefined` if unknown. */
export function getInstrument(version: string): SurveyInstrument | undefined {
  return INSTRUMENTS[version];
}

/**
 * The questions for a supported version. Throws for an unknown version instead
 * of falling back to the current instrument, so a mis-tagged row can never be
 * silently validated or rendered against the wrong questionnaire.
 */
export function getInstrumentQuestions(version: string): SurveyQuestion[] {
  const instrument = INSTRUMENTS[version];
  if (!instrument) {
    throw new Error(
      `Unsupported survey version "${version}" — refusing to fall back to the current instrument.`,
    );
  }
  return instrument.questions;
}

export function getInstrumentSections(version: string): SurveySection[] {
  const instrument = INSTRUMENTS[version];
  if (!instrument) {
    throw new Error(
      `Unsupported survey version "${version}" — refusing to fall back to the current instrument.`,
    );
  }
  return instrument.sections;
}

/** The question for a version, or `undefined` for an unknown version or id. */
export function getQuestionForVersion(
  version: string,
  id: string,
): SurveyQuestion | undefined {
  return INSTRUMENTS[version]?.questions.find((question) => question.id === id);
}
