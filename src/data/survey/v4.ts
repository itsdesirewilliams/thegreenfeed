import type { SurveyInstrument, SurveySection } from "./types";

/**
 * v4 instrument — the redesigned questionnaire (proposal in
 * `docs/survey-redesign.md`).
 *
 * 18 shipping questions across four sections. Option codes stay `a`/`b`/`c`…
 * (the canonical letters); they are CATEGORICAL, never summed.
 *
 * `q14` (objective sorting knowledge) is intentionally NOT shipped: it needs a
 * locally verified answer key before it can exist. The `q14` id is reserved so
 * that adding it later renumbers nothing. Rows from earlier versions are
 * interpreted with `V3_INSTRUMENT`; the analysis engine never mixes versions.
 */

const sections: SurveySection[] = [
  {
    number: 1,
    title: "Campus conditions and convenience",
    subtitle: "What do you actually see and experience around campus?",
  },
  {
    number: 2,
    title: "Attitudes, norms and reported behaviour",
    subtitle: "How do you and those around you usually respond?",
  },
  {
    number: 3,
    title: "Do campus rules and messages reach students?",
    subtitle: "Which rules, messages and guidance actually get through?",
  },
  {
    number: 4,
    title: "What could help, and what to test next",
    subtitle: "What would make the biggest difference, in your view?",
  },
];

