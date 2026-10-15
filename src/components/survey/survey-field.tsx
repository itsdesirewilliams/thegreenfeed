"use client";

import type { SurveyAnswerValue, SurveyQuestion } from "@/data/survey-questions";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function SurveyField({
  question,
  value,
  error,
  disabled,
  onChange,
}: {
  question: SurveyQuestion;
  value: SurveyAnswerValue | undefined;
  error?: string;
  disabled?: boolean;
  onChange: (value: SurveyAnswerValue) => void;
}) {
  const descriptionId = question.description
    ? `${question.id}-description`
    : undefined;
  const errorId = error ? `${question.id}-error` : undefined;
  const describedBy = errorId ?? descriptionId;

  const stringValue = typeof value === "string" ? value : "";
  const arrayValue = Array.isArray(value) ? value : [];

  return (
    <fieldset
      id={`question-${question.id}`}
      tabIndex={-1}
      className="flex flex-col gap-3 outline-none"
    >
      <legend className="font-serif text-2xl leading-snug text-forest">
        {question.label}
        {question.required ? (
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-2 align-middle font-sans text-xs font-normal text-muted-ink">
            Optional
          </span>
        )}
      </legend>

      {question.description ? (
        <p id={descriptionId} className="-mt-1 text-sm text-muted-ink">
          {question.description}
        </p>
      ) : null}

      {question.type === "short-text" ? (
        <Input
          id={`${question.id}-input`}
          value={stringValue}
          maxLength={question.maxLength}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}

      {question.type === "long-text" ? (
        <Textarea
          id={`${question.id}-input`}
          value={stringValue}
          maxLength={question.maxLength}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}

      {question.type === "single-choice" && question.options ? (
        <RadioGroup
          value={stringValue}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onValueChange={(next) => onChange(String(next))}
          className="flex flex-col gap-2.5"
        >
          {question.options.map((option) => (
            <label
              key={option.value}
              className={cn(
                "group/option flex cursor-pointer items-start gap-3 rounded-xl border border-hairline bg-white px-4 py-4 transition-colors hover:border-forest/50 hover:bg-secondary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-forest has-data-checked:border-forest has-data-checked:bg-lime/15",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              {option.value.length === 1 ? (
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary font-sans text-xs font-semibold text-forest group-has-data-checked:bg-forest group-has-data-checked:text-lime"
                >
                  {option.value.toUpperCase()}
                </span>
              ) : null}
              <RadioGroupItem
                value={option.value}
                disabled={disabled}
                className="sr-only"
              />
              <span className="text-base text-ink">{option.label}</span>
            </label>
          ))}
        </RadioGroup>
      ) : null}

      {question.type === "multiple-choice" && question.options ? (
        <div className="flex flex-col gap-2">
          {question.options.map((option) => {
            const checked = arrayValue.includes(option.value);
            return (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border border-hairline bg-white px-3 py-2.5 text-sm transition-colors hover:bg-secondary",
                  disabled && "cursor-not-allowed opacity-60",
                )}
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(nextChecked) => {
                    if (nextChecked) {
                      onChange([...arrayValue, option.value]);
                    } else {
                      onChange(
                        arrayValue.filter((item) => item !== option.value),
                      );
                    }
                  }}
                />
                <span className="text-ink">{option.label}</span>
              </label>
            );
          })}
        </div>
      ) : null}

      {question.type === "yes-no" ? (
        <RadioGroup
          value={value === true ? "yes" : value === false ? "no" : ""}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onValueChange={(next) => onChange(next === "yes")}
        >
          {[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ].map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border border-hairline bg-white px-3 py-2.5 text-sm transition-colors hover:bg-secondary",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <RadioGroupItem value={option.value} disabled={disabled} />
              <span className="text-ink">{option.label}</span>
            </label>
          ))}
        </RadioGroup>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
