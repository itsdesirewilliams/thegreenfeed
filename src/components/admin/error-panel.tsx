import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AdminDataError } from "@/lib/admin/data";

/** Renders a safe, non-leaking error for a failed admin data load. */
export function ErrorPanel({ error }: { error: unknown }) {
  const message =
    error instanceof AdminDataError
      ? error.message
      : "Something went wrong while loading this view. Please try again.";

  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertTitle>Could not load admin data</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
