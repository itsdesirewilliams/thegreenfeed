import rawFramework from "./analysis-framework.json";

/**
 * Typed access to the deterministic analysis codebook.
 *
 * The JSON is the existing "TheGreenFeed Deterministic Survey Analysis
 * Framework" for the **currently published instrument** (`q1`–`q16`, schema
 * `v2`/`v3`). It is the single source of truth for option interpretations,
 * section purposes, guardrails and the action library. The deterministic engine
 * in `src/lib/analysis.ts` evaluates it against real stored responses.
 *
 * Do not reword the question/option labels here — they are read from
 * `src/data/survey-questions.ts` at runtime so the codebook and the live
 * questionnaire cannot drift. This file only carries the *interpretations* and
 * *rules*, keyed by the stable `a`/`b`/`c` codes.
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

export const ANALYSIS_FRAMEWORK = rawFramework as unknown as AnalysisFramework;

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
