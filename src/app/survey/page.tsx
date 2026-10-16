import type { Metadata } from "next";
import { Info } from "lucide-react";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SurveyExperience } from "@/components/survey/survey-experience";
import { SURVEY_PUBLISHED, surveyQuestions } from "@/data/survey-questions";

export const metadata: Metadata = {
  title: "Survey",
  description:
    "A short, anonymous research survey about waste management at PCTE. Your responses will inform academic PR research and campaign planning.",
};

export default function SurveyPage() {
  const published = SURVEY_PUBLISHED && surveyQuestions.length > 0;

  /**
   * Development-only preview so the complete flow can be tested locally
   * without publishing the survey. In production builds this is always false,
   * so the survey cannot accept public submissions while unpublished.
   */
  const devPreview =
    process.env.NODE_ENV !== "production" &&
    process.env.SURVEY_DEV_PREVIEW === "1";

  return (
    <main id="main" className="flex flex-1 flex-col bg-cream">
      <Container className="max-w-3xl py-14 sm:py-16">
        <SectionHeading
          title="Help us understand waste habits."
          description="A short, anonymous survey about waste management at PCTE — your experiences, what reaches you, and what would help."
        />

        <div className="mt-10">
          {published || devPreview ? (
            <SurveyExperience />
          ) : (
            <Alert className="border-hairline bg-white">
              <Info />
              <AlertTitle>The survey is not open yet</AlertTitle>
              <AlertDescription>
                The questions are ready, but the research team is completing
                final checks before launch. No responses are being collected
                yet — the survey will open here once publication is approved.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Container>
    </main>
  );
}
