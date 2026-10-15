import { Instrument_Serif, Manrope } from "next/font/google";

/**
 * Instrument Serif — editorial display headlines and selected pull quotes.
 * Not a variable font, so the weight is specified explicitly.
 */
export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-instrument-serif",
});

/**
 * Manrope — the default UI and body typeface (navigation, copy, labels, forms).
 */
export const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});
