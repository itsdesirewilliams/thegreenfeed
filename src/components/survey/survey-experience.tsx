"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  CircleCheck,
  LoaderCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SurveyField } from "@/components/survey/survey-field";
import {
  SURVEY_CONSENT_ACCEPTED_VALUE,
  SURVEY_CONSENT_ID,
  SURVEY_CONSENT_OPTIONS,
  SURVEY_CONSENT_QUESTION,
  SURVEY_PROFILE_FIELDS,
  SURVEY_SECTIONS,
  surveyQuestions,
  type SurveyAnswerValue,
  type SurveyAnswers,
} from "@/data/survey-questions";
import { submitSurveyAnswers } from "@/lib/survey-submit";
import {
  getChosenOptionLabel,
  hasErrors,
  isEmptyAnswer,
  validateSurveyAnswers,
  validateSurveyProfile,
  type SurveyFieldErrors,
} from "@/lib/survey";
import { cn } from "@/lib/utils";

type Phase = "intro" | "profile" | "questions" | "success";

const TOTAL_QUESTIONS = surveyQuestions.length;

/**
 * One-question-at-a-time survey experience: introduction and consent,
 * respondent profile, then the 16 research questions with section labels,
 * progress, back/continue navigation, and a reviewable completion state.
 */
export function SurveyExperience() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [errors, setErrors] = useState<SurveyFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const stepRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Move assistive-technology focus to the current step when it changes.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    stepRef.current?.focus();
  }, [phase, index]);

  function setAnswer(id: string, value: SurveyAnswerValue) {
    setAnswers((previous) => ({ ...previous, [id]: value }));
    setErrors((previous) => {
      if (!previous[id]) return previous;
      const next = { ...previous };
      delete next[id];
      return next;
    });
  }

  const consentAccepted =
    answers[SURVEY_CONSENT_ID] === SURVEY_CONSENT_ACCEPTED_VALUE;
  const consentDeclined =
    answers[SURVEY_CONSENT_ID] === "b" || answers[SURVEY_CONSENT_ID] === "c";
  /**
   * The profile phase is skipped entirely while no profile fields are
   * configured. It returns automatically as soon as verified fields are
   * restored to SURVEY_PROFILE_FIELDS.
   */
  const hasProfileFields = SURVEY_PROFILE_FIELDS.length > 0;

  function handleStart() {
    if (!consentAccepted || submitting) return;
    setErrors({});
    setSubmitError(null);
    if (hasProfileFields) {
      setPhase("profile");
    } else {
      setIndex(0);
      setPhase("questions");
    }
  }

  function handleProfileContinue() {
    if (submitting) return;
    const profileErrors = validateSurveyProfile(SURVEY_PROFILE_FIELDS, answers);
    setErrors(profileErrors);
    if (hasErrors(profileErrors)) return;
    setSubmitError(null);
    setPhase("questions");
    setIndex(0);
  }

  function handleBack() {
    if (submitting) return;
    setSubmitError(null);
    if (phase === "questions") {
      if (index === 0) {
        if (hasProfileFields) setPhase("profile");
        else setPhase("intro");
      } else setIndex(index - 1);
    } else if (phase === "profile") {
      setPhase("intro");
    }
  }

  function handleContinue() {
    if (submitting) return;
    if (index < TOTAL_QUESTIONS - 1) {
      setIndex(index + 1);
      return;
    }
    void handleSubmit();
  }

  async function handleSubmit() {
    if (submitting) return;

    const questionErrors = validateSurveyAnswers(surveyQuestions, answers);
    const profileErrors = validateSurveyProfile(SURVEY_PROFILE_FIELDS, answers);
    const allErrors = { ...profileErrors, ...questionErrors };

    if (!consentAccepted) {
      setErrors(allErrors);
      setSubmitError(
        "Consent is required before your response can be submitted.",
      );
      return;
    }

    if (hasErrors(allErrors)) {
      setErrors(allErrors);
      setSubmitError("Some questions still need an answer.");
      const firstMissing = surveyQuestions.findIndex(
        (question) => allErrors[question.id],
      );
      if (firstMissing >= 0) setIndex(firstMissing);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // The client-side consent choice is "a" at this point. It is stored as
      // consent = true (the stored decision to participate); the database
      // schema is unchanged.
      // Success is shown only after the server confirms the insert.
      // The client-side consent choice is "a" at this point. It is stored as
      // consent = true (the stored decision to participate); the database
      // schema is unchanged. With no profile fields configured, `answers`
      // contains only research-answer keys and consent.
      // Success is shown only after the server confirms the insert.
      await submitSurveyAnswers({
        ...answers,
        [SURVEY_CONSENT_ID]: true,
      } satisfies SurveyAnswers);
      setPhase("success");
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : "Something went wrong and your response was not saved. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Intro + consent                                                        */
  /* ---------------------------------------------------------------------- */

  if (phase === "intro") {
    return (
      <div
        ref={stepRef}
        tabIndex={-1}
        className="flex flex-col gap-6 rounded-2xl bg-white p-6 ring-1 ring-forest/10 outline-none sm:p-8"
      >
        <div className="flex flex-col gap-3">
          <h2 className="text-title font-semibold text-forest">Before we begin</h2>
          <ul className="flex flex-col gap-3">
            {[
              "The survey asks about what you experience at PCTE, what information reaches you, and what changes could help. Responses support a student-focused public-relations campaign.",
              "Participation is voluntary, and you can close this page at any time before submitting.",
              "Responses are anonymous. Please do not include your name, roll number, phone number, or email address.",
              "It should take about 2–3 minutes; completion time will be validated by a pilot test.",
            ].map((point) => (
              <li key={point} className="flex gap-3 text-sm text-ink/80 sm:text-base">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-lime ring-1 ring-forest/20"
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <fieldset className="rounded-xl border border-hairline bg-cream px-4 py-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-forest">
          <legend className="px-1 text-sm font-semibold text-forest sm:text-base">
            {SURVEY_CONSENT_QUESTION}
          </legend>
          <RadioGroup
            value={typeof answers[SURVEY_CONSENT_ID] === "string"
              ? (answers[SURVEY_CONSENT_ID] as string)
              : ""}
            onValueChange={(next) => setAnswer(SURVEY_CONSENT_ID, String(next))}
            className="mt-3 flex flex-col gap-2.5"
          >
            {SURVEY_CONSENT_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="group/option flex cursor-pointer items-start gap-3 rounded-xl border border-hairline bg-white px-4 py-3 transition-colors hover:border-forest/50 hover:bg-secondary has-data-checked:border-forest has-data-checked:bg-lime/15"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-forest group-has-data-checked:bg-forest group-has-data-checked:text-lime"
                >
                  {option.value.toUpperCase()}
                </span>
                <RadioGroupItem value={option.value} className="sr-only" />
                <span className="text-sm text-ink sm:text-base">
                  {option.label}
                </span>
              </label>
            ))}
          </RadioGroup>
        </fieldset>

        {consentDeclined ? (
          <div
            role="status"
            className="rounded-xl bg-cream px-4 py-3 text-sm text-ink/80 ring-1 ring-hairline"
          >
            You chose not to participate or preferred not to answer. The survey
            ends here — nothing has been saved. If this was a mistake, you can
            change your selection above.
          </div>
        ) : null}

        <Button
          size="lg"
          className="h-11 w-full px-6 text-base sm:w-fit sm:self-start"
          onClick={handleStart}
          disabled={!consentAccepted}
        >
          Start the survey
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Respondent profile                                                     */
  /* ---------------------------------------------------------------------- */

  if (phase === "profile") {
    return (
      <div
        ref={stepRef}
        tabIndex={-1}
        className="flex flex-col gap-6 rounded-2xl bg-white p-6 ring-1 ring-forest/10 outline-none sm:p-8"
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-title font-semibold text-forest">
            A few details, no names
          </h2>
          <p className="text-sm text-muted-ink">
            These details help analyse responses by group. No names, roll
            numbers, or contact details are collected.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {SURVEY_PROFILE_FIELDS.map((field) => {
            const value = answers[field.id];
            const error = errors[field.id];
            const errorId = error ? `${field.id}-error` : undefined;
            const descriptionId = field.description
              ? `${field.id}-description`
              : undefined;

            return (
              <div key={field.id} className="flex flex-col gap-2">
                {field.type === "short-text" ? (
                  <>
                    <label
                      htmlFor={`${field.id}-input`}
                      className="text-sm font-medium text-forest"
                    >
                      {field.label}
                      {field.required ? (
                        <span className="ml-1 text-destructive" aria-hidden="true">
                          *
                        </span>
                      ) : (
                        <span className="ml-2 text-xs font-normal text-muted-ink">
                          Optional
                        </span>
                      )}
                    </label>
                    {field.description ? (
                      <p id={descriptionId} className="text-sm text-muted-ink">
                        {field.description}
                      </p>
                    ) : null}
                    <Input
                      id={`${field.id}-input`}
                      value={typeof value === "string" ? value : ""}
                      maxLength={field.maxLength}
                      placeholder={field.placeholder}
                      disabled={submitting}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={
                        errorId
                          ? `${descriptionId ? `${descriptionId} ` : ""}${errorId}`
                          : descriptionId
                      }
                      onChange={(event) =>
                        setAnswer(field.id, event.target.value)
                      }
                    />
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium text-forest">
                      {field.label}
                      {field.required ? (
                        <span className="ml-1 text-destructive" aria-hidden="true">
                          *
                        </span>
                      ) : (
                        <span className="ml-2 text-xs font-normal text-muted-ink">
                          Optional
                        </span>
                      )}
                    </span>
                    {field.description ? (
                      <p id={descriptionId} className="text-sm text-muted-ink">
                        {field.description}
                      </p>
                    ) : null}
                    <Select
                      items={field.options}
                      value={typeof value === "string" ? value : null}
                      disabled={submitting}
                      aria-invalid={error ? true : undefined}
                      onValueChange={(next) =>
                        setAnswer(field.id, next as string)
                      }
                    >
                      <SelectTrigger
                        aria-label={field.label}
                        aria-describedby={
                          errorId
                            ? `${descriptionId ? `${descriptionId} ` : ""}${errorId}`
                            : descriptionId
                        }
                        className="w-full"
                      >
                        <SelectValue
                          placeholder={
                            field.required ? "Select an option…" : "Optional — select…"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
                {error ? (
                  <p id={errorId} role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={submitting}
            className="h-11 px-5"
          >
            <ArrowLeft aria-hidden="true" />
            Back
          </Button>
          <Button
            onClick={handleProfileContinue}
            disabled={submitting}
            className="h-11 px-6"
          >
            Continue
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Completion state                                                       */
  /* ---------------------------------------------------------------------- */

  if (phase === "success") {
    return (
      <div
        ref={stepRef}
        tabIndex={-1}
        className="flex flex-col gap-6 rounded-2xl bg-white p-6 ring-1 ring-forest/10 outline-none sm:p-8"
      >
        <div className="flex flex-col gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-lime/25 text-forest">
            <CircleCheck className="size-6" aria-hidden="true" />
          </span>
          <h2 className="text-title font-semibold text-forest">
            Thank you — your response was recorded.
          </h2>
          <p className="text-sm text-ink/75 sm:text-base">
            Here is what you submitted. You can close this page now; nothing
            further is required.
          </p>
        </div>

        <div className="flex flex-col divide-y divide-hairline rounded-xl border border-hairline bg-cream">
          {surveyQuestions.map((question, questionIndex) => {
            const chosen = getChosenOptionLabel(question, answers);
            return (
              <div
                key={question.id}
                className="flex items-baseline gap-3 px-4 py-2.5 text-sm"
              >
                <span className="text-sm">
                  {String(questionIndex + 1).padStart(2, "0")}
                </span>
                <span className="text-ink">{chosen ?? "—"}</span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-ink">
          Your answers stay anonymous and are used only in aggregate analysis.
        </p>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* One question at a time                                                 */
  /* ---------------------------------------------------------------------- */

  const question = surveyQuestions[index];
  const sectionNumber =
    SURVEY_SECTIONS.findIndex((section) => section.title === question.section) + 1;
  const sectionSubtitle =
    SURVEY_SECTIONS.find((section) => section.title === question.section)
      ?.subtitle;
  const sectionTitle = question.section;
  const isLast = index === TOTAL_QUESTIONS - 1;
  const answered = !isEmptyAnswer(answers[question.id]);

  return (
    <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 ring-1 ring-forest/10 sm:p-8">
      <div
        ref={stepRef}
        tabIndex={-1}
        className="flex flex-col gap-3 outline-none"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-muted-ink">
            Section {sectionNumber} · {sectionTitle}
          </p>
          <p
            className="text-sm font-semibold text-forest"
            aria-live="polite"
          >
            Question {index + 1} of {TOTAL_QUESTIONS}
          </p>
        </div>
        {sectionSubtitle ? (
          <p className="text-xs text-muted-ink">{sectionSubtitle}</p>
        ) : null}
        <Progress
          value={index}
          max={TOTAL_QUESTIONS}
          aria-label={`Survey progress: question ${index + 1} of ${TOTAL_QUESTIONS}`}
        />
      </div>

      <SurveyField
        question={question}
        value={answers[question.id]}
        error={errors[question.id]}
        disabled={submitting}
        onChange={(value) => setAnswer(question.id, value)}
      />

      {submitError ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>We could not submit your response</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      <div
        className={cn(
          "flex items-center justify-between gap-3",
          submitting && "opacity-70",
        )}
      >
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={submitting}
          className="h-11 px-5"
        >
          <ArrowLeft aria-hidden="true" />
          Back
        </Button>
        <Button
          onClick={isLast ? () => void handleSubmit() : handleContinue}
          disabled={!answered || submitting}
          className="h-11 min-w-40 px-6"
        >
          {submitting ? (
            <>
              <LoaderCircle
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              Submitting…
            </>
          ) : isLast ? (
            "Submit response"
          ) : (
            <>
              Continue
              <ArrowRight aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
