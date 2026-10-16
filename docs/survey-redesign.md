# TheGreenFeed survey redesign — implemented (v4)

**Status: implemented. `v4` is the live instrument; `v2`/`v3` are frozen.**

This document was the Part A deliverable for the survey-redesign brief. It
reviewed the previously published 16-question instrument (now frozen as `v3`),
proposed a stronger versioned instrument (`v4`) and a matching deterministic
codebook, and gave a migration/compatibility plan. That plan has since been
implemented: `v4` lives in `src/data/survey/v4.ts`, its codebook in
`src/data/analysis-framework-v4.json`, and the analysis engine and admin panel
select the codebook by each row's `schema_version`. Rows collected under the old
wording remain interpretable via the frozen `v3` instrument.

The analysis codebook for the **previous** instrument is frozen alongside it in
`src/data/analysis-framework.json`; the live `v4` codebook is in
`src/data/analysis-framework-v4.json` (typed access via
`src/data/analysis-framework.ts`).

---

## 1. What was inspected

- `src/data/survey-questions.ts` — live instrument (`q1`–`q16`, `v3`).
- `src/data/analysis-framework.json` — existing deterministic analysis framework
  for `q1`–`q16`.
- `src/app/api/survey/route.ts`, `src/lib/survey.ts` — validation and storage.
- `supabase/migrations/20261015000000_create_survey_submissions.sql` — table
  (`answers jsonb`, `schema_version text`, `created_at`).
- `README.md`, consent copy, environment-variable handling.
- `TheGreenFeed_16_Question_Survey.md` (source questionnaire, v2).

Storage contract: each response is one row; research answers are keyed `q1`…`q16`
with codes `a`/`b`/`c`; `profile_full_name`, `profile_programme`,
`profile_phone`, `consent` accompany them. Responses are **identified /
confidential**, not anonymous.

---

## 2. Gaps found in the current instrument

| # | Where | Problem | Why it matters |
| - | ----- | ------- | -------------- |
| G1 | Q3 option A | Bundles two opposite behaviours: “Use the nearest bin **or** leave the waste nearby”. | A respondent who disposes correctly and one who litters produce the same code, so the answer cannot inform a decision. |
| G2 | Q11 option C | “Both seem manageable to me; neither stands out as the main obstacle” is double-barrelled and close to a non-answer. | Makes the “barrier” question hard to interpret and can absorb the largest share. |
| G3 | Q11–Q12–Q15 | Three separate questions all ask, in slightly different words, whether bins/labels, guidance or peer habits would help. | Duplicate preference questions inflate length without adding a distinct construct. |
| G4 | Q1/Q2 vs reality | Conditions (availability, overflow, labels, collection) are collapsed into one frequency + one location. | Cannot tell an infrastructure problem from a knowledge or norm problem — a core objective. |
| G5 | Q7/Q8 | Mix exposure and recall in one option set; no comprehension or actionability stage. | The communication funnel (noticed → recalled → understood → actionable → influence) cannot be read off. |
| G6 | Q4 | Measures response to peer littering but not the confidence/intention axis, and no perceived-peer-norm question exists. | Social norms are a key dimension and are currently missing. |
| G7 | Q6 | Repeats Q5’s awareness stem and mixes awareness with perceived influence. | Awareness and influence should be measured separately (the analysis JSON already warns about this). |
| G8 | Q10 | Measures **confidence**, not knowledge. | The brief asks to distinguish objective knowledge from confidence; confidence is not accuracy. |
| G9 | Q16 | “Might take part” collapses distinct low-effort participation types. | Interest cannot be turned into a concrete, testable pilot. |
| G10 | Whole instrument | No neutral “Not sure / Not applicable” where it is analytically justified. | Forces guesses on items some respondents genuinely cannot answer. |
| G11 | Q3/Q14/Q15 | Option wording can read as virtue-signalling (“keep the waste with me”). | Social-desirability bias inflates the “good” answers. |

**Facts that cannot be assumed and must be locally verified before `v4` ships:**
the exact fine amounts/rule wording (Q5/Q6), whether sorting knowledge items can
have a locally correct answer (new item, conditional), the names and cadence of
campus events/messages, and the actual collection/disposal streams.

---

## 3. Proposed `v4` questionnaire (18 items + 1 conditional knowledge item)

Design rules: neutral, mutually exclusive options; “Not sure” only where it is
analytically meaningful; one question per screen; codes stored as `a`/`b`/`c`…

### Section 1 — Campus conditions and convenience (5)

