import {
  CURRENT_SURVEY_VERSION,
  getInstrumentQuestions,
  isSupportedSurveyVersion,
  type SurveyQuestion,
} from "@/data/survey-questions";
import {
  getAnalysisFramework,
  type AnalysisFramework,
  type AnalysisQuestion,
  type DominanceKind,
} from "@/data/analysis-framework";

/**
 * Deterministic analysis engine (version-aware).
 *
 * Pure functions only: they take stored rows and return counts, dominance
 * classifications, cross-question patterns and cautious recommendations. No
 * network, no AI, no scoring. A/B/C… stay categorical; answers are never summed
 * into a single index.
 *
 * A stored row names the instrument that produced it (`schema_version`). Rows
 * are grouped by version and analysed with the matching instrument + codebook.
 * Versions are NEVER mixed in one distribution, and a version this codebase
 * cannot interpret is never reinterpreted as the current one: only supported
 * versions are eligible to be analysed, and unsupported tags (for example the
 * legacy `v1` placeholder, or a future tag) are reported as unsupported and
 * excluded.
 */

export type AnalysisRow = {
  id: string;
  created_at: string;
  schema_version: string;
  answers: Record<string, unknown>;
  /**
   * Provenance marker. Synthetic test rows are analysed alongside genuine rows
   * but remain distinguishable; `undefined` is treated as genuine so rows read
   * before the provenance columns existed are never miscounted.
   */
  is_synthetic?: boolean;
  /** Groups one synthetic import run; `null`/`undefined` for genuine rows. */
  synthetic_batch_id?: string | null;
};

/**
 * Dataset-level genuine/synthetic split. Counts over the rows handed to the
 * engine, independent of which instrument version is selected for analysis.
 */
export type ProvenanceSummary = {
  total: number;
  genuine: number;
  synthetic: number;
  includesSynthetic: boolean;
  syntheticSharePct: number;
  syntheticBatches: { batchId: string | null; count: number }[];
};

export function isSyntheticRow(row: AnalysisRow): boolean {
  return row.is_synthetic === true;
}

export function summariseProvenance(rows: AnalysisRow[]): ProvenanceSummary {
  const batches = new Map<string, number>();
  let synthetic = 0;

  for (const row of rows) {
    if (!isSyntheticRow(row)) continue;
    synthetic += 1;
    const key = row.synthetic_batch_id ?? "__unbatched__";
    batches.set(key, (batches.get(key) ?? 0) + 1);
  }

  const total = rows.length;
  return {
    total,
    genuine: total - synthetic,
    synthetic,
    includesSynthetic: synthetic > 0,
    syntheticSharePct: total ? (synthetic / total) * 100 : 0,
    syntheticBatches: [...batches.entries()]
      .map(([key, count]) => ({
        batchId: key === "__unbatched__" ? null : key,
        count,
      }))
      .sort((a, b) => b.count - a.count),
  };
}

export type OptionCount = {
  value: string;
  label: string;
  count: number;
  pct: number;
};

export type OptionInterpretation = OptionCount & { interpretation: string };

export type QuestionAggregate = {
  id: string;
  number: number;
  label: string;
  section: string;
  construct: string;
  total: number;
  validN: number;
  missingN: number;
  options: OptionCount[];
  interpretations: OptionInterpretation[];
  dominance: DominanceKind;
  leadingValues: string[];
  topPct: number;
  secondPct: number;
  summary: string;
  caveat: string;
  crossChecks: string[];
};

export type PatternEvidence = { label: string; detail: string };

export type PatternFinding = {
  id: string;
  label: string;
  section: string;
  triggered: boolean;
  rule: string;
  evidence: PatternEvidence[];
  meaning: string;
  caveat: string;
  actions: string[];
};

export type RecommendationAudience =
  | "Verify on campus"
  | "College administration"
  | "TheGreenFeed"
  | "Students";

export type Recommendation = {
  audience: RecommendationAudience;
  action: string;
  evidence: string[];
  caveat: string;
};

export type DataQuality = {
  totalResponses: number;
  /** Genuine submissions only (totalResponses minus syntheticResponses). */
  genuineResponses: number;
  /** Synthetic test rows included in this dataset. */
  syntheticResponses: number;
  /** True when at least one synthetic row is included. */
  includesSynthetic: boolean;
  /** Synthetic share of the whole dataset, as a percentage. */
  syntheticSharePct: number;
  /** Synthetic rows grouped by import batch. */
  syntheticBatches: { batchId: string | null; count: number }[];
  analysedResponses: number;
  /** The instrument version the figures below were computed from. */
  analysedVersion: string;
  /** Rows present but excluded because they used a different supported version. */
  excludedVersions: { version: string; count: number }[];
  /** All versions present, including unsupported ones. */
  versions: { version: string; count: number }[];
  /**
   * Rows whose `schema_version` this codebase cannot interpret (e.g. the legacy
   * `v1` placeholder). They are stored and counted but never analysed.
   */
  unsupportedVersions: { version: string; count: number }[];
  unsupportedWarning: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  minimumNForInterpretation: number;
  sampleWarning: string | null;
};

export type SectionSummary = {
  id: string;
  label: string;
  purpose: string;
  cautions: string[];
  questionIds: string[];
  leadingNotes: string[];
};

export type SynthesisFinding = {
  id: string;
  label: string;
  meaning: string;
  notes: string[];
  triggeredPatterns: string[];
};

export type SurveyAnalysis = {
  dataQuality: DataQuality;
  questions: QuestionAggregate[];
  sections: SectionSummary[];
  patterns: PatternFinding[];
  recommendations: Recommendation[];
  synthesis: SynthesisFinding[];
  synthesisSummary: string[];
  method: AnalysisFramework["method"];
  limitations: string[];
};

/** A share at or above this counts as a "common" answer for pattern rules. */
const COMMON_SHARE = 25;
const STRONG_SHARE = 40;
/** Both halves of a two-question gap must clear this to count as a gap. */
const GAP_SHARE = 50;

