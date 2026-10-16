import { Mona_Sans } from "next/font/google";

/**
 * Mona Sans — the only typeface on the site. A variable font used for
 * everything: UI, body copy, and display headlines (via font weight and
 * tracking rather than a separate face).
 */
export const monaSans = Mona_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mona-sans",
});
