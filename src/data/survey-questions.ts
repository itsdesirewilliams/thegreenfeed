/**
 * TheGreenFeed — approved 16-question waste-management research survey
 * (PR awareness project targeting PCTE Group of Institutes students).
 *
 * The wording and the three answer options per question are approved content:
 * do not rewrite them, and do not invent a scoring system. Option values are
 * the canonical letters "a" / "b" / "c" (they match the questionnaire codes);
 * the human-readable labels live here and act as the codebook for later
 * aggregate analysis.
 *
 * `SURVEY_PUBLISHED` stays `false` until the owner has reviewed the complete
 * experience, a verified test submission exists in Supabase, and publication
 * is explicitly approved. See README ("Survey publication").
 *
 * Supported question types (schema general, current instrument single-choice):
 * short-text, long-text, single-choice, multiple-choice, yes-no.
 */
export const SURVEY_SCHEMA_VERSION = "v2";

export const SURVEY_PUBLISHED = false;

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

export const SURVEY_SECTIONS = [
  { number: 1, title: "The reality" },
  { number: 2, title: "What reaches you?" },
  { number: 3, title: "Make the change" },
] as const;

export const surveyQuestions: SurveyQuestion[] = [
  // SECTION 1 — THE REALITY
  {
    id: "q1",
    type: "single-choice",
    label:
      "How often do you notice litter or improperly disposed waste in the areas of PCTE you regularly use?",
    required: true,
    options: [
      { value: "a", label: "Rarely or never" },
      { value: "b", label: "Sometimes" },
      { value: "c", label: "Often or very often" },
    ],
    section: "The reality",
  },
  {
    id: "q2",
    type: "single-choice",
    label: "Where do you most often notice waste-management problems on campus?",
    required: true,
    options: [
      { value: "a", label: "Canteens, food areas, or gathering spots" },
      { value: "b", label: "Classrooms, corridors, or common areas" },
      {
        value: "c",
        label: "I rarely notice a problem, or I notice it elsewhere",
      },
    ],
    section: "The reality",
  },
  {
    id: "q3",
    type: "single-choice",
    label:
      "If the nearest bin is overflowing or its purpose is unclear, what would you most likely do?",
    required: true,
    options: [
      { value: "a", label: "Use it anyway or leave my waste nearby" },
      { value: "b", label: "Look for another bin if one is convenient" },
      { value: "c", label: "Keep my waste until I find a suitable place" },
    ],
    section: "The reality",
  },
  {
    id: "q4",
    type: "single-choice",
    label: "If you see another student littering, what are you most likely to do?",
    required: true,
    options: [
      { value: "a", label: "Usually ignore it" },
      { value: "b", label: "Disapprove but usually say nothing" },
      { value: "c", label: "Politely speak up or encourage proper disposal" },
    ],
    section: "The reality",
  },

  // SECTION 2 — WHAT REACHES YOU?
  {
    id: "q5",
    type: "single-choice",
    label:
      "Before taking this survey, did you know PCTE imposes fines for littering or being found with chewing gum?",
    required: true,
    options: [
      { value: "a", label: "No, I wasn't aware of this" },
      { value: "b", label: "I'd heard about it but wasn't sure of the details" },
      { value: "c", label: "Yes, I knew about it" },
    ],
    section: "What reaches you?",
  },
  {
    id: "q6",
    type: "single-choice",
    label:
      "Before this survey, how often did you notice environmental or waste-management posters in PCTE corridors?",
    required: true,
    options: [
      { value: "a", label: "Rarely or never" },
      { value: "b", label: "Sometimes, but I rarely remember the message" },
      { value: "c", label: "Often, and I can recall what they communicate" },
    ],
    section: "What reaches you?",
  },
  {
    id: "q7",
    type: "single-choice",
    label:
      "Before this survey, were you aware that Fashion Department runwalks have featured messages about waste management or other social causes?",
    required: true,
    options: [
      { value: "a", label: "No, I wasn't aware of those messages" },
      { value: "b", label: "I knew about the events, but not their messages" },
      { value: "c", label: "Yes, I was aware of the messages" },
    ],
    section: "What reaches you?",
  },
  {
    id: "q8",
    type: "single-choice",
    label:
      "How much practical guidance has PCTE provided about sorting, recycling, and disposing of waste correctly?",
    required: true,
    options: [
      { value: "a", label: "Little or none that I can recall" },
      { value: "b", label: "Some guidance, but not enough to feel confident" },
      { value: "c", label: "Enough practical guidance to know what to do" },
    ],
    section: "What reaches you?",
  },
  {
    id: "q9",
    type: "single-choice",
    label:
      "How confident are you about what to do with a used plastic bottle, clean cardboard, and leftover food?",
    required: true,
    options: [
      { value: "a", label: "I'm unsure how to handle most of them" },
      { value: "b", label: "I know what to do with some, but not all" },
      { value: "c", label: "I know how to handle all three" },
    ],
    section: "What reaches you?",
  },
  {
    id: "q10",
    type: "single-choice",
    label:
      "If you wanted to know what happens to waste after it leaves a PCTE bin, would you know where to find that information?",
    required: true,
    options: [
      { value: "a", label: "No, I wouldn't know where to look" },
      { value: "b", label: "I might find it with some effort" },
      { value: "c", label: "Yes, I know where to find it" },
    ],
    section: "What reaches you?",
  },

  // SECTION 3 — MAKE THE CHANGE
  {
    id: "q11",
    type: "single-choice",
    label:
      "How much do PCTE's fines for littering or chewing gum influence your behaviour on campus?",
    required: true,
    options: [
      { value: "a", label: "Little or not at all" },
      { value: "b", label: "They make me more cautious in some situations" },
      {
        value: "c",
        label: "They strongly influence me to avoid these behaviours",
      },
    ],
    section: "Make the change",
  },
  {
    id: "q12",
    type: "single-choice",
    label: "What is the biggest obstacle to better waste disposal at PCTE?",
    required: true,
    options: [
      { value: "a", label: "Bins, labels, or disposal facilities aren't adequate" },
      {
        value: "b",
        label: "Students lack awareness, motivation, or consistent habits",
      },
      { value: "c", label: "Neither is a major obstacle, or I'm unsure" },
    ],
    section: "Make the change",
  },
  {
    id: "q13",
    type: "single-choice",
    label: "Which change would make the biggest practical difference at PCTE?",
    required: true,
    options: [
      { value: "a", label: "More accessible bins with clearer labels" },
      { value: "b", label: "Practical education and demonstrations" },
      { value: "c", label: "Student-led activities and peer involvement" },
    ],
    section: "Make the change",
  },
  {
    id: "q14",
    type: "single-choice",
    label:
      "Which format would most likely get your attention for a waste-management campaign?",
    required: true,
    options: [
      { value: "a", label: "Short videos and social media" },
      { value: "b", label: "Posters and visible campus signage" },
      {
        value: "c",
        label: "Live demonstrations, challenges, and student events",
      },
    ],
    section: "Make the change",
  },
  {
    id: "q15",
    type: "single-choice",
    label:
      "What would most encourage you to dispose of waste responsibly, even when nobody is watching?",
    required: true,
    options: [
      { value: "a", label: "Clear instructions and convenient facilities" },
      { value: "b", label: "Seeing friends and classmates do it" },
      {
        value: "c",
        label: "Understanding the environmental impact of my actions",
      },
    ],
    section: "Make the change",
  },
  {
    id: "q16",
    type: "single-choice",
    label:
      "If TheGreenFeed launched a practical waste-management initiative at PCTE, how likely would you be to participate?",
    required: true,
    options: [
      { value: "a", label: "Unlikely" },
      { value: "b", label: "Maybe, depending on the activity" },
      { value: "c", label: "Very likely" },
    ],
    section: "Make the change",
  },
];