function roundPct(value: number): number {
  return Math.round(value);
}

function compareVersionDesc(a: string, b: string): number {
  return b.localeCompare(a, undefined, { numeric: true });
}

/** Label used when a stored row carries no usable `schema_version`. */
const UNKNOWN_VERSION = "unknown";

function rowVersion(row: AnalysisRow): string {
  const version = row.schema_version?.trim();
  return version && version.length > 0 ? version : UNKNOWN_VERSION;
}

type VersionSelection = {
  version: string;
  analysed: number;
  excluded: { version: string; count: number }[];
  all: { version: string; count: number }[];
  unsupported: { version: string; count: number }[];
};

/**
 * Chooses the version to analyse and accounts for the rest. Only SUPPORTED
 * versions are eligible: an explicit request that is unsupported is ignored, and
 * unsupported tags present in the data are never chosen. Preference order: an
 * explicit supported request, else the current version if any rows use it, else
 * the newest supported version present, else the current version (empty set).
 */
function selectAnalysedVersion(
  rows: AnalysisRow[],
  requested?: string,
): VersionSelection {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const version = rowVersion(row);
    counts.set(version, (counts.get(version) ?? 0) + 1);
  }

  const all = [...counts.entries()]
    .map(([version, count]) => ({ version, count }))
    .sort((a, b) => compareVersionDesc(a.version, b.version));

  const supportedPresent = all.filter((entry) =>
    isSupportedSurveyVersion(entry.version),
  );

  let version: string;
  if (requested && isSupportedSurveyVersion(requested)) {
    version = requested;
  } else if (supportedPresent.some((v) => v.version === CURRENT_SURVEY_VERSION)) {
    version = CURRENT_SURVEY_VERSION;
  } else if (supportedPresent.length > 0) {
    version = supportedPresent[0].version;
  } else {
    version = CURRENT_SURVEY_VERSION;
  }

  return {
    version,
    analysed: counts.get(version) ?? 0,
    excluded: all.filter((entry) => entry.version !== version),
    all,
    unsupported: all.filter(
      (entry) => !isSupportedSurveyVersion(entry.version),
    ),
  };
}

function isOptionValue(
  question: SurveyQuestion | undefined,
  value: unknown,
): value is string {
  return (
    !!question &&
    typeof value === "string" &&
    Boolean(question.options?.some((option) => option.value === value))
  );
}

export function classifyDominance(
  counts: { value: string; count: number }[],
  validN: number,
): {
  dominance: DominanceKind;
  leadingValues: string[];
  topPct: number;
  secondPct: number;
} {
  if (validN === 0) {
    return { dominance: "tie", leadingValues: [], topPct: 0, secondPct: 0 };
  }
  const sorted = [...counts].sort((a, b) => b.count - a.count);
  const top = sorted[0]?.count ?? 0;
  const second = sorted[1]?.count ?? 0;
  const leadingValues = sorted
    .filter((entry) => entry.count === top && top > 0)
    .map((entry) => entry.value);
  const topPct = (top / validN) * 100;
  const secondPct = (second / validN) * 100;

  if (leadingValues.length > 1) {
    return { dominance: "tie", leadingValues, topPct, secondPct };
  }
  if (topPct - secondPct < 10) {
    return { dominance: "closeSplit", leadingValues, topPct, secondPct };
  }
  return {
    dominance: topPct > 50 ? "majority" : "plurality",
    leadingValues,
    topPct,
    secondPct,
  };
}

function aggregateQuestion(
  surveyQuestion: SurveyQuestion,
  codebook: AnalysisQuestion,
  rows: AnalysisRow[],
  index: number,
): QuestionAggregate {
  const counts = new Map<string, number>();
  let validN = 0;
  let missingN = 0;

  for (const row of rows) {
    const value = row.answers?.[surveyQuestion.id];
    if (isOptionValue(surveyQuestion, value)) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
      validN += 1;
    } else {
      missingN += 1;
    }
  }

  const options: OptionCount[] = (surveyQuestion.options ?? []).map((option) => {
    const count = counts.get(option.value) ?? 0;
    return {
      value: option.value,
      label: option.label,
      count,
      pct: validN ? (count / validN) * 100 : 0,
    };
  });

  const interpretations: OptionInterpretation[] = options.map((option) => ({
    ...option,
    interpretation:
      codebook.options[option.value]?.interpretation ??
      "No interpretation is defined for this option.",
  }));

  const { dominance, leadingValues, topPct, secondPct } = classifyDominance(
    options,
    validN,
  );

  const summary = buildQuestionSummary({
    options,
    dominance,
    leadingValues,
    topPct,
    secondPct,
    validN,
    missingN,
  });

  return {
    id: surveyQuestion.id,
    number: index + 1,
    label: surveyQuestion.label,
    section: surveyQuestion.section,
    construct: codebook.construct,
    total: rows.length,
    validN,
    missingN,
    options,
    interpretations,
    dominance,
    leadingValues,
    topPct,
    secondPct,
    summary,
    caveat: codebook.analysisCaveat,
    crossChecks: codebook.crossChecks,
  };
}

function buildQuestionSummary(input: {
  options: OptionCount[];
  dominance: DominanceKind;
  leadingValues: string[];
  topPct: number;
  secondPct: number;
  validN: number;
  missingN: number;
}): string {
  const { options, dominance, leadingValues, topPct, secondPct, validN, missingN } =
    input;

  if (validN === 0) {
    return `No valid answers yet (${missingN} missing of ${validN + missingN}).`;
  }

  const labelFor = (value: string) =>
    options.find((option) => option.value === value)?.label ?? value;

  const denominator = `${validN} valid, ${missingN} missing`;

  if (dominance === "tie") {
    const labels = leadingValues.map(labelFor).join(" / ");
    return `Tie at ${roundPct(topPct)}% between "${labels}" (${denominator}).`;
  }

  const leader = leadingValues[0] ? labelFor(leadingValues[0]) : "";
  const second = [...options].sort((a, b) => b.count - a.count)[1];
  const secondText = second
    ? `, ahead of "${second.label}" ${roundPct(secondPct)}%`
    : "";

  const verdict =
    dominance === "majority"
      ? "a majority"
      : dominance === "plurality"
        ? "a plurality"
        : "a close/mixed split";

  return `"${leader}" leads at ${roundPct(topPct)}% — ${verdict}${secondText} (${denominator}).`;
}