export const V4_INSTRUMENT: SurveyInstrument = {
  version: "v4",
  sections,
  questions: [
    // SECTION 1 — CAMPUS CONDITIONS AND CONVENIENCE
    {
      id: "q1",
      type: "single-choice",
      label:
        "How often do you notice litter or waste disposed of improperly in the areas of PCTE you regularly use?",
      required: true,
      options: [
        { value: "a", label: "Never" },
        { value: "b", label: "Rarely" },
        { value: "c", label: "Sometimes" },
        { value: "d", label: "Often" },
        { value: "e", label: "Very often" },
      ],
      section: "Campus conditions and convenience",
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
        { value: "d", label: "Not sure" },
      ],
      section: "Campus conditions and convenience",
    },
    {
      id: "q3",
      type: "single-choice",
      label:
        "When you need to dispose of waste at PCTE, how often is a bin available and easy to reach?",
      required: true,
      options: [
        { value: "a", label: "Never" },
        { value: "b", label: "Rarely" },
        { value: "c", label: "Sometimes" },
        { value: "d", label: "Often" },
        { value: "e", label: "Always" },
        { value: "f", label: "Not sure" },
      ],
      section: "Campus conditions and convenience",
    },
    {
      id: "q4",
      type: "single-choice",
      label:
        "How often are the bins you use already full or clearly not emptied often enough?",
      required: true,
      options: [
        { value: "a", label: "Never" },
        { value: "b", label: "Rarely" },
        { value: "c", label: "Sometimes" },
        { value: "d", label: "Often" },
        { value: "e", label: "Always" },
        { value: "f", label: "Not sure" },
      ],
      section: "Campus conditions and convenience",
    },
    {
      id: "q5",
      type: "single-choice",
      label: "Are the bin labels clear enough to know what goes where?",
      required: true,
      options: [
        { value: "a", label: "Clear everywhere" },
        { value: "b", label: "Clear in some places only" },
        { value: "c", label: "Not clear" },
        { value: "d", label: "No labels" },
        { value: "e", label: "Not sure" },
      ],
      section: "Campus conditions and convenience",
    },

    // SECTION 2 — ATTITUDES, NORMS AND REPORTED BEHAVIOUR
    {
      id: "q6",
      type: "single-choice",
      label:
        "How do you feel about students leaving litter in shared campus areas?",
      required: true,
      options: [
        { value: "a", label: "It is not a problem" },
        { value: "b", label: "I dislike it but it is common" },
        {
          value: "c",
          label: "I dislike it and think it should be addressed",
        },
      ],
      section: "Attitudes, norms and reported behaviour",
    },
    {
      id: "q7",
      type: "single-choice",
      label:
        "If the nearest bin is full, unclear or hard to find, what do you usually do?",
      required: true,
      options: [
        { value: "a", label: "Leave it near the nearest bin" },
        { value: "b", label: "Look for another bin" },
        { value: "c", label: "Keep it with me until I find a bin" },
        { value: "d", label: "Take it away with me" },
      ],
      section: "Attitudes, norms and reported behaviour",
    },
    {
      id: "q8",
      type: "single-choice",
      label:
        "How many of your classmates do you think dispose of their waste properly at PCTE?",
      required: true,
      options: [
        { value: "a", label: "Almost none" },
        { value: "b", label: "A minority" },
        { value: "c", label: "About half" },
        { value: "d", label: "A majority" },
        { value: "e", label: "Almost all" },
        { value: "f", label: "Not sure" },
      ],
      section: "Attitudes, norms and reported behaviour",
    },
    {
      id: "q9",
      type: "single-choice",
      label:
        "If you saw a classmate drop waste instead of using a bin, how likely are you to say something respectful?",
      required: true,
      options: [
        { value: "a", label: "Very unlikely" },
        { value: "b", label: "Unlikely" },
        { value: "c", label: "Unsure" },
        { value: "d", label: "Likely" },
        { value: "e", label: "Very likely" },
      ],
      section: "Attitudes, norms and reported behaviour",
    },

    // SECTION 3 — DO CAMPUS RULES AND MESSAGES REACH STUDENTS?
    {
      id: "q10",
      type: "single-choice",
      label:
        "Before this survey, did you know that PCTE imposes fines for littering and for chewing gum?",
      required: true,
      options: [
        { value: "a", label: "Yes, I knew about both" },
        { value: "b", label: "I knew about one of these, but not the other" },
        { value: "c", label: "No, I did not know about either" },
      ],
      section: "Do campus rules and messages reach students?",
    },
    {
      id: "q11",
      type: "single-choice",
      label:
        "Which best describes your experience of waste-management messages (posters, screens, social posts, events) at PCTE?",
      required: true,
      options: [
        { value: "a", label: "I have not noticed any" },
        {
          value: "b",
          label: "I noticed some, but cannot recall what they asked me to do",
        },
        { value: "c", label: "I recall a message and roughly what it asked" },
        {
          value: "d",
          label: "I recall a message and knew what to do and where",
        },
      ],
      section: "Do campus rules and messages reach students?",
    },
    {
      id: "q12",
      type: "single-choice",
      label:
        "How much practical guidance have you received at PCTE about reducing, separating or disposing of waste correctly?",
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
      section: "Do campus rules and messages reach students?",
    },
    {
      id: "q13",
      type: "single-choice",
      label:
        "How confident are you that you know how to separate common items (a plastic bottle, a clean cardboard box and food waste)?",
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
      section: "Do campus rules and messages reach students?",
    },

    // SECTION 4 — WHAT COULD HELP, AND WHAT TO TEST NEXT
    {
      id: "q15",
      type: "single-choice",
      label:
        "What, if anything, is the biggest obstacle to good waste management at PCTE?",
      required: true,
      options: [
        { value: "a", label: "Bins are missing, full or unclear" },
        { value: "b", label: "Students lack awareness or guidance" },
        { value: "c", label: "Poor habits / social norms" },
        { value: "d", label: "No single obstacle stands out" },
        { value: "e", label: "Not sure" },
      ],
      section: "What could help, and what to test next",
    },
    {
      id: "q16",
      type: "single-choice",
      label: "Which one change would most improve waste management for you?",
      required: true,
      options: [
        { value: "a", label: "Better bins, placement and labels" },
        { value: "b", label: "Clear, practical sorting guidance" },
        { value: "c", label: "Visible peer-led habits and activities" },
        { value: "d", label: "Stricter enforcement of the rules" },
      ],
      section: "What could help, and what to test next",
    },
    {
      id: "q17",
      type: "single-choice",
      label:
        "Where would you be most likely to notice and act on a waste-management message?",
      required: true,
      options: [
        { value: "a", label: "Short videos / social posts" },
        { value: "b", label: "Posters and signs near bins" },
        { value: "c", label: "Live demonstrations or events" },
        { value: "d", label: "Class announcements" },
      ],
      section: "What could help, and what to test next",
    },
    {
      id: "q18",
      type: "single-choice",
      label:
        "Which message would most encourage you to dispose of waste responsibly?",
      required: true,
      options: [
        { value: "a", label: "Keep campus clean for everyone" },
        { value: "b", label: "Here is exactly what goes where" },
        { value: "c", label: "Here are the rules and penalties" },
        { value: "d", label: "Your classmates are doing it" },
      ],
      section: "What could help, and what to test next",
    },
    {
      id: "q19",
      type: "single-choice",
      label: "Which of these would you actually consider doing?",
      required: true,
      options: [
        { value: "a", label: "Nothing at the moment" },
        { value: "b", label: "Share or repost a message" },
        { value: "c", label: "Join a short one-off campus activity" },
        { value: "d", label: "Help run an activity or team" },
      ],
      section: "What could help, and what to test next",
    },
  ],
};
