import {
  surveyQuestions,
  type SurveyQuestion,
} from "@/data/survey-questions";
import {
  ANALYSIS_FRAMEWORK,
  ANALYSIS_LIMITATIONS,
  ANALYSIS_METHOD,
  ANALYSIS_QUESTIONS,
  ANALYSIS_SECTIONS,
  type AnalysisQuestion,
  type DominanceKind,
} from "@/data/analysis-framework";

/**
 * Deterministic analysis engine.
 *
 * Pure functions only: they take stored rows and return counts, dominance
 * classifications, cross-question patterns and cautious recommendations. No
 * network, no AI, no scoring. A/B/C stay categorical; answers are never summed
 * into a single index.
 */

export type AnalysisRow = {
  id: string;
  created_at: string;
  schema_version: string;
  answers: Record<string, unknown>;
};

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
  analysedResponses: number;
  versions: { version: string; count: number }[];
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
  method: typeof ANALYSIS_METHOD;
  limitations: string[];
};

const questionById = new Map(surveyQuestions.map((q) => [q.id, q]));
const frameworkQuestionById = new Map(
  ANALYSIS_QUESTIONS.map((q) => [q.id, q]),
);

/** A share at or above this counts as a "common" answer for pattern rules. */
const COMMON_SHARE = 25;
const STRONG_SHARE = 40;

function roundPct(value: number): number {
  return Math.round(value);
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
): { dominance: DominanceKind; leadingValues: string[]; topPct: number; secondPct: number } {
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
  const secondText = second ? `, ahead of "${second.label}" ${roundPct(secondPct)}%` : "";

  const verdict =
    dominance === "majority"
      ? "a majority"
      : dominance === "plurality"
        ? "a plurality"
        : "a close/mixed split";

  return `"${leader}" leads at ${roundPct(topPct)}% — ${verdict}${secondText} (${denominator}).`;
}

/** Share of rows, among those that answered every referenced question. */
function share(
  rows: AnalysisRow[],
  predicate: (answers: Record<string, unknown>) => boolean,
  referenced: string[],
): { denom: number; matched: number; pct: number } {
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
}

function value(answers: Record<string, unknown>, id: string): string | undefined {
  const raw = answers?.[id];
  return typeof raw === "string" ? raw : undefined;
}

function marginal(
  rows: AnalysisRow[],
  id: string,
  allowed: string[],
): { denom: number; matched: number; pct: number } {
  return share(rows, (answers) => allowed.includes(value(answers, id) ?? ""), [
    id,
  ]);
}

function evidence(label: string, s: { denom: number; matched: number; pct: number }): PatternEvidence {
  return {
    label,
    detail: `${s.matched}/${s.denom} (${roundPct(s.pct)}%)`,
  };
}

type PatternResult = {
  triggered: boolean;
  evidence: PatternEvidence[];
};