type PatternResult = {
  triggered: boolean;
  evidence: PatternEvidence[];
};

/**
 * Per-version evaluator context: the instrument's questions plus the shared
 * combinatorics helpers bound to that instrument (so a v3 option code is never
 * validated against a v4 option set).
 */
type EvalContext = {
  questionById: Map<string, SurveyQuestion>;
  value: (answers: Record<string, unknown>, id: string) => string | undefined;
  share: (
    rows: AnalysisRow[],
    predicate: (answers: Record<string, unknown>) => boolean,
    referenced: string[],
  ) => { denom: number; matched: number; pct: number };
  marginal: (
    rows: AnalysisRow[],
    id: string,
    allowed: string[],
  ) => { denom: number; matched: number; pct: number };
  joint: (
    rows: AnalysisRow[],
    predicate: (answers: Record<string, unknown>) => boolean,
    referenced: string[],
  ) => { denom: number; matched: number; pct: number };
  evidence: (
    label: string,
    s: { denom: number; matched: number; pct: number },
  ) => PatternEvidence;
};

function makeEvalContext(questions: SurveyQuestion[]): EvalContext {
  const questionById = new Map(questions.map((q) => [q.id, q]));

  const value = (
    answers: Record<string, unknown>,
    id: string,
  ): string | undefined => {
    const raw = answers?.[id];
    return typeof raw === "string" ? raw : undefined;
  };

  /** Share of rows, among those that answered every referenced question. */
  const share = (
    rows: AnalysisRow[],
    predicate: (answers: Record<string, unknown>) => boolean,
    referenced: string[],
  ): { denom: number; matched: number; pct: number } => {
    let denom = 0;
    let matched = 0;
    for (const row of rows) {
      const answered = referenced.every((id) =>
        isOptionValue(questionById.get(id), row.answers?.[id]),
      );
      if (!answered) continue;
      denom += 1;
      if (predicate(row.answers)) matched += 1;
    }
    return { denom, matched, pct: denom ? (matched / denom) * 100 : 0 };
  };

  const marginal = (rows: AnalysisRow[], id: string, allowed: string[]) =>
    share(rows, (answers) => allowed.includes(value(answers, id) ?? ""), [id]);

  const evidence = (
    label: string,
    s: { denom: number; matched: number; pct: number },
  ): PatternEvidence => ({
    label,
    detail: `${s.matched}/${s.denom} (${roundPct(s.pct)}%)`,
  });

  return {
    questionById,
    value,
    share,
    marginal,
    joint: share,
    evidence,
  };
}

/* -------------------------------------------------------------------------- */
/* v2/v3 pattern evaluator (original 16-question instrument)                  */
/* -------------------------------------------------------------------------- */

