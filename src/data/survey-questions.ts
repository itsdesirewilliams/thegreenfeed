/**
 * TheGreenFeed — approved 16-question campus waste-management survey
 * (PR for Change — Waste Management at PCTE Group of Institutes).
 *
 * SOURCE OF TRUTH: `TheGreenFeed_16_Question_Survey.md` (version v2).
 * Every question and option below is transcribed from that document exactly —
 * do not reword, reorder, or invent questions or options.
 *
 * Option values are the canonical letters "a" / "b" / "c" (they match the
 * questionnaire codes); the human-readable labels act as the codebook for
 * later aggregate analysis. Treat responses as categorical data; never sum
 * them into a single score or claim causal effects from self-reports.
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
  {
    number: 1,
    title: "The Reality",
    subtitle: "What do students actually experience on campus?",
  },
  {
    number: 2,
    title: "What Reaches You?",
    subtitle: "Do campus rules, messages and education actually reach students?",
  },
  {
    number: 3,
    title: "Make the Change",
    subtitle: "What would help students act, and what should the campaign do next?",
  },
] as const;

export const surveyQuestions: SurveyQuestion[] = [
  // SECTION 1 — THE REALITY
  {
    id: "q1",
    type: "single-choice",
    label:
      "How often do you notice litter or waste being disposed of improperly in the areas of PCTE you regularly use?",
    required: true,
    options: [
      { value: "a", label: "Rarely or never" },
      { value: "b", label: "Sometimes" },
      { value: "c", label: "Often or very often" },
    ],
    section: "The Reality",
  },
  {
    id: "q2",
    type: "single-choice",
    label: "Where do you most often notice waste-management problems on campus?",
    required: true,
    options: [
      { value: "a", label: "Canteens, food areas or student gathering spots" },
      { value: "b", label: "Classrooms, corridors or other shared indoor areas" },
      {
        value: "c",
        label: "Outdoor areas, pathways or other places around campus",
      },
    ],
    section: "The Reality",
  },
  {
    id: "q3",
    type: "single-choice",
    label:
      "If the nearest bin is full, difficult to find or has unclear labels, what are you most likely to do?",
    required: true,
    options: [
      { value: "a", label: "Use the nearest bin or leave the waste nearby" },
      { value: "b", label: "Look for another bin if one is reasonably close" },
      {
        value: "c",
        label: "Keep the waste with me until I find a suitable place to dispose of it",
      },
    ],
    section: "The Reality",
  },
  {
    id: "q4",
    type: "single-choice",
    label:
      "If you see another student littering, what are you most likely to do?",
    required: true,
    options: [
      { value: "a", label: "Usually ignore it" },
      { value: "b", label: "Feel uncomfortable but usually say nothing" },
      {
        value: "c",
        label: "Politely speak up or encourage them to dispose of it properly",
      },
    ],
    section: "The Reality",
  },

  // SECTION 2 — WHAT REACHES YOU?
  {
    id: "q5",
    type: "single-choice",
    label:
      "Before taking this survey, did you know that PCTE imposes fines for littering and for being found with chewing gum?",
    required: true,
    options: [
      { value: "a", label: "Yes, I knew about both" },
      { value: "b", label: "I knew about one of these, but not the other" },
      { value: "c", label: "No, I did not know about either" },
    ],
    section: "What Reaches You?",
  },
  {
    id: "q6",
    type: "single-choice",
    label: "How much do these fines influence your own behaviour on campus?",
    required: true,
    /**
     * Analysis note (from the source document): measures students' reported
     * awareness and perceived influence — not proof that fines cause a change
     * in behaviour.
     */
    options: [
      { value: "a", label: "I was not aware of these fines before this survey" },
      {
        value: "b",
        label:
          "I know about them, but they have little or no influence on my behaviour",
      },
      {
        value: "c",
        label:
          "They make me more careful about littering or chewing gum on campus",
      },
    ],
    section: "What Reaches You?",
  },
  {
    id: "q7",
    type: "single-choice",
    label:
      "How often do you notice or remember waste-management messages on campus, such as posters displayed in corridors?",
    required: true,
    options: [
      { value: "a", label: "I rarely or never notice them" },
      {
        value: "b",
        label: "I sometimes notice posters, but rarely remember what they say",
      },
      { value: "c", label: "I notice them and can remember at least one message" },
    ],
    section: "What Reaches You?",
  },
  {
    id: "q8",
    type: "single-choice",
    label:
      "Have you noticed or do you remember environmental or waste-management messages shared through Fashion Department runwalks or similar campus events?",
    required: true,
    options: [
      {
        value: "a",
        label: "I have not noticed these events or their environmental messages",
      },
      {
        value: "b",
        label:
          "I have noticed the event, but do not remember an environmental or waste-management message",
      },
      {
        value: "c",
        label:
          "I remember seeing or hearing an environmental or waste-management message through one of these events",
      },
    ],
    section: "What Reaches You?",
  },
  {
    id: "q9",
    type: "single-choice",
    label:
      "How much practical guidance have you received at PCTE about reducing waste, separating it, recycling it or disposing of it correctly?",
    required: true,
    options: [
      { value: "a", label: "Little or none" },
      {
        value: "b",
        label: "Some guidance, but not enough to feel consistent or practical",
      },
      {
        value: "c",
        label: "Enough practical guidance to understand what I should do",
      },
    ],
    section: "What Reaches You?",
  },
  {
    id: "q10",
    type: "single-choice",
    label:
      "How confident are you that you know how to separate common waste items, such as a plastic bottle, a clean cardboard box and leftover food?",
    required: true,
    options: [
      {
        value: "a",
        label: "Not confident; I am unsure how to separate them correctly",
      },
      {
        value: "b",
        label: "Somewhat confident, but unsure about at least one item",
      },
      {
        value: "c",
        label: "Confident that I know how to separate all three",
      },
    ],
    section: "What Reaches You?",
  },

  // SECTION 3 — MAKE THE CHANGE
  {
    id: "q11",
    type: "single-choice",
    label: "What is the biggest obstacle to better waste management at PCTE?",
    required: true,
    options: [
      {
        value: "a",
        label: "Bins are hard to find, overflowing or not clearly labelled",
      },
      {
        value: "b",
        label: "Students lack awareness, motivation or clear guidance",
      },
      {
        value: "c",
        label:
          "Both seem manageable to me; neither stands out as the main obstacle",
      },
    ],
    section: "Make the Change",
  },
  {
    id: "q12",
    type: "single-choice",
    label:
      "Which change would make the biggest practical difference to waste management on campus?",
    required: true,
    options: [
      {
        value: "a",
        label: "More accessible bins with clear labels showing what goes where",
      },
      {
        value: "b",
        label: "Regular, practical demonstrations and easy-to-understand guidance",
      },
      {
        value: "c",
        label:
          "Student-led activities that make proper disposal a shared campus habit",
      },
    ],
    section: "Make the Change",
  },
  {
    id: "q13",
    type: "single-choice",
    label:
      "Which format would most likely get you to notice and engage with a waste-management campaign?",
    required: true,
    options: [
      { value: "a", label: "Short videos and social-media posts" },
      { value: "b", label: "Clear, well-placed posters and signs around campus" },
      { value: "c", label: "Live demonstrations, challenges or student events" },
    ],
    section: "Make the Change",
  },
  {
    id: "q14",
    type: "single-choice",
    label:
      "Which message would most encourage you to dispose of waste responsibly on campus?",
    required: true,
    options: [
      { value: "a", label: "Make campus cleaner and more pleasant for everyone" },
      { value: "b", label: "Show exactly how and where to dispose of common items" },
      {
        value: "c",
        label:
          "Explain the consequences of littering and the rules that apply on campus",
      },
    ],
    section: "Make the Change",
  },
  {
    id: "q15",
    type: "single-choice",
    label:
      "What would make it easiest for you to dispose of waste correctly every day at PCTE?",
    required: true,
    options: [
      {
        value: "a",
        label: "Convenient bins with clear labels wherever students need them",
      },
      {
        value: "b",
        label: "Simple reminders and practical instructions at the point of disposal",
      },
      {
        value: "c",
        label:
          "Seeing classmates and campus groups consistently do the right thing",
      },
    ],
    section: "Make the Change",
  },
  {
    id: "q16",
    type: "single-choice",
    label:
      "If TheGreenFeed ran a practical waste-management activity at PCTE, how likely would you be to take part?",
    required: true,
    options: [
      { value: "a", label: "Unlikely to participate" },
      { value: "b", label: "Might participate, depending on the activity and timing" },
      { value: "c", label: "Very likely to participate" },
    ],
    section: "Make the Change",
  },
];

