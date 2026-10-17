/**
 * Minimal ESM loader used only by `scripts/verify-analysis-provenance.mjs`.
 *
 * `src/lib/analysis.ts` imports through the `@/` path alias, which plain Node
 * cannot resolve (see the note in `scripts/verify-survey-consistency.mjs`).
 * This loader maps `@/…` to `src/…`, adds the extensions Node's type stripping
 * needs for extensionless relative imports, and serves the JSON codebooks as
 * modules. It reads local source files only — no network, no database — and is
 * not part of the production build.
 */
import { pathToFileURL, fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";

const SRC_DIR = new URL("../src/", import.meta.url);
const EXTS = [".ts", ".tsx", ".js", ".mjs", ".cjs"];

function firstExisting(basePath) {
  for (const ext of EXTS) {
    if (existsSync(basePath + ext)) return basePath + ext;
  }
  return existsSync(basePath) ? basePath : null;
}

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const base = fileURLToPath(new URL(specifier.slice(2), SRC_DIR));
    const found = firstExisting(base) ?? base + ".ts";
    return { url: pathToFileURL(found).href, shortCircuit: true };
  }
  if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    const resolvedPath = fileURLToPath(new URL(specifier, context.parentURL));
    if (resolvedPath.endsWith(".json")) {
      return {
        url: "tgf-json:" + encodeURIComponent(resolvedPath),
        shortCircuit: true,
      };
    }
    if (!/\.(ts|tsx|js|mjs|cjs)$/.test(resolvedPath)) {
      const found = firstExisting(resolvedPath);
      if (found) return { url: pathToFileURL(found).href, shortCircuit: true };
    }
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.startsWith("tgf-json:")) {
    const file = decodeURIComponent(url.slice("tgf-json:".length));
    return {
      format: "module",
      source: `export default ${readFileSync(file, "utf8")};`,
      shortCircuit: true,
    };
  }
  return next(url, context);
}