function evaluateV3Patterns(
  rows: AnalysisRow[],
  ctx: EvalContext,
): Record<string, PatternResult> {
  const results: Record<string, PatternResult> = {};

  const q1c = ctx.marginal(rows, "q1", ["c"]);
  results.high_reported_visibility = {
    triggered: q1c.pct >= COMMON_SHARE,
    evidence: [ctx.evidence("Q1 often/very often notices improper disposal", q1c)],
  };

  const q3a = ctx.marginal(rows, "q3", ["a"]);
  const q11a = ctx.marginal(rows, "q11", ["a"]);
  const convenienceJoint = ctx.joint(
    rows,
    (a) => ctx.value(a, "q3") === "a" && ctx.value(a, "q11") === "a",
    ["q3", "q11"],
  );
  results.convenience_barrier = {
    triggered: q3a.pct >= COMMON_SHARE && q11a.pct >= COMMON_SHARE,
    evidence: [
      ctx.evidence("Q3 nearest-bin inconvenience", q3a),
      ctx.evidence("Q11 infrastructure named as biggest obstacle", q11a),
      ctx.evidence("Both answered the same way (joint)", convenienceJoint),
    ],
  };

  const q4c = ctx.marginal(rows, "q4", ["c"]);
  const q4ab = ctx.marginal(rows, "q4", ["a", "b"]);
  results.peer_non_intervention = {
    triggered: q4ab.matched > q4c.matched,
    evidence: [
      ctx.evidence("Q4 ignore / stay silent", q4ab),
      ctx.evidence("Q4 would speak up", q4c),
    ],
  };

  const q5c = ctx.marginal(rows, "q5", ["c"]);
  const q7a = ctx.marginal(rows, "q7", ["a"]);
  const awarenessGapJoint = ctx.joint(
    rows,
    (a) => ctx.value(a, "q5") === "c" || ctx.value(a, "q7") === "a",
    ["q5", "q7"],
  );
  results.awareness_or_visibility_gap = {
    triggered: q5c.pct >= COMMON_SHARE || q7a.pct >= COMMON_SHARE,
    evidence: [
      ctx.evidence("Q5 unaware of either fine", q5c),
      ctx.evidence("Q7 rarely/never notice messages", q7a),
      ctx.evidence("Either answer (joint)", awarenessGapJoint),
    ],
  };

  const q7b = ctx.marginal(rows, "q7", ["b"]);
  const q8b = ctx.marginal(rows, "q8", ["b"]);
  const seenNotRememberedJoint = ctx.joint(
    rows,
    (a) => ctx.value(a, "q7") === "b" || ctx.value(a, "q8") === "b",
    ["q7", "q8"],
  );
  results.seen_not_remembered = {
    triggered: q7b.pct >= COMMON_SHARE || q8b.pct >= COMMON_SHARE,
    evidence: [
      ctx.evidence("Q7 see posters but rarely remember", q7b),
      ctx.evidence("Q8 saw event but not the message", q8b),
      ctx.evidence("Either answer (joint)", seenNotRememberedJoint),
    ],
  };

  const q9ab = ctx.marginal(rows, "q9", ["a", "b"]);
  const q10ab = ctx.marginal(rows, "q10", ["a", "b"]);
  const guidanceJoint = ctx.joint(
    rows,
    (a) =>
      ["a", "b"].includes(ctx.value(a, "q9") ?? "") &&
      ["a", "b"].includes(ctx.value(a, "q10") ?? ""),
    ["q9", "q10"],
  );
  results.practical_guidance_gap = {
    triggered: q9ab.pct >= GAP_SHARE && q10ab.pct >= GAP_SHARE,
    evidence: [
      ctx.evidence("Q9 little/partial practical guidance", q9ab),
      ctx.evidence("Q10 not fully confident separating", q10ab),
      ctx.evidence("Both answers (joint)", guidanceJoint),
    ],
  };

  const q5a = ctx.marginal(rows, "q5", ["a"]);
  const q6b = ctx.marginal(rows, "q6", ["b"]);
  const awarenessNoInfluenceJoint = ctx.joint(
    rows,
    (a) => ctx.value(a, "q5") === "a" && ctx.value(a, "q6") === "b",
    ["q5", "q6"],
  );
  results.awareness_without_reported_influence = {
    triggered: q5a.pct >= COMMON_SHARE && q6b.pct >= COMMON_SHARE,
    evidence: [
      ctx.evidence("Q5 knew about both fines", q5a),
      ctx.evidence("Q6 fines have little/no influence", q6b),
      ctx.evidence("Both answered the same way (joint)", awarenessNoInfluenceJoint),
    ],
  };

  const infrastructureJoint = ctx.joint(
    rows,
    (a) =>
      ctx.value(a, "q11") === "a" ||
      ctx.value(a, "q12") === "a" ||
      ctx.value(a, "q15") === "a",
    ["q11", "q12", "q15"],
  );
  results.infrastructure_first = {
    triggered: infrastructureJoint.pct >= STRONG_SHARE,
    evidence: [
      ctx.evidence("Q11/Q12/Q15 pick bins, access or labels", infrastructureJoint),
    ],
  };

  const educationJoint = ctx.joint(
    rows,
    (a) => ctx.value(a, "q11") === "b" && ctx.value(a, "q12") === "b",
    ["q11", "q12"],
  );
  results.education_first = {
    triggered:
      educationJoint.pct >= 20 &&
      (q9ab.pct >= GAP_SHARE || q10ab.pct >= GAP_SHARE),
    evidence: [
      ctx.evidence("Q11 and Q12 both favour guidance (joint)", educationJoint),
      ctx.evidence("Q9 practical guidance gap", q9ab),
      ctx.evidence("Q10 confidence gap", q10ab),
    ],
  };

  const participationJoint = ctx.joint(
    rows,
    (a) =>
      (ctx.value(a, "q12") === "c" || ctx.value(a, "q15") === "c") &&
      ["b", "c"].includes(ctx.value(a, "q16") ?? ""),
    ["q12", "q15", "q16"],
  );
  results.student_led_opportunity = {
    triggered: participationJoint.pct >= 20,
    evidence: [
      ctx.evidence(
        "Q12/Q15 peer-habit and Q16 might/very likely (joint)",
        participationJoint,
      ),
    ],
  };

  return results;
}

/* -------------------------------------------------------------------------- */
/* v4 pattern evaluator (redesigned instrument)                               */
/* -------------------------------------------------------------------------- */

