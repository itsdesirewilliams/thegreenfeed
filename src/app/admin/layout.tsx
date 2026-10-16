import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { Container } from "@/components/site/container";
import { logoutAction } from "@/app/admin/actions";

/**
 * Admin section chrome. `instant = false` opts this segment out of Cache
 * Components instant-navigation validation: every admin page reads the session
 * cookie at request time and must block on the server (it is never cached).
 */
export const instant = false;

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s · TheGreenFeed Admin",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main" className="flex flex-1 flex-col bg-cream">
      <div className="border-b border-hairline bg-white">
        <Container className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
          <Link
            href="/admin"
            className="mr-auto font-semibold text-forest hover:underline"
          >
            TheGreenFeed · Admin
          </Link>
          <AdminNav />
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md border border-hairline px-2.5 py-1.5 text-sm font-medium text-muted-ink hover:bg-secondary hover:text-forest"
            >
              Sign out
            </button>
          </form>
        </Container>
      </div>
      <Container className="flex flex-1 flex-col gap-6 py-8">{children}</Container>
    </main>
  );
}