function evaluatePatterns(rows: AnalysisRow[]): Record<string, PatternResult> {
  const results: Record<string, PatternResult> = {};

  const q1c = marginal(rows, "q1", ["c"]);
  results.high_reported_visibility = {
    triggered: q1c.pct >= COMMON_SHARE,
    evidence: [
      evidence("Q1 often/very often notices improper disposal", q1c),
    ],
  };

  const q3a = marginal(rows, "q3", ["a"]);
  const q11a = marginal(rows, "q11", ["a"]);
  const convenienceJoint = share(
    rows,
    (a) => value(a, "q3") === "a" && value(a, "q11") === "a",
    ["q3", "q11"],
  );
  results.convenience_barrier = {
    triggered: q3a.pct >= COMMON_SHARE && q11a.pct >= COMMON_SHARE,
    evidence: [
      evidence("Q3 nearest-bin inconvenience", q3a),
      evidence("Q11 infrastructure named as biggest obstacle", q11a),
      evidence("Both answered the same way (joint)", convenienceJoint),
    ],
  };

  const q4c = marginal(rows, "q4", ["c"]);
  const q4ab = marginal(rows, "q4", ["a", "b"]);
  results.peer_non_intervention = {
    triggered: q4ab.matched > q4c.matched,
    evidence: [
      evidence("Q4 ignore / stay silent", q4ab),
      evidence("Q4 would speak up", q4c),
    ],
  };

  const q5c = marginal(rows, "q5", ["c"]);
  const q7a = marginal(rows, "q7", ["a"]);
  const awarenessGapJoint = share(
    rows,
    (a) => value(a, "q5") === "c" || value(a, "q7") === "a",
    ["q5", "q7"],
  );
  results.awareness_or_visibility_gap = {
    triggered: q5c.pct >= COMMON_SHARE || q7a.pct >= COMMON_SHARE,
    evidence: [
      evidence("Q5 unaware of either fine", q5c),
      evidence("Q7 rarely/never notice messages", q7a),
      evidence("Either answer (joint)", awarenessGapJoint),
    ],
  };

  const q7b = marginal(rows, "q7", ["b"]);
  const q8b = marginal(rows, "q8", ["b"]);
  const seenNotRememberedJoint = share(
    rows,
    (a) => value(a, "q7") === "b" || value(a, "q8") === "b",
    ["q7", "q8"],
  );
  results.seen_not_remembered = {
    triggered: q7b.pct >= COMMON_SHARE || q8b.pct >= COMMON_SHARE,
    evidence: [
      evidence("Q7 see posters but rarely remember", q7b),
      evidence("Q8 saw event but not the message", q8b),
      evidence("Either answer (joint)", seenNotRememberedJoint),
    ],
  };

  const q9ab = marginal(rows, "q9", ["a", "b"]);
  const q10ab = marginal(rows, "q10", ["a", "b"]);
  const guidanceJoint = share(
    rows,
    (a) => ["a", "b"].includes(value(a, "q9") ?? "") && ["a", "b"].includes(value(a, "q10") ?? ""),
    ["q9", "q10"],
  );
  results.practical_guidance_gap = {
    triggered: q9ab.pct >= 50 && q10ab.pct >= 50,
    evidence: [
      evidence("Q9 little/partial practical guidance", q9ab),
      evidence("Q10 not fully confident separating", q10ab),
      evidence("Both answers (joint)", guidanceJoint),
    ],
  };

  const q5a = marginal(rows, "q5", ["a"]);
  const q6b = marginal(rows, "q6", ["b"]);
  const awarenessNoInfluenceJoint = share(
    rows,
    (a) => value(a, "q5") === "a" && value(a, "q6") === "b",
    ["q5", "q6"],
  );
  results.awareness_without_reported_influence = {
    triggered: q5a.pct >= COMMON_SHARE && q6b.pct >= COMMON_SHARE,
    evidence: [
      evidence("Q5 knew about both fines", q5a),
      evidence("Q6 fines have little/no influence", q6b),
      evidence("Both answered the same way (joint)", awarenessNoInfluenceJoint),
    ],
  };

  const infrastructureJoint = share(
    rows,
    (a) =>
      value(a, "q11") === "a" ||
      value(a, "q12") === "a" ||
      value(a, "q15") === "a",
    ["q11", "q12", "q15"],
  );
  results.infrastructure_first = {
    triggered: infrastructureJoint.pct >= STRONG_SHARE,
    evidence: [
      evidence("Q11/Q12/Q15 pick bins, access or labels", infrastructureJoint),
    ],
  };

  const educationJoint = share(
    rows,
    (a) => value(a, "q11") === "b" && value(a, "q12") === "b",
    ["q11", "q12"],
  );
  const q9abForEducation = q9ab;
  const q10abForEducation = q10ab;
  results.education_first = {
    triggered:
      educationJoint.pct >= 20 &&
      (q9abForEducation.pct >= 50 || q10abForEducation.pct >= 50),
    evidence: [
      evidence("Q11 and Q12 both favour guidance (joint)", educationJoint),
      evidence("Q9 practical guidance gap", q9abForEducation),
      evidence("Q10 confidence gap", q10abForEducation),
    ],
  };

  const participationJoint = share(
    rows,
    (a) =>
      (value(a, "q12") === "c" || value(a, "q15") === "c") &&
      ["b", "c"].includes(value(a, "q16") ?? ""),
    ["q12", "q15", "q16"],
  );
  results.student_led_opportunity = {
    triggered: participationJoint.pct >= 20,
    evidence: [
      evidence("Q12/Q15 peer-habit and Q16 might/very likely (joint)", participationJoint),
    ],
  };

  return results;
}

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