function evaluateV4Patterns(
  rows: AnalysisRow[],
  ctx: EvalContext,
): Record<string, PatternResult> {
  const results: Record<string, PatternResult> = {};

  const q1de = ctx.marginal(rows, "q1", ["d", "e"]);
  results.high_reported_visibility = {
    triggered: q1de.pct >= COMMON_SHARE,
    evidence: [ctx.evidence("Q1 often/very often notices improper disposal", q1de)],
  };

  const q3ab = ctx.marginal(rows, "q3", ["a", "b"]);
  results.bin_access_barrier = {
    triggered: q3ab.pct >= COMMON_SHARE,
    evidence: [
      ctx.evidence("Q3 bin never/rarely available and easy to reach", q3ab),
    ],
  };

  const q4de = ctx.marginal(rows, "q4", ["d", "e"]);
  results.bin_capacity_barrier = {
    triggered: q4de.pct >= COMMON_SHARE,
    evidence: [
      ctx.evidence("Q4 bins often/always full or not emptied often enough", q4de),
    ],
  };

  const q5cd = ctx.marginal(rows, "q5", ["c", "d"]);
  results.label_unclear = {
    triggered: q5cd.pct >= COMMON_SHARE,
    evidence: [ctx.evidence("Q5 labels not clear or absent", q5cd)],
  };

  const q7a = ctx.marginal(rows, "q7", ["a"]);
  const convenienceJoint = ctx.joint(
    rows,
    (a) =>
      ctx.value(a, "q7") === "a" &&
      (["a", "b"].includes(ctx.value(a, "q3") ?? "") ||
        ["d", "e"].includes(ctx.value(a, "q4") ?? "")),
    ["q3", "q4", "q7"],
  );
  results.convenience_barrier = {
    triggered:
      q7a.pct >= COMMON_SHARE && (q3ab.pct >= COMMON_SHARE || q4de.pct >= COMMON_SHARE),
    evidence: [
      ctx.evidence("Q7 would leave waste near the nearest bin", q7a),
      ctx.evidence("Q3 access barrier", q3ab),
      ctx.evidence("Q4 capacity barrier", q4de),
      ctx.evidence("Leave-near-bin and a bin barrier (joint)", convenienceJoint),
    ],
  };

  const q6c = ctx.marginal(rows, "q6", ["c"]);
  const q8ab = ctx.marginal(rows, "q8", ["a", "b"]);
  const normGapJoint = ctx.joint(
    rows,
    (a) =>
      ctx.value(a, "q6") === "c" &&
      ["a", "b"].includes(ctx.value(a, "q8") ?? ""),
    ["q6", "q8"],
  );
  results.disapproval_norm_gap = {
    triggered: q6c.pct >= COMMON_SHARE && q8ab.pct >= COMMON_SHARE,
    evidence: [
      ctx.evidence("Q6 dislikes littering and thinks it should be addressed", q6c),
      ctx.evidence("Q8 believes few classmates dispose properly", q8ab),
      ctx.evidence("Both answered the same way (joint)", normGapJoint),
    ],
  };

  const q9ab = ctx.marginal(rows, "q9", ["a", "b"]);
  const q9de = ctx.marginal(rows, "q9", ["d", "e"]);
  results.intervention_gap = {
    triggered: q9ab.pct > q9de.pct,
    evidence: [
      ctx.evidence("Q9 unlikely to intervene", q9ab),
      ctx.evidence("Q9 likely to intervene", q9de),
    ],
  };

  const q10c = ctx.marginal(rows, "q10", ["c"]);
  results.awareness_gap = {
    triggered: q10c.pct >= COMMON_SHARE,
    evidence: [ctx.evidence("Q10 unaware of either fine", q10c)],
  };

  const q11ab = ctx.marginal(rows, "q11", ["a", "b"]);
  results.funnel_recall_gap = {
    triggered: q11ab.pct >= COMMON_SHARE,
    evidence: [
      ctx.evidence("Q11 noticed nothing or cannot recall the message", q11ab),
    ],
  };

  const q12ab = ctx.marginal(rows, "q12", ["a", "b"]);
  const q13ab = ctx.marginal(rows, "q13", ["a", "b"]);
  const guidanceJoint = ctx.joint(
    rows,
    (a) =>
      ["a", "b"].includes(ctx.value(a, "q12") ?? "") &&
      ["a", "b"].includes(ctx.value(a, "q13") ?? ""),
    ["q12", "q13"],
  );
  results.guidance_gap = {
    triggered: q12ab.pct >= GAP_SHARE && q13ab.pct >= GAP_SHARE,
    evidence: [
      ctx.evidence("Q12 little/partial practical guidance", q12ab),
      ctx.evidence("Q13 not fully confident separating", q13ab),
      ctx.evidence("Both answers (joint)", guidanceJoint),
    ],
  };

  const q15a = ctx.marginal(rows, "q15", ["a"]);
  const q16a = ctx.marginal(rows, "q16", ["a"]);
  results.infrastructure_first = {
    triggered: q15a.pct >= COMMON_SHARE || q16a.pct >= COMMON_SHARE,
    evidence: [
      ctx.evidence("Q15 names bins as the biggest obstacle", q15a),
      ctx.evidence("Q16 prefers better bins, placement and labels", q16a),
    ],
  };

  const q15b = ctx.marginal(rows, "q15", ["b"]);
  const q16b = ctx.marginal(rows, "q16", ["b"]);
  results.education_first = {
    triggered:
      (q15b.pct >= COMMON_SHARE || q16b.pct >= COMMON_SHARE) &&
      (q12ab.pct >= GAP_SHARE || q13ab.pct >= GAP_SHARE),
    evidence: [
      ctx.evidence("Q15 names awareness/guidance", q15b),
      ctx.evidence("Q16 prefers clear practical guidance", q16b),
      ctx.evidence("Q12 guidance gap", q12ab),
      ctx.evidence("Q13 confidence gap", q13ab),
    ],
  };

  const q15c = ctx.marginal(rows, "q15", ["c"]);
  const q16c = ctx.marginal(rows, "q16", ["c"]);
  results.norms_first = {
    triggered: q15c.pct >= COMMON_SHARE || q16c.pct >= COMMON_SHARE,
    evidence: [
      ctx.evidence("Q15 names poor habits / social norms", q15c),
      ctx.evidence("Q16 prefers visible peer-led habits", q16c),
    ],
  };

  const q16d = ctx.marginal(rows, "q16", ["d"]);
  results.enforcement_preference = {
    triggered: q16d.pct >= COMMON_SHARE,
    evidence: [ctx.evidence("Q16 prefers stricter enforcement", q16d)],
  };

  const q19cd = ctx.marginal(rows, "q19", ["c", "d"]);
  const participationJoint = ctx.joint(
    rows,
    (a) => ["c", "d"].includes(ctx.value(a, "q19") ?? ""),
    ["q19"],
  );
  results.student_led_opportunity = {
    triggered: q16c.pct >= COMMON_SHARE || q19cd.pct >= 20,
    evidence: [
      ctx.evidence("Q16 prefers visible peer-led habits", q16c),
      ctx.evidence("Q19 would join or help run an activity", q19cd),
      ctx.evidence("Q19 concrete participation (joint)", participationJoint),
    ],
  };

  return results;
}

const V3_PATTERN_LABELS: Record<string, string> = {
  high_reported_visibility: "Frequently reported visibility of improper disposal",
  convenience_barrier: "Convenience / infrastructure barrier",
  peer_non_intervention: "More non-intervention than speaking up",
  awareness_or_visibility_gap: "Awareness or visibility gap",
  seen_not_remembered: "Seen but not remembered",
  practical_guidance_gap: "Practical guidance / sorting-confidence gap",
  awareness_without_reported_influence: "Aware but reports little influence",
  infrastructure_first: "Respondents prioritise bins, access or labels",
  education_first: "Respondents prioritise practical guidance",
  student_led_opportunity: "Opening for a voluntary student-led pilot",
  channel_message_match: "Preferred channel and message both have a clear leader",
};

