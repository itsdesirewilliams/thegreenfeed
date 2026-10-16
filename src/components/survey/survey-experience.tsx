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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SurveyField } from "@/components/survey/survey-field";
import {
  SURVEY_CONSENT_ID,
  SURVEY_CONSENT_STATEMENT,
  SURVEY_PROFILE_FIELDS,
  SURVEY_SECTIONS,
  getProfileFieldOptions,
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

type Phase = "details" | "questions" | "success";

const TOTAL_QUESTIONS = surveyQuestions.length;

/**
 * Survey experience: a single student-details screen (full name, course,
 * optional phone number, required consent checkbox) followed by the 16 research
 * questions one at a time, with section labels, progress, back/continue
 * navigation, and a reviewable completion state.
 */
export function SurveyExperience() {
  const [phase, setPhase] = useState<Phase>("details");
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

  const consentAccepted = answers[SURVEY_CONSENT_ID] === true;

  function handleDetailsContinue() {
    if (submitting) return;
    const detailsErrors = validateSurveyProfile(SURVEY_PROFILE_FIELDS, answers);
    if (!consentAccepted) {
      detailsErrors[SURVEY_CONSENT_ID] =
        "Please tick the consent box to continue.";
    }
    setErrors(detailsErrors);
    if (hasErrors(detailsErrors)) return;
    setSubmitError(null);
    setPhase("questions");
    setIndex(0);
  }

  function handleBack() {
    if (submitting) return;
    setSubmitError(null);
    if (phase === "questions") {
      if (index === 0) {
        setPhase("details");
      } else {
        setIndex(index - 1);
      }
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
    const detailsErrors = validateSurveyProfile(SURVEY_PROFILE_FIELDS, answers);
    const allErrors = { ...detailsErrors, ...questionErrors };

    if (!consentAccepted) {
      setErrors({ ...allErrors, [SURVEY_CONSENT_ID]: "Consent is required." });
      setSubmitError(
        "Consent is required before your response can be submitted.",
      );
      setPhase("details");
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
      // The consent checkbox is stored as the boolean decision to participate;
      // the name, course and optional phone number ride along in `answers`.
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
  /* Student details + consent                                              */
  /* ---------------------------------------------------------------------- */

  if (phase === "details") {
    const consentError = errors[SURVEY_CONSENT_ID];

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
              "This survey asks what you experience at PCTE, what information reaches you, and what changes could help. Responses support a student-focused public-relations campaign.",
              "We ask for your full name, your course, and an optional phone number. Your responses are not anonymous — these details are stored alongside your answers and used only for TheGreenFeed's waste-management project at PCTE.",
              "Participation is voluntary; you can close this page at any time before you submit.",
              "It should take about 2–3 minutes.",
            ].map((point) => (
              <li
                key={point}
                className="flex gap-3 text-sm text-ink/80 sm:text-base"
              >
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-lime ring-1 ring-forest/20"
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-5">
          {SURVEY_PROFILE_FIELDS.map((field) => {
            const value = answers[field.id];
            const error = errors[field.id];
            const fieldOptions = getProfileFieldOptions(field);
            const errorId = error ? `${field.id}-error` : undefined;
            const descriptionId = field.description
              ? `${field.id}-description`
              : undefined;
            const describedBy = errorId
              ? descriptionId
                ? `${descriptionId} ${errorId}`
                : errorId
              : descriptionId;

            const labelContent = (
              <>
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
              </>
            );

            return (
              <div key={field.id} className="flex flex-col gap-2">
                {field.type === "select" ? (
                  <>
                    <span className="text-sm font-medium text-forest">
                      {labelContent}
                    </span>
                    {field.description ? (
                      <p id={descriptionId} className="text-sm text-muted-ink">
                        {field.description}
                      </p>
                    ) : null}
                    <Select
                      items={fieldOptions}
                      value={typeof value === "string" ? value : null}
                      disabled={submitting}
                      aria-invalid={error ? true : undefined}
                      onValueChange={(next) =>
                        setAnswer(field.id, next as string)
                      }
                    >
                      <SelectTrigger
                        aria-label={field.label}
                        aria-describedby={describedBy}
                        className="w-full"
                      >
                        <SelectValue
                          placeholder={
                            field.required
                              ? "Select an option…"
                              : "Optional — select…"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {field.groups
                          ? field.groups.map((group) => (
                              <SelectGroup key={group.label}>
                                <SelectLabel>{group.label}</SelectLabel>
                                {group.options.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ))
                          : fieldOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <>
                    <label
                      htmlFor={`${field.id}-input`}
                      className="text-sm font-medium text-forest"
                    >
                      {labelContent}
                    </label>
                    {field.description ? (
                      <p id={descriptionId} className="text-sm text-muted-ink">
                        {field.description}
                      </p>
                    ) : null}
                    <Input
                      id={`${field.id}-input`}
                      type={field.type === "tel" ? "tel" : "text"}
                      inputMode={field.type === "tel" ? "tel" : undefined}
                      value={typeof value === "string" ? value : ""}
                      maxLength={field.maxLength}
                      placeholder={field.placeholder}
                      disabled={submitting}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={describedBy}
                      onChange={(event) =>
                        setAnswer(field.id, event.target.value)
                      }
                    />
                  </>
                )}
                {error ? (
                  <p
                    id={errorId}
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {error}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        <fieldset className="rounded-xl border border-hairline bg-cream px-4 py-4">
          <legend className="sr-only">Consent</legend>
          <label className="flex cursor-pointer items-start gap-3">
            <Checkbox
              checked={consentAccepted}
              disabled={submitting}
              aria-invalid={consentError ? true : undefined}
              aria-describedby={
                consentError ? `${SURVEY_CONSENT_ID}-error` : undefined
              }
              onCheckedChange={(next) =>
                setAnswer(SURVEY_CONSENT_ID, next === true)
              }
              className="mt-0.5"
            />
            <span className="text-sm text-ink sm:text-base">
              {SURVEY_CONSENT_STATEMENT}
            </span>
          </label>
          {consentError ? (
            <p
              id={`${SURVEY_CONSENT_ID}-error`}
              role="alert"
              className="mt-2 text-sm text-destructive"
            >
              {consentError}
            </p>
          ) : null}
        </fieldset>

        <Button
          size="lg"
          className="h-11 w-full px-6 text-base sm:w-fit sm:self-start"
          onClick={handleDetailsContinue}
          disabled={submitting}
        >
          Continue to Survey
          <ArrowRight aria-hidden="true" />
        </Button>
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
          Your response, and the details you provided, are stored securely and
          used only for TheGreenFeed&apos;s waste-management project at PCTE.
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
  const sectionSubtitle = SURVEY_SECTIONS.find(
    (section) => section.title === question.section,
  )?.subtitle;
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
          <p className="text-sm font-semibold text-forest" aria-live="polite">
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