const PATTERN_LABELS: Record<string, string> = {
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

function buildPatterns(
  rows: AnalysisRow[],
  questions: QuestionAggregate[],
): PatternFinding[] {
  const results = evaluatePatterns(rows);

  const channelClear = (id: string) => {
    const q = questions.find((entry) => entry.id === id);
    return !!q && q.dominance !== "tie" && q.dominance !== "closeSplit" && q.leadingValues.length === 1;
  };
  results.channel_message_match = {
    triggered: channelClear("q13") && channelClear("q14"),
    evidence: [
      evidence(
        "Q13 preferred channel leader",
        (() => {
          const q = questions.find((entry) => entry.id === "q13");
          return { denom: q?.validN ?? 0, matched: q?.options.find((o) => o.value === q.leadingValues[0])?.count ?? 0, pct: q?.topPct ?? 0 };
        })(),
      ),
      evidence(
        "Q14 preferred message leader",
        (() => {
          const q = questions.find((entry) => entry.id === "q14");
          return { denom: q?.validN ?? 0, matched: q?.options.find((o) => o.value === q.leadingValues[0])?.count ?? 0, pct: q?.topPct ?? 0 };
        })(),
      ),
    ],
  };

  const findings: PatternFinding[] = [];
  for (const section of ANALYSIS_SECTIONS) {
    for (const pattern of section.patterns) {
      const result = results[pattern.id];
      if (!result) continue;
      findings.push(
        makePattern(
          pattern,
          section.id,
          PATTERN_LABELS[pattern.id] ?? pattern.id,
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
): Recommendation[] {
  const isOn = (id: string) =>
    patterns.find((pattern) => pattern.id === id)?.triggered ?? false;
  const evidenceFor = (id: string) =>
    patterns.find((pattern) => pattern.id === id)?.evidence.map(
      (entry) => `${entry.label}: ${entry.detail}`,
    ) ?? [];

  const recommendations: Recommendation[] = [];

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

  if (isOn("awareness_or_visibility_gap") || isOn("awareness_without_reported_influence")) {
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
      evidence: ["No cross-question pattern crossed its threshold with the current responses."],
      caveat:
        "Small samples can hide real patterns; revisit once more responses are collected.",
    });
  }

  return recommendations;
}

function buildSynthesis(
  patterns: PatternFinding[],
  questions: QuestionAggregate[],
): SynthesisFinding[] {
  const find = (id: string) => questions.find((q) => q.id === id);

  const notes = (ids: string[]): string[] =>
    ids.map((id) => find(id)?.summary ?? "").filter(Boolean);

  return ANALYSIS_FRAMEWORK.overallSynthesis.dimensions.map((dimension) => ({
    id: dimension.id,
    label: dimension.meaning,
    meaning: dimension.meaning,
    notes: notes(dimension.inputs),
    triggeredPatterns: patterns
      .filter((pattern) => pattern.triggered)
      .map((pattern) => pattern.label),
  }));
}

function buildSynthesisSummary(patterns: PatternFinding[]): string[] {
  const isOn = (id: string) =>
    patterns.find((pattern) => pattern.id === id)?.triggered ?? false;
  const summary: string[] = [];

  for (const rule of ANALYSIS_FRAMEWORK.overallSynthesis.synthesisRules) {
    if (rule.id === "combined_infrastructure_guidance") {
      if (isOn("infrastructure_first") && isOn("practical_guidance_gap")) {
        summary.push(rule.summary);
      }
      continue;
    }
    if (rule.id === "communication_reach") {
      if (isOn("awareness_or_visibility_gap") || isOn("seen_not_remembered")) {
        summary.push(rule.summary);
      }
      continue;
    }
    if (rule.id === "student_led_pilot") {
      if (isOn("student_led_opportunity")) summary.push(rule.summary);
      continue;
    }
    if (rule.id === "mixed_signal") {
      const anyOn = patterns.some((pattern) => pattern.triggered);
      if (!anyOn) summary.push(rule.summary);
    }
  }

  return summary;
}

function buildDataQuality(rows: AnalysisRow[]): DataQuality {
  const versions = new Map<string, number>();
  let periodStart: string | null = null;
  let periodEnd: string | null = null;
  let analysed = 0;

  for (const row of rows) {
    versions.set(row.schema_version, (versions.get(row.schema_version) ?? 0) + 1);

    const timestamp = Date.parse(row.created_at);
    if (!Number.isNaN(timestamp)) {
      if (!periodStart || timestamp < Date.parse(periodStart)) {
        periodStart = row.created_at;
      }
      if (!periodEnd || timestamp > Date.parse(periodEnd)) {
        periodEnd = row.created_at;
      }
    }

    const hasAny = ANALYSIS_QUESTIONS.some((codebook) =>
      isOptionValue(questionById.get(codebook.id), row.answers?.[codebook.id]),
    );
    if (hasAny) analysed += 1;
  }

  const minimumN = ANALYSIS_METHOD.dominance.minimumNForInterpretiveLanguage;
  const total = rows.length;
  let sampleWarning: string | null = null;
  if (total === 0) {
    sampleWarning = "No responses have been collected yet.";
  } else if (total < minimumN) {
    sampleWarning = `${ANALYSIS_METHOD.dominance.smallSampleWarning} (N = ${total}).`;
  }

  return {
    totalResponses: total,
    analysedResponses: analysed,
    versions: [...versions.entries()]
      .map(([version, count]) => ({ version, count }))
      .sort((a, b) => a.version.localeCompare(b.version)),
    periodStart,
    periodEnd,
    minimumNForInterpretation: minimumN,
    sampleWarning,
  };
}

export function buildAnalysis(rows: AnalysisRow[]): SurveyAnalysis {
  const questions = ANALYSIS_QUESTIONS.map((codebook, index) => {
    const surveyQuestion = questionById.get(codebook.id);
    if (!surveyQuestion) {
      throw new Error(
        `Analysis codebook references unknown question "${codebook.id}".`,
      );
    }
    return aggregateQuestion(surveyQuestion, codebook, rows, index);
  });

  const patterns = buildPatterns(rows, questions);
  const sections: SectionSummary[] = ANALYSIS_SECTIONS.map((section) => ({
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
    dataQuality: buildDataQuality(rows),
    questions,
    sections,
    patterns,
    recommendations: buildRecommendations(patterns, questions),
    synthesis: buildSynthesis(patterns, questions),
    synthesisSummary: buildSynthesisSummary(patterns),
    method: ANALYSIS_METHOD,
    limitations: ANALYSIS_LIMITATIONS,
  };
}

export { ANALYSIS_FRAMEWORK, frameworkQuestionById };