const V4_PATTERN_LABELS: Record<string, string> = {
  high_reported_visibility: "Frequently reported visibility of improper disposal",
  bin_access_barrier: "Reported bin access barrier",
  bin_capacity_barrier: "Reported bin overflow / collection gap",
  label_unclear: "Reported unclear or absent bin labels",
  convenience_barrier: "Convenience / infrastructure barrier",
  disapproval_norm_gap: "Disapproval alongside a low perceived peer norm",
  intervention_gap: "More likely to stay silent than to intervene",
  awareness_gap: "Awareness gap for campus fines",
  funnel_recall_gap: "Messages not noticed, or noticed without recall",
  guidance_gap: "Practical guidance / sorting-confidence gap",
  infrastructure_first: "Respondents prioritise bins, placement and labels",
  education_first: "Respondents prioritise practical guidance",
  norms_first: "Respondents prioritise norms and peer-led habits",
  enforcement_preference: "Respondents prefer stricter enforcement",
  channel_message_match: "Preferred channel and message both have a clear leader",
  student_led_opportunity: "Opening for a voluntary student-led pilot",
};

function makePattern(
  codebook: { id: string; when: string; meaning: string; actions: string[] },
  section: string,
  label: string,
  result: PatternResult,
): PatternFinding {
  return {
    id: codebook.id,
    label,
    section,
    triggered: result.triggered,
    rule: codebook.when,
    evidence: result.evidence,
    meaning: codebook.meaning,
    caveat:
      "This is a deterministic pattern over reported answers, not observed behaviour or proof of cause. Check the underlying counts and joint denominators before acting.",
    actions: codebook.actions,
  };
}

function buildPatterns(
  rows: AnalysisRow[],
  questions: QuestionAggregate[],
  framework: AnalysisFramework,
  version: string,
  ctx: EvalContext,
): PatternFinding[] {
  const isV4 = version === "v4";
  const results = isV4
    ? evaluateV4Patterns(rows, ctx)
    : evaluateV3Patterns(rows, ctx);
  const labels = isV4 ? V4_PATTERN_LABELS : V3_PATTERN_LABELS;

  const channelClear = (id: string) => {
    const q = questions.find((entry) => entry.id === id);
    return (
      !!q &&
      q.dominance !== "tie" &&
      q.dominance !== "closeSplit" &&
      q.leadingValues.length === 1
    );
  };
  const channelEvidence = (id: string): PatternEvidence => {
    const q = questions.find((entry) => entry.id === id);
    const count =
      q?.options.find((o) => o.value === q.leadingValues[0])?.count ?? 0;
    return {
      label: `${id.toUpperCase()} preferred leader`,
      detail: `${count}/${q?.validN ?? 0} (${roundPct(q?.topPct ?? 0)}%)`,
    };
  };

  const channelIds = isV4 ? ["q17", "q18"] : ["q13", "q14"];
  results.channel_message_match = {
    triggered: channelIds.every(channelClear),
    evidence: channelIds.map(channelEvidence),
  };

  const findings: PatternFinding[] = [];
  for (const section of framework.sectionAnalysis) {
    for (const pattern of section.patterns) {
      const result = results[pattern.id];
      if (!result) continue;
      findings.push(
        makePattern(
          pattern,
          section.id,
          labels[pattern.id] ?? pattern.id,
          result,
        ),
      );
    }
  }
  return findings;
}