/* ------------------------------------------------------------------------ */
/* Consent                                                                  */
/* ------------------------------------------------------------------------ */

/** Stable id under which the consent decision is stored in `answers`. */
export const SURVEY_CONSENT_ID = "consent";

export const SURVEY_CONSENT_LABEL =
  "I have read the information above and agree to take part in this survey voluntarily.";

/* ------------------------------------------------------------------------ */
/* Respondent profile (minimum useful, non-identifying)                     */
/* ------------------------------------------------------------------------ */

export type SurveyProfileFieldType = "select" | "short-text";

export type SurveyProfileField = {
  /** Stable identifier used as the answer key. */
  id: string;
  label: string;
  description?: string;
  type: SurveyProfileFieldType;
  required: boolean;
  options?: SurveyOption[];
  maxLength?: number;
  placeholder?: string;
};

export const SURVEY_PROFILE_FIELDS: SurveyProfileField[] = [
  {
    id: "profile_programme",
    label: "Programme / course",
    type: "select",
    required: true,
    /**
     * PLACEHOLDER OPTIONS — broad programme families, not a verified list of
     * PCTE's current programmes. Verify against PCTE's current prospectus and
     * replace/extend these values before publication; changing values later
     * would split analysis, so this must be settled first.
     */
    options: [
      { value: "engineering", label: "Engineering (e.g. B.Tech)" },
      { value: "management", label: "Management / Commerce (e.g. BBA, B.Com)" },
      {
        value: "computer-applications",
        label: "Computer applications (e.g. BCA, MCA)",
      },
      { value: "design-fashion", label: "Design / Fashion" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "profile_section",
    label: "Class, section, or batch",
    description: "Optional — where applicable.",
    type: "short-text",
    required: false,
    maxLength: 60,
    placeholder: "Section or batch name",
  },
  {
    id: "profile_cohort",
    label: "Admission year",
    description: "Optional — used to group responses by cohort.",
    type: "select",
    required: false,
    /**
     * PLACEHOLDER RANGE — adjust to the active admission years before
     * publication; older cohorts can be grouped as "earlier".
     */
    options: [
      { value: "2026", label: "2026" },
      { value: "2025", label: "2025" },
      { value: "2024", label: "2024" },
      { value: "2023", label: "2023" },
      { value: "2022", label: "2022" },
      { value: "earlier", label: "Before 2022" },
    ],
  },
];

/* ------------------------------------------------------------------------ */
/* Answer types                                                            */
/* ------------------------------------------------------------------------ */

/** A single answer value, keyed by question id in `SurveyAnswers`. */
export type SurveyAnswerValue = string | string[] | boolean;

export type SurveyAnswers = Record<string, SurveyAnswerValue>;

export function getSurveyQuestion(id: string): SurveyQuestion | undefined {
  return surveyQuestions.find((question) => question.id === id);
}
