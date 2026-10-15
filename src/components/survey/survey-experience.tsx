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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SurveyField } from "@/components/survey/survey-field";
import {
  SURVEY_CONSENT_ID,
  SURVEY_CONSENT_LABEL,
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

  const consentGiven = answers[SURVEY_CONSENT_ID] === true;

  function handleStart() {
    if (!consentGiven || submitting) return;
    setErrors({});
    setSubmitError(null);
    setPhase("profile");
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
      if (index === 0) setPhase("profile");
      else setIndex(index - 1);
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

    if (answers[SURVEY_CONSENT_ID] !== true) {
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
      // Success is shown only after the server confirms the insert.
      await submitSurveyAnswers(answers);
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
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-ink uppercase">
            TheGreenFeed research survey
          </p>
          <h2 className="font-serif text-title text-forest">Before we begin</h2>
          <ul className="flex flex-col gap-3">
            {[
              "The purpose is to understand PCTE students' experiences with campus waste management and existing awareness efforts.",
              "Participation is voluntary, and you can close this page at any time before submitting.",
              "Responses are anonymous and will be used for academic PR research and campaign planning.",
              "Please answer based on your experiences before taking this survey.",
              "It should take about 2–3 minutes, subject to pilot testing.",
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

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-hairline bg-cream px-4 py-4 transition-colors hover:bg-secondary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-forest">
          <Checkbox
            checked={consentGiven}
            disabled={submitting}
            className="mt-0.5"
            onCheckedChange={(checked) =>
              setAnswer(SURVEY_CONSENT_ID, checked === true)
            }
          />
          <span className="text-sm text-ink sm:text-base">
            {SURVEY_CONSENT_LABEL}
          </span>
        </label>

        <Button
          size="lg"
          className="h-11 w-full px-6 text-base sm:w-fit sm:self-start"
          onClick={handleStart}
          disabled={!consentGiven}
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
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-ink uppercase">
            About you
          </p>
          <h2 className="font-serif text-title text-forest">
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
          <h2 className="font-serif text-title text-forest">
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
                <span className="shrink-0 font-sans text-xs font-semibold text-muted-ink">
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
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-ink uppercase">
            Section {sectionNumber} · {sectionTitle}
          </p>
          <p
            className="text-xs font-semibold tracking-[0.2em] text-forest uppercase"
            aria-live="polite"
          >
            Question {String(index + 1).padStart(2, "0")} of {TOTAL_QUESTIONS}
          </p>
        </div>
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