function buildRecommendations(
  patterns: PatternFinding[],
  questions: QuestionAggregate[],
  version: string,
): Recommendation[] {
  const isOn = (id: string) =>
    patterns.find((pattern) => pattern.id === id)?.triggered ?? false;
  const evidenceFor = (id: string) =>
    patterns
      .find((pattern) => pattern.id === id)
      ?.evidence.map((entry) => `${entry.label}: ${entry.detail}`) ?? [];

  const recommendations: Recommendation[] = [];

  if (version === "v4") {
    if (
      isOn("bin_access_barrier") ||
      isOn("bin_capacity_barrier") ||
      isOn("label_unclear") ||
      isOn("convenience_barrier") ||
      isOn("infrastructure_first")
    ) {
      recommendations.push({
        audience: "Verify on campus",
        action:
          "Walk the perceived hotspots at busy and quiet times and record bin presence, access, capacity, overflow, labels and collection times before spending on changes.",
        evidence: [
          ...evidenceFor("bin_access_barrier"),
          ...evidenceFor("bin_capacity_barrier"),
          ...evidenceFor("label_unclear"),
          ...evidenceFor("convenience_barrier"),
          ...evidenceFor("infrastructure_first"),
        ],
        caveat:
          "Student reports identify perceived conditions, not an objective audit of bin condition or waste volumes.",
      });
    }

    if (isOn("guidance_gap") || isOn("education_first")) {
      recommendations.push({
        audience: "College administration",
        action:
          "Provide short, item-specific sorting guidance that matches PCTE's actual collection and disposal arrangements.",
        evidence: [...evidenceFor("guidance_gap"), ...evidenceFor("education_first")],
        caveat:
          "Confirm the campus's real waste streams before publishing any 'correct bin' guidance.",
      });
    }

    if (isOn("awareness_gap") || isOn("funnel_recall_gap")) {
      recommendations.push({
        audience: "College administration",
        action:
          "Check that current waste rules are accurate, clearly worded and easy to find, and improve message placement and recall before producing more posters.",
        evidence: [...evidenceFor("awareness_gap"), ...evidenceFor("funnel_recall_gap")],
        caveat:
          "Awareness and recall do not show enforcement works, and this survey does not prove effect on behaviour.",
      });
    }

    if (isOn("enforcement_preference")) {
      recommendations.push({
        audience: "College administration",
        action:
          "Verify the actual rules, penalties and how they are applied before leaning on enforcement; keep convenient disposal alongside any enforcement message.",
        evidence: evidenceFor("enforcement_preference"),
        caveat:
          "Preference for enforcement is a stated view, not evidence that enforcement changes behaviour.",
      });
    }

    if (isOn("channel_message_match")) {
      const q17 = questions.find((q) => q.id === "q17");
      const q18 = questions.find((q) => q.id === "q18");
      recommendations.push({
        audience: "TheGreenFeed",
        action:
          "Pilot one clear message through the leading preferred channel and measure recall afterwards (not just the number of posts or posters).",
        evidence: [
          `Q17 leader: ${q17?.summary ?? "n/a"}`,
          `Q18 leader: ${q18?.summary ?? "n/a"}`,
        ],
        caveat:
          "Preference and recall are not evidence of behaviour change; treat the combination as a hypothesis to test.",
      });
    }

    if (isOn("student_led_opportunity") || isOn("norms_first")) {
      recommendations.push({
        audience: "TheGreenFeed",
        action:
          "Run a small, voluntary student-led activity with a specific low-effort ask and track actual sign-ups, attendance and feedback.",
        evidence: [
          ...evidenceFor("student_led_opportunity"),
          ...evidenceFor("norms_first"),
        ],
        caveat:
          "Stated willingness is not actual participation; confirm interest with sign-ups.",
      });
    }

    if (isOn("intervention_gap") || isOn("disapproval_norm_gap")) {
      recommendations.push({
        audience: "Students",
        action:
          "Offer respectful, non-confrontational ways to prompt peers (or join a voluntary activity) rather than public shaming.",
        evidence: [
          ...evidenceFor("intervention_gap"),
          ...evidenceFor("disapproval_norm_gap"),
        ],
        caveat:
          "The survey does not ask why students stay silent, so reasons cannot be assumed.",
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        audience: "Verify on campus",
        action:
          "No single pattern has enough support yet. Report the split, observe the leading locations directly, and test one small low-cost change at a time.",
        evidence: [
          "No cross-question pattern crossed its threshold with the current responses.",
        ],
        caveat:
          "Small samples can hide real patterns; revisit once more responses are collected.",
      });
    }

    return recommendations;
  }

  // v2 / v3 recommendations (original instrument)
  if (isOn("infrastructure_first") || isOn("convenience_barrier")) {
    recommendations.push({
      audience: "Verify on campus",
      action:
        "Walk the perceived hotspots at busy and quiet times and record bin presence, visibility, capacity, overflow, labels and collection times before spending on changes.",
      evidence: [
        ...evidenceFor("convenience_barrier"),
        ...evidenceFor("infrastructure_first"),
      ],
      caveat:
        "Student reports identify perceived conditions, not an objective audit of bin condition or waste volumes.",
    });
  }

  if (isOn("practical_guidance_gap")) {
    recommendations.push({
      audience: "College administration",
      action:
        "Provide short, item-specific sorting guidance (bottle, clean cardboard, food) that matches PCTE's actual collection and disposal arrangements.",
      evidence: evidenceFor("practical_guidance_gap"),
      caveat:
        "Confirm the campus's real waste streams before publishing any 'correct bin' guidance.",
    });
  }

  if (
    isOn("awareness_or_visibility_gap") ||
    isOn("awareness_without_reported_influence")
  ) {
    recommendations.push({
      audience: "College administration",
      action:
        "Check that current waste rules and penalties are accurate, clearly worded and easy to find; pair rule communication with convenient disposal.",
      evidence: [
        ...evidenceFor("awareness_or_visibility_gap"),
        ...evidenceFor("awareness_without_reported_influence"),
      ],
      caveat:
        "Awareness of a rule does not show enforcement works, and this survey does not prove effect on behaviour.",
    });
  }

  if (isOn("channel_message_match")) {
    const q13 = questions.find((q) => q.id === "q13");
    const q14 = questions.find((q) => q.id === "q14");
    recommendations.push({
      audience: "TheGreenFeed",
      action:
        "Pilot one clear message through the leading preferred channel and measure recall afterwards (not just the number of posts or posters).",
      evidence: [
        `Q13 leader: ${q13?.summary ?? "n/a"}`,
        `Q14 leader: ${q14?.summary ?? "n/a"}`,
      ],
      caveat:
        "Preference and recall are not evidence of behaviour change; treat the combination as a hypothesis to test.",
    });
  }

  if (isOn("student_led_opportunity")) {
    recommendations.push({
      audience: "TheGreenFeed",
      action:
        "Run a small, voluntary student-led activity and track actual sign-ups, attendance and feedback.",
      evidence: evidenceFor("student_led_opportunity"),
      caveat:
        "Stated willingness is not actual participation; confirm interest with sign-ups.",
    });
  }

  if (isOn("peer_non_intervention")) {
    recommendations.push({
      audience: "Students",
      action:
        "Offer respectful, non-confrontational ways to prompt peers (or join a voluntary activity) rather than public shaming.",
      evidence: evidenceFor("peer_non_intervention"),
      caveat:
        "The survey does not ask why students stay silent, so reasons cannot be assumed.",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      audience: "Verify on campus",
      action:
        "No single pattern has enough support yet. Report the split, observe the leading locations directly, and test one small low-cost change at a time.",
      evidence: [
        "No cross-question pattern crossed its threshold with the current responses.",
      ],
      caveat:
        "Small samples can hide real patterns; revisit once more responses are collected.",
    });
  }

  return recommendations;
}

function buildSynthesis(
  patterns: PatternFinding[],
  questions: QuestionAggregate[],
  framework: AnalysisFramework,
): SynthesisFinding[] {
  const find = (id: string) => questions.find((q) => q.id === id);

  const notes = (ids: string[]): string[] =>
    ids.map((id) => find(id)?.summary ?? "").filter(Boolean);

  return framework.overallSynthesis.dimensions.map((dimension) => ({
    id: dimension.id,
    label: dimension.meaning,
    meaning: dimension.meaning,
    notes: notes(dimension.inputs),
    triggeredPatterns: patterns
      .filter((pattern) => pattern.triggered)
      .map((pattern) => pattern.label),
  }));
}

