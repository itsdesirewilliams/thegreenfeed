/**
 * Synthetic-data provenance (shared constants).
 *
 * Synthetic test rows exist to exercise the analysis and admin views. They must
 * always be distinguishable from genuine submissions:
 *
 * - `is_synthetic` (boolean, NOT NULL, default `false`) — the provenance marker.
 * - `synthetic_batch_id` (text, nullable) — groups one import run so a batch can
 *   be inspected or removed together.
 *
 * The public submission API (`POST /api/survey`) never sets either field: it
 * only ever inserts genuine rows and the database default records `false`. The
 * only writer allowed to set them is the authorised import script
 * (`scripts/import-synthetic.mjs`) using the server-only secret key.
 *
 * Synthetic rows ARE included in the overview, question distributions, analysis
 * and both research exports (see `fetchAllRows` in `src/lib/admin/data.ts`), so
 * the combined dataset can be exercised end to end. They stay distinguishable:
 * every admin view and export labels provenance, and the aggregate export
 * reports genuine vs synthetic counts so synthetic rows are never presented as
 * real participants. The labelled admin testing view remains the place to
 * inspect and remove a synthetic batch.
 */

export const SYNTHETIC_COLUMN = "is_synthetic";
export const SYNTHETIC_BATCH_COLUMN = "synthetic_batch_id";

/** Human-facing label used wherever synthetic data is shown. */
export const SYNTHETIC_LABEL = "Synthetic test data";

export const SYNTHETIC_INCLUDED_NOTE =
  "Synthetic test rows are included in the overview, question distributions, analysis, and both aggregate and raw research exports, and are labelled by provenance so they can be told apart from genuine submissions.";
