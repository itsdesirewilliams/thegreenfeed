import rawV3 from "./analysis-framework.json";
import rawV4 from "./analysis-framework-v4.json";

/**
 * Typed access to the deterministic analysis codebooks.
 *
 * There is one codebook per instrument version. `v2`/`v3` rows use the original
 * "TheGreenFeed Deterministic Survey Analysis Framework"; `v4` rows use the
 * redesigned codebook (`analysis-framework-v4.json`). Rows are always analysed
 * with the codebook that matches their `schema_version` — never a mix.
 *
 * Do not reword question/option labels here — they are read from the versioned
 * instrument (`src/data/survey/*`) at runtime so the codebook and the live
 * questionnaire cannot drift. This file only carries the *interpretations* and
 * *rules*, keyed by the stable codes.
 */

export type DominanceKind =
  | "majority"
  | "plurality"
  | "closeSplit"
  | "tie";

export type AnalysisMethod = {
  type: string;
  displayCountsAndPercentages: boolean;
  reportValidNForEveryQuestion: boolean;
  dominance: {
    majority: string;
    plurality: string;
    closeSplit: string;
    tie: string;
    minimumNForInterpretiveLanguage: number;
    smallSampleWarning: string;
  };
  guardrails: string[];
};

export type AnalysisOptionRule = {
  label: string;
  interpretation: string;
};

export type AnalysisQuestion = {
  id: string;
  section: string;
  construct: string;
  options: Record<string, AnalysisOptionRule>;
  crossChecks: string[];
  analysisCaveat: string;
};

export type SectionPattern = {
  id: string;
  when: string;
  meaning: string;
  actions: string[];
};

export type AnalysisSection = {
  id: string;
  label: string;
  questions: string[];
  purpose: string;
  patterns: SectionPattern[];
  cautions: string[];
};

export type SynthesisDimension = {
  id: string;
  inputs: string[];
  meaning: string;
};

export type SynthesisRule = {
  id: string;
  when: string;
  summary: string;
  priority: string[];
};

export type ActionLibraryItem = {
  id: string;
  action: string;
  signals: string[];
  caveat?: string;
};

export type StudentDetailsPrivacy = {
  fields: string[];
  rules: string[];
};

export type AnalysisFramework = {
  schemaVersion: string;
  instrumentVersion?: string;
  title: string;
  purpose: string;
  method: AnalysisMethod;
  studentDetailsPrivacy: StudentDetailsPrivacy;
  questions: AnalysisQuestion[];
  sectionAnalysis: AnalysisSection[];
  overallSynthesis: {
    dimensions: SynthesisDimension[];
    synthesisRules: SynthesisRule[];
    reportSections: string[];
  };
  actionLibrary: {
    students: ActionLibraryItem[];
    college: ActionLibraryItem[];
    thegreenfeed: ActionLibraryItem[];
  };
  limitations: string[];
};

/** Codebook for the frozen v2/v3 instrument. */
export const ANALYSIS_FRAMEWORK_V3 = rawV3 as unknown as AnalysisFramework;

/** Codebook for the current v4 instrument. */
export const ANALYSIS_FRAMEWORK_V4 = rawV4 as unknown as AnalysisFramework;

/** The codebook for the current instrument (v4). */
export const ANALYSIS_FRAMEWORK = ANALYSIS_FRAMEWORK_V4;

const FRAMEWORKS: Record<string, AnalysisFramework> = {
  v2: ANALYSIS_FRAMEWORK_V3,
  v3: ANALYSIS_FRAMEWORK_V3,
  v4: ANALYSIS_FRAMEWORK_V4,
};

/**
 * The codebook for a stored `schema_version`. Throws for an unknown version
 * instead of falling back to the current (v4) codebook, so rows of unknown
 * provenance are never analysed with the wrong interpretations. Callers should
 * check `isSupportedSurveyVersion` before asking for a framework.
 */
export function getAnalysisFramework(version: string): AnalysisFramework {
  const framework = FRAMEWORKS[version];
  if (!framework) {
    throw new Error(
      `No analysis codebook for survey version "${version}" — refusing to fall back to the current codebook.`,
    );
  }
  return framework;
}

// Back-compat singletons (current instrument). Prefer `getAnalysisFramework`.
export const ANALYSIS_QUESTIONS = ANALYSIS_FRAMEWORK.questions;
export const ANALYSIS_SECTIONS = ANALYSIS_FRAMEWORK.sectionAnalysis;
export const ANALYSIS_METHOD = ANALYSIS_FRAMEWORK.method;
export const ANALYSIS_LIMITATIONS = ANALYSIS_FRAMEWORK.limitations;

export const ANALYSIS_QUESTION_IDS = ANALYSIS_QUESTIONS.map((q) => q.id);

const questionById = new Map(ANALYSIS_QUESTIONS.map((q) => [q.id, q]));

export function getAnalysisQuestion(
  id: string,
): AnalysisQuestion | undefined {
  return questionById.get(id);
}

export function getAnalysisSection(id: string): AnalysisSection | undefined {
  return ANALYSIS_SECTIONS.find((section) => section.id === id);
}