function buildSynthesisSummary(
  patterns: PatternFinding[],
  framework: AnalysisFramework,
  version: string,
): string[] {
  const isOn = (id: string) =>
    patterns.find((pattern) => pattern.id === id)?.triggered ?? false;
  const anyOn = patterns.some((pattern) => pattern.triggered);
  const summary: string[] = [];

  const ruleHolds: Record<string, boolean> =
    version === "v4"
      ? {
          combined_infrastructure_guidance:
            (isOn("infrastructure_first") ||
              isOn("bin_access_barrier") ||
              isOn("bin_capacity_barrier") ||
              isOn("convenience_barrier")) &&
            isOn("guidance_gap"),
          communication_reach: isOn("funnel_recall_gap") || isOn("awareness_gap"),
          student_led_pilot: isOn("student_led_opportunity"),
          mixed_signal: !anyOn,
        }
      : {
          combined_infrastructure_guidance:
            isOn("infrastructure_first") && isOn("practical_guidance_gap"),
          communication_reach:
            isOn("awareness_or_visibility_gap") || isOn("seen_not_remembered"),
          student_led_pilot: isOn("student_led_opportunity"),
          mixed_signal: !anyOn,
        };

  for (const rule of framework.overallSynthesis.synthesisRules) {
    if (ruleHolds[rule.id]) summary.push(rule.summary);
  }

  return summary;
}

function buildDataQuality(
  rows: AnalysisRow[],
  version: string,
  framework: AnalysisFramework,
  questions: SurveyQuestion[],
): DataQuality {
  const counts = new Map<string, number>();
  let periodStart: string | null = null;
  let periodEnd: string | null = null;
  let analysed = 0;

  const questionById = new Map(questions.map((q) => [q.id, q]));

  for (const row of rows) {
    const version0 = rowVersion(row);
    counts.set(version0, (counts.get(version0) ?? 0) + 1);

    const timestamp = Date.parse(row.created_at);
    if (!Number.isNaN(timestamp)) {
      if (!periodStart || timestamp < Date.parse(periodStart)) {
        periodStart = row.created_at;
      }
      if (!periodEnd || timestamp > Date.parse(periodEnd)) {
        periodEnd = row.created_at;
      }
    }

    if (version0 !== version) continue;
    const hasAny = questions.some((question) =>
      isOptionValue(questionById.get(question.id), row.answers?.[question.id]),
    );
    if (hasAny) analysed += 1;
  }

  const minimumN = framework.method.dominance.minimumNForInterpretiveLanguage;
  const total = rows.length;
  const provenance = summariseProvenance(rows);
  let sampleWarning: string | null = null;
  if (total === 0) {
    sampleWarning = "No responses have been collected yet.";
  } else if (total < minimumN) {
    sampleWarning = `${framework.method.dominance.smallSampleWarning} (N = ${total}).`;
  }

  const all = [...counts.entries()]
    .map(([v, count]) => ({ version: v, count }))
    .sort((a, b) => compareVersionDesc(a.version, b.version));

  const unsupportedVersions = all.filter(
    (entry) => !isSupportedSurveyVersion(entry.version),
  );
  const unsupportedWarning =
    unsupportedVersions.length > 0
      ? `Excluded from analysis: ${unsupportedVersions
          .map((entry) => `${entry.version} (${entry.count})`)
          .join(", ")}. These rows use a version this build cannot interpret and are never reinterpreted as the current instrument.`
      : null;

  return {
    totalResponses: total,
    genuineResponses: provenance.genuine,
    syntheticResponses: provenance.synthetic,
    includesSynthetic: provenance.includesSynthetic,
    syntheticSharePct: provenance.syntheticSharePct,
    syntheticBatches: provenance.syntheticBatches,
    analysedResponses: analysed,
    analysedVersion: version,
    excludedVersions: all.filter((entry) => entry.version !== version),
    versions: all,
    unsupportedVersions,
    unsupportedWarning,
    periodStart,
    periodEnd,
    minimumNForInterpretation: minimumN,
    sampleWarning,
  };
}

export function buildAnalysis(
  rows: AnalysisRow[],
  options?: { version?: string },
): SurveyAnalysis {
  const { version } = selectAnalysedVersion(rows, options?.version);
  const framework = getAnalysisFramework(version);
  const instrumentQuestions = getInstrumentQuestions(version);
  const codebookById = new Map(
    framework.questions.map((question) => [question.id, question]),
  );

  const analysedRows = rows.filter((row) => rowVersion(row) === version);

  const ctx = makeEvalContext(instrumentQuestions);

  const questions = instrumentQuestions.map((surveyQuestion, index) => {
    const codebook = codebookById.get(surveyQuestion.id);
    if (!codebook) {
      throw new Error(
        `The ${version} codebook is missing question "${surveyQuestion.id}".`,
      );
    }
    return aggregateQuestion(surveyQuestion, codebook, analysedRows, index);
  });

  const patterns = buildPatterns(
    analysedRows,
    questions,
    framework,
    version,
    ctx,
  );
  const sections: SectionSummary[] = framework.sectionAnalysis.map((section) => ({
    id: section.id,
    label: section.label,
    purpose: section.purpose,
    cautions: section.cautions,
    questionIds: section.questions,
    leadingNotes: section.questions
      .map((id) => questions.find((q) => q.id === id)?.summary)
      .filter((note): note is string => Boolean(note)),
  }));

  return {
    dataQuality: buildDataQuality(
      rows,
      version,
      framework,
      instrumentQuestions,
    ),
    questions,
    sections,
    patterns,
    recommendations: buildRecommendations(patterns, questions, version),
    synthesis: buildSynthesis(patterns, questions, framework),
    synthesisSummary: buildSynthesisSummary(patterns, framework, version),
    method: framework.method,
    limitations: framework.limitations,
  };
}