| ID | Construct | Proposed wording | Options (code = label) | Type | Req | Classification / dimension |
| -- | --------- | ---------------- | ---------------------- | ---- | --- | -------------------------- |
| q1 | Reported visibility of improper disposal | How often do you notice litter or waste disposed of improperly in the areas of PCTE you regularly use? | a = Never · b = Rarely · c = Sometimes · d = Often · e = Very often | single | Y | conditions (frequency) |
| q2 | Perceived hotspot | Where do you most often notice waste-management problems on campus? | a,b,c (canteens/indoor/outdoor) · d = Not sure | single | Y | conditions (location) |
| q3 | Bin **availability / access** | When you need to dispose of waste at PCTE, how often is a bin available and easy to reach? | a = Never · b = Rarely · c = Sometimes · d = Often · e = Always · f = Not sure | single | Y | infrastructure (access) |
| q4 | Bin **overflow / collection** | How often are the bins you use already full or clearly not emptied often enough? | a = Never · b = Rarely · c = Sometimes · d = Often · e = Always · f = Not sure | single | Y | infrastructure (capacity/collection) |
| q5 | Bin **labels / clarity** | Are the bin labels clear enough to know what goes where? | a = Clear everywhere · b = Clear in some places only · c = Not clear · d = No labels · e = Not sure | single | Y | infrastructure (labels) |

### Section 2 — Attitudes, norms and reported behaviour (4)

| ID | Construct | Proposed wording | Options | Type | Req | Classification |
| -- | --------- | ---------------- | ------- | ---- | --- | -------------- |
| q6 | Personal attitude to littering | How do you feel about students leaving litter in shared campus areas? | a = It is not a problem · b = I dislike it but it is common · c = I dislike it and think it should be addressed | single | Y | attitude (not behaviour) |
| q7 | Reported usual disposal behaviour | If the nearest bin is full, unclear or hard to find, what do you usually do? | a = Leave it near the nearest bin · b = Look for another bin · c = Keep it with me until I find a bin · d = Take it away with me | single | Y | **reported behaviour** (G1 fixed: no option mixes disposal and littering) |
| q8 | Perceived peer norm | How many of your classmates do you think dispose of their waste properly at PCTE? | a = Almost none · b = A minority · c = About half · d = A majority · e = Almost all · f = Not sure | single | Y | norm (perceived) |
| q9 | Confidence to intervene | If you saw a classmate drop waste instead of using a bin, how likely are you to say something respectful? | a = Very unlikely · b = Unlikely · c = Unsure · d = Likely · e = Very likely | single | Y | intention (self-reported) |

### Section 3 — Do campus rules and messages reach students? (4)

| ID | Construct | Proposed wording | Options | Type | Req | Classification |
| -- | --------- | ---------------- | ------- | ---- | --- | -------------- |
| q10 | Awareness of rules/penalties | Before this survey, did you know that PCTE imposes fines for littering and for chewing gum? | a,b,c (both / one / neither) | single | Y | awareness (retained from Q5) |
| q11 | Communication funnel (single scale) | Which best describes your experience of waste-management messages (posters, screens, social posts, events) at PCTE? | a = I have not noticed any · b = I noticed some, but cannot recall what they asked me to do · c = I recall a message and roughly what it asked · d = I recall a message and knew what to do and where | single | Y | funnel: exposure→recall→comprehension/actionability |
| q12 | Practical guidance received | How much practical guidance have you received at PCTE about reducing, separating or disposing of waste correctly? | a,b,c (little/none / some / enough) | single | Y | knowledge (self-reported) |
| q13 | Sorting confidence | How confident are you that you know how to separate common items (plastic bottle, clean cardboard, food waste)? | a,b,c (not / somewhat / confident) | single | Y | confidence (not knowledge) |

**Conditional / flagged item (do not ship until verified):**
`q14` *Sorting knowledge* — one or two items with a locally correct answer, e.g.
“Where should a clean plastic bottle go on campus?” Options must match PCTE’s
verified streams. **Ship only after the college confirms the actual system.**

### Section 4 — What could help, and what to test next (5)

| ID | Construct | Proposed wording | Options | Type | Req | Classification |
| -- | --------- | ---------------- | ------- | ---- | --- | -------------- |
| q15 | Perceived primary obstacle | What, if anything, is the biggest obstacle to good waste management at PCTE? | a = Bins are missing, full or unclear · b = Students lack awareness or guidance · c = Poor habits / social norms · d = No single obstacle stands out · e = Not sure | single | Y | (G2 fixed) |
| q16 | Preferred practical improvement (consolidated) | Which one change would most improve waste management for you? | a = Better bins, placement and labels · b = Clear, practical sorting guidance · c = Visible peer-led habits and activities · d = Stricter enforcement of the rules | single | Y | (G3 fixed: single consolidated preference) |
| q17 | Preferred channel | Where would you be most likely to notice and act on a waste-management message? | a = Short videos / social posts · b = Posters and signs near bins · c = Live demonstrations or events · d = Class announcements | single | Y | preference |
| q18 | Preferred message frame | Which message would most encourage you to dispose of waste responsibly? | a = “Keep campus clean for everyone” · b = “Here is exactly what goes where” · c = “Here are the rules and penalties” · d = “Your classmates are doing it” | single | Y | preference |
| q19 | Concrete participation | Which of these would you actually consider doing? | a = Nothing at the moment · b = Share or repost a message · c = Join a short one-off campus activity · d = Help run an activity or team | single | Y | **intention** (separate from sign-up) |