/* ------------------------------------------------------------------------ */
/* Consent                                                                  */
/* ------------------------------------------------------------------------ */

/** Stable id under which the consent choice is keyed in `answers`. */
export const SURVEY_CONSENT_ID = "consent";

/**
 * The consent question and its options, exactly as specified in the source
 * document. Only option "a" permits the respondent to continue; choosing "b"
 * or "c" stops the survey without storing research answers.
 */
export const SURVEY_CONSENT_QUESTION =
  "Do you agree to take part in this anonymous student survey?";

export const SURVEY_CONSENT_OPTIONS = [
  { value: "a", label: "Yes, I agree to participate." },
  { value: "b", label: "No, I do not agree to participate." },
  { value: "c", label: "Prefer not to answer." },
] as const satisfies readonly SurveyOption[];

/** The only consent choice that permits continuation. */
export const SURVEY_CONSENT_ACCEPTED_VALUE = "a";

/* ------------------------------------------------------------------------ */
/* Respondent profile (minimum useful, non-identifying)                     */
/* ------------------------------------------------------------------------ */

export type SurveyProfileFieldType = "select" | "short-text";

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
  options?: SurveyOption[];
  /** Grouped display options for a select field (alternative to `options`). */
  groups?: SurveyProfileOptionGroup[];
  maxLength?: number;
  placeholder?: string;
};

