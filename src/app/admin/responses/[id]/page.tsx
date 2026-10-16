import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader, Panel } from "@/components/admin/bits";
import { ErrorPanel } from "@/components/admin/error-panel";
import { requireAdmin } from "@/lib/admin/auth";
import { getResponseById, programmeLabel } from "@/lib/admin/data";
import { load } from "@/lib/admin/load";
import {
  SURVEY_CONSENT_ID,
  SURVEY_PROFILE_FIELDS,
  getProfileFieldOptions,
  surveyQuestions,
} from "@/data/survey-questions";
import { formatDateTime } from "@/lib/admin/format";

export const instant = false;

export const metadata: Metadata = { title: "Response detail" };

function asText(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) return value;
  return null;
}

function optionLabel(questionId: string, value: unknown): string | null {
  const question = surveyQuestions.find((entry) => entry.id === questionId);
  const raw = asText(value);
  if (!raw) return null;
  const option = question?.options?.find((entry) => entry.value === raw);
  return option ? `${option.label} (${raw})` : raw;
}

export default async function AdminResponseDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await props.params;

  const result = await load(() => getResponseById(id));

  if (!result.ok) {
    return <ErrorPanel error={result.error} />;
  }

  const response = result.data;
  if (!response) {
    notFound();
  }

  const answers = response.answers;
  const name = asText(answers.profile_full_name);
  const programme = asText(answers.profile_programme);
  const phone = asText(answers.profile_phone);

  const programmeField = SURVEY_PROFILE_FIELDS.find(
    (field) => field.id === "profile_programme",
  );
  const programmeOptions = programmeField
    ? getProfileFieldOptions(programmeField)
    : [];

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Response detail"
        description={`Submitted ${formatDateTime(response.createdAt)} · schema ${response.schemaVersion}`}
        actions={
          <Link className="text-sm text-forest underline" href="/admin/responses">
            ← All responses
          </Link>
        }
      />

      <Alert variant="destructive">
        <ShieldAlert />
        <AlertTitle>Confidential — identifying data</AlertTitle>
        <AlertDescription>
          This response includes the respondent&rsquo;s name
          {phone ? ", phone number" : ""} and programme. Handle it in line with
          the consent statement and the project&rsquo;s data-protection rules.
        </AlertDescription>
      </Alert>

      <Panel title="Student details">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-ink uppercase">Full name</dt>
            <dd className="text-sm text-ink">{name ?? "Not provided"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-ink uppercase">
              Programme / course
            </dt>
            <dd className="text-sm text-ink">
              {programme
                ? (programmeOptions.find((o) => o.value === programme)?.label ??
                  programmeLabel(programme))
                : "Not provided"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-ink uppercase">Phone</dt>
            <dd className="text-sm text-ink">{phone ?? "Not provided"}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted-ink">
          Consent recorded: {answers[SURVEY_CONSENT_ID] === true ? "yes" : "no"}
        </p>
      </Panel>

      <Panel title="Answers">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Recorded answers for this response</caption>
            <thead>
              <tr className="border-b border-hairline text-left text-muted-ink">
                <th scope="col" className="py-2 pr-3 font-medium">
                  #
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Question
                </th>
                <th scope="col" className="py-2 font-medium">
                  Answer
                </th>
              </tr>
            </thead>
            <tbody>
              {surveyQuestions.map((question) => {
                const answer = optionLabel(question.id, answers[question.id]);
                return (
                  <tr
                    key={question.id}
                    className="border-b border-hairline/60 align-top"
                  >
                    <td className="py-2 pr-3 font-mono text-xs text-muted-ink">
                      {question.id}
                    </td>
                    <td className="py-2 pr-3 text-ink">{question.label}</td>
                    <td className="py-2">
                      {answer ?? <Badge variant="outline">No answer</Badge>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
