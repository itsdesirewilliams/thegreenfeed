import type { Metadata } from "next";
import { monaSans } from "@/lib/fonts";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TheGreenFeed — Less Waste. More Impact.",
    template: "%s · TheGreenFeed",
  },
  description:
    "TheGreenFeed makes waste-management knowledge easier to understand and put into practice. Learn to reduce, reuse, recycle, and keep your campus and community cleaner.",
  openGraph: {
    type: "website",
    title: "TheGreenFeed — Less Waste. More Impact.",
    description:
      "Practical waste-management guidance for students and communities, from Hannah Lepathy and TheGreenFeed.",
    siteName: "TheGreenFeed",
  },
  twitter: {
    card: "summary_large_image",
    title: "TheGreenFeed — Less Waste. More Impact.",
    description:
      "Practical waste-management guidance for students and communities.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${monaSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-forest focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
