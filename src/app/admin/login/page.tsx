import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoginForm } from "@/components/admin/login-form";
import { hasAdminSession, isAdminConfigured } from "@/lib/admin/auth";

export const instant = false;

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage() {
  if (await hasAdminSession()) {
    redirect("/admin");
  }

  const configured = isAdminConfigured();

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 ring-1 ring-forest/10 sm:p-8">
      <h1 className="text-xl font-semibold text-forest">Admin sign in</h1>
      <p className="mt-2 mb-6 text-sm text-muted-ink">
        This area holds confidential survey responses, including names and
        programme details. Access is restricted to the project owner.
      </p>

      {configured ? (
        <LoginForm />
      ) : (
        <Alert>
          <Info />
          <AlertTitle>Sign-in is not configured</AlertTitle>
          <AlertDescription>
            Set <code>ADMIN_SESSION_SECRET</code> and either{" "}
            <code>ADMIN_PASSWORD_HASH</code> or <code>ADMIN_PASSWORD</code> in
            the deployment environment, then redeploy. See the README
            (&ldquo;Admin panel&rdquo;).
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