/**
 * Every selectable option of a profile field, whether declared flat (`options`)
 * or grouped (`groups`). Client validation, server-side validation, and the
 * stored answer all use this single source of truth.
 */
export function getProfileFieldOptions(
  field: SurveyProfileField,
): SurveyOption[] {
  if (field.groups) return field.groups.flatMap((group) => group.options);
  return field.options ?? [];
}

export const SURVEY_PROFILE_FIELDS: SurveyProfileField[] = [
  /**
   * Programme / course — verified against the PCTE website (programme list
   * supplied by the owner). The displayed names are the exact course names;
   * the stored value is a stable internal slug (the analysis codebook). The
   * three categories are display groups, not selectable values.
   */
  {
    id: "profile_programme",
    label: "Programme / course",
    type: "select",
    required: true,
    groups: [
      {
        label: "Engineering & Technology",
        options: [
          {
            value: "computer-science-engineering",
            label: "Computer Science Engineering",
          },
          {
            value: "btech-cse-cyber-security",
            label: "B.Tech CSE (Cyber Security)",
          },
          {
            value: "artificial-intelligence-ml",
            label: "Artificial Intelligence & ML",
          },
          {
            value: "mechanical-engineering",
            label: "Mechanical Engineering",
          },
          { value: "civil-engineering", label: "Civil Engineering" },
        ],
      },
      {
        label: "Undergraduate (UG)",
        options: [
          { value: "bca", label: "BCA (Computer Applications)" },
          { value: "bba", label: "BBA (Business Admin)" },
          { value: "bcom-hons", label: "B.Com (Hons)" },
          { value: "bpharm", label: "Pharmaceutical Sciences (B.Pharm)" },
          { value: "bsc-fashion-designing", label: "B.Sc Fashion Designing" },
          { value: "bhmct", label: "BHMCT (Hotel Management)" },
          { value: "bajmc", label: "BAJMC (Journalism & Media)" },
          { value: "bttm", label: "BTTM (Travel & Tourism)" },
          { value: "bsc-mls", label: "B.Sc MLS (Medical Lab)" },
        ],
      },
      {
        label: "Postgraduate & Diploma",
        options: [
          { value: "mba", label: "MBA (Master of Business Admin)" },
          { value: "mba-international-business", label: "MBA (International Business)" },
          { value: "mba-fintech", label: "MBA (Fintech)" },
          { value: "dpharm", label: "Diploma in Pharmacy (D.Pharm)" },
        ],
      },
    ],
  },

  /**
   * NOT COLLECTED — section/batch and admission cohort remain unverified. The
   * supplied source verifies programme names only. Restore a field here once
   * its options are confirmed against a PCTE source:
   *
   * {
   *   id: "profile_section",
   *   label: "Class, section, or batch",
   *   description: "Optional — where applicable.",
   *   type: "short-text",
   *   required: false,
   *   maxLength: 60,
   *   placeholder: "Section or batch name",
   * },
   * {
   *   id: "profile_cohort",
   *   label: "Admission year",
   *   description: "Optional — used to group responses by cohort.",
   *   type: "select",
   *   required: false,
   *   options: [ … verified admission years …, { value: "earlier", label: "Before <year>" } ],
   * },
   *
   * Notes: admission year is a cohort label, NOT equivalent to current year of
   * study. Never ask for names, roll numbers, phone numbers, or email
   * addresses. Changing option values after publication would split analysis.
   */
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
