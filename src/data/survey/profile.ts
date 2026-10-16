import type {
  SurveyOption,
  SurveyProfileField,
} from "./types";

/**
 * Respondent-profile fields, the consent statement and phone validation.
 *
 * These are identical across instrument versions: the student-details screen is
 * not part of the versioned questionnaire, only the 16 (v2/v3) or 18 (v4)
 * research questions are. Keeping them here means a new instrument version does
 * not fork the privacy/consent flow.
 */

/** Stable id under which the consent decision is keyed in `answers`. */
export const SURVEY_CONSENT_ID = "consent";

/**
 * The exact consent statement shown as a required checkbox on the
 * student-details screen. The response is recorded only when the respondent
 * ticks it; the accepted decision is stored as `consent: true`.
 */
export const SURVEY_CONSENT_STATEMENT =
  "I agree to participate in this survey and allow my responses to be used for TheGreenFeed's waste-management project at PCTE.";

/**
 * Permissive phone-number shape: digits with optional `+`, spaces, dashes,
 * dots and parentheses. Deliberately not country-specific.
 */
export const SURVEY_PHONE_PATTERN = /^[+0-9()\-.\s]{6,20}$/;

/** True when the (already trimmed) value looks like a usable phone number. */
export function isValidSurveyPhone(value: string): boolean {
  return SURVEY_PHONE_PATTERN.test(value);
}

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
  {
    id: "profile_full_name",
    label: "Full name",
    type: "short-text",
    required: true,
    // Required from v3 onward; legacy v2 payloads may omit it during rollout.
    requiredFrom: "v3",
    maxLength: 80,
    placeholder: "Your full name",
  },

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

  {
    id: "profile_phone",
    label: "Phone number",
    type: "tel",
    required: false,
    maxLength: 20,
    placeholder: "+91 98765 43210",
  },

  /**
   * NOT COLLECTED — class/section/batch and admission-year cohort were never
   * verified against a PCTE source, so they are intentionally omitted. Restore
   * a field here only once its options are confirmed:
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
   * study. Changing option values after publication would split analysis.
   */
];