**Additional recommendation (not a survey item):** run a compact **on-ground
observation checklist** (bin presence, visibility, overflow, labels, collection)
at the top two perceived hotspots at busy and quiet times. This complements the
survey; the survey cannot substitute for it.

---

## 4. Change log

| v3 item | Action | v4 result |
| ------- | ------ | --------- |
| Q1 | Retained, extended to 5 points | q1 |
| Q2 | Retained, added “Not sure” | q2 |
| Q3 | **Replaced** (bundled option G1) | split into **behaviour** q7 + infrastructure items q3–q5 |
| Q4 | Reworded + rescaled | q9 (confidence/intention to intervene) |
| Q5 | Retained | q10 |
| Q6 | **Removed** (duplicated Q5, mixed constructs, G7) | awareness kept in q10 |
| Q7, Q8 | **Replaced** by a single funnel item (G5) | q11 |
| Q9 | Retained | q12 |
| Q10 | Retained as confidence | q13 |
| Q11 | Reworded; option C fixed (G2) | q15 |
| Q12, Q15 | **Merged** into one preference item (G3) | q16 |
| Q13 | Retained | q17 |
| Q14 | Retained | q18 |
| Q16 | Reworded into concrete participation choices (G9) | q19 |
| — | **Added** | q3, q4, q5 (infrastructure split), q6 (attitude), q8 (peer norm), q11 (funnel), q14 (knowledge, conditional) |

Retained codes: where wording is unchanged the stored code is unchanged
(e.g. q10 keeps `a`/`b`/`c`). New items use new codes as listed.

---

## 5. `v4` deterministic codebook (summary)

Dimensions stay separate; A/B/C are categorical, never summed.

1. **Conditions** — q1, q2
2. **Infrastructure & convenience** — q3, q4, q5
3. **Attitudes & social norms** — q6, q8
4. **Reported behaviour** — q7
5. **Rules & awareness** — q10
6. **Communication funnel** — q11
7. **Practical knowledge / confidence** — q12, q13 (and q14 only once verified)
8. **Intervention preferences** — q15, q16, q17, q18
9. **Student-led engagement (intention)** — q19 (sign-up/attendance collected
   separately, never inferred)
10. **Data quality & sample limits** — valid N, missingness, version, period,
    sample caveats.

New/changed cross-question checks for `v4`:

- Infrastructure vs knowledge: compare q3–q5 (infrastructure) with q12–q13
  (guidance/confidence) and q15 (perceived obstacle).
- Convenience barrier: q7 = *leave near bin* **and** q3/q4 = never/rarely
  available or often full (joint, not marginal).
- Norm gap: q8 (perceived minority) with q6 (disapproval) and q9 (intervene).
- Funnel reach: q11 distribution; treat each stage as respondent-reported.
- Messaging fit: q17 × q18 preference combination as a pilot hypothesis only.

All reporting rules from the existing framework carry over unchanged: show valid
N, counts and percentages; majority = strictly >50%; top-two within 10 pp =
close/mixed split; N < 10 = preliminary; suppress small programme groups; keep
names/phones out of aggregates.

---

## 6. Migration & compatibility plan (implemented)

1. **`v3` was frozen, not edited.** The old instrument now lives verbatim in
   `src/data/survey/v3.ts` and its wording is guarded by
   `scripts/verify-survey-wording.mjs`.
2. `v4` is a **new schema version** with its own `SURVEY_SCHEMA_VERSION` and its
   own codebook (`src/data/analysis-framework-v4.json`). `v2`/`v3` rows are
   interpreted with the frozen `v3` codebook; `v4` rows with the `v4` codebook.
   **Versions are never mixed in one distribution.**
3. The analysis engine (`src/lib/analysis.ts`) and admin pages select the
   codebook that matches the data via `getAnalysisFramework(version)`, and each
   page shows which version was analysed plus any excluded responses.
4. No database change was required: new items still live inside the `answers`
   JSONB.
5. Rollout as implemented:
   - `src/data/survey/v4.ts` (live) plus a `v4` codebook file;
   - `v2`/`v3` are still accepted, each row tagged by its declared version in
     `route.ts` and validated against that version's questions;
   - the survey UI renders `v4` through the `survey-questions.ts` facade.

**Outstanding local facts to confirm before the affected items can ship:** the
real bin/stream system (for `q14`, currently reserved and not shipped); fine
amounts and exact rule wording; campus event/message names and cadence. These
are flagged, not invented.

---

## 7. Trade-offs

- `v4` is slightly longer (18 vs 16 items) but removes three near-duplicate
  preference questions and adds the infrastructure and norms dimensions the
  objectives require.
- 5-point scales give more resolution but change comparability with `v3`; that is
  why `v4` is a new version rather than an edit.
- The objective knowledge item (q14) is deliberately conditional: without verified
  local facts it would create a wrong answer key.
