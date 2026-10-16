# Synthetic test data — import and removal

This document defines the **only** authorised way to create or remove synthetic
(clearly-faked) survey rows. Synthetic data exists to exercise the analysis
engine and admin views; it must never be presented as research findings.

## Guarantees

- **The public submission API cannot create synthetic rows.** `POST /api/survey`
  validates against an allow-list of keys (consent, profile fields, this
  version's question ids) and inserts only genuine rows. A client-supplied
  `is_synthetic` / `synthetic_batch_id` is rejected as an unknown key.
- **Synthetic rows are marked in the database.** `is_synthetic = true` plus a
  `synthetic_batch_id` group one import run. Genuine rows are `false` (the
  column default).
- **Research views and exports exclude synthetic rows.** The overview, question
  distributions, analysis, aggregate export and raw export all read
  `is_synthetic = false` only. Synthetic rows appear solely in the labelled
  admin **Testing** view.
- **A batch delete cannot touch genuine rows.** Removal filters on
  `is_synthetic = true` **and** the batch id, so it can only delete that
  synthetic batch.

## Prerequisite: apply the migration

Synthetic provenance requires the columns added by
`supabase/migrations/20261016000000_survey_provenance.sql`:

- `is_synthetic boolean not null default false`
- `synthetic_batch_id text`

Apply it through the authorised Supabase workflow (dashboard → SQL editor, or
`supabase db push`). Until it is applied, the Testing view reports that
provenance is not configured and no synthetic row can exist. Genuine collection
is unaffected either way.

## Expected record JSON shape

The import file is either a bare array of records or `{ "records": [ ... ] }`.
Each record has:

| Field | Required | Notes |
| ----- | -------- | ----- |
| `schemaVersion` | no | Defaults to `v4`. Must be a supported version (`v4`, `v3`, `v2`). |
| `createdAt` | no | ISO 8601 string. Omitted → the database default `now()`. Synthetic timestamps are accepted here only. |
| `answers` | yes | Object keyed by stable ids: `consent`, `profile_*`, and the question ids. |

Generate a canonical, valid example at any time:

```bash
node scripts/import-synthetic.mjs --print-example
```

It produces (all 18 v4 items, first option each):

```json
{
  "records": [
    {
      "schemaVersion": "v4",
      "createdAt": "2026-10-20T09:00:00.000Z",
      "answers": {
        "consent": true,
        "profile_full_name": "Test Student",
        "profile_programme": "computer-science-engineering",
        "profile_phone": "",
        "q1": "a", "q2": "a", "q3": "a", "q4": "a", "q5": "a",
        "q6": "a", "q7": "a", "q8": "a", "q9": "a",
        "q10": "a", "q11": "a", "q12": "a", "q13": "a",
        "q15": "a", "q16": "a", "q17": "a", "q18": "a", "q19": "a"
      }
    }
  ]
}
```

Rules enforced by the importer:

- `schemaVersion` must be supported; `answers` must be an object.
- `consent` must be `true`; every required profile field and required question
  must be present.
- Option values must exist in the instrument for the declared version.
- `profile_programme` must be a listed programme; `profile_phone` (if present)
  must look like a phone number.

The importer validates **every** record before inserting anything: if any record
fails, nothing is written.

## Import a batch

```bash
node scripts/import-synthetic.mjs --file test-data.json --batch demo-2026-10 --confirm
```

- `--confirm` is mandatory — the command refuses to write without it.
- Uses `SUPABASE_URL` + `SUPABASE_SECRET_KEY` from `.env.local` (never printed).
- Inserts in chunks of 100 and reports `Inserted N synthetic row(s)`.
- On any insert error it stops and reports how many rows were already inserted.

## Remove a batch

```bash
node scripts/import-synthetic.mjs --delete-batch demo-2026-10 --confirm
```

Deletes only rows where `is_synthetic = true` **and**
`synthetic_batch_id = demo-2026-10`.

## Verify

- Database: `node scripts/verify-survey-db.mjs` reports whether the provenance
  columns are present and the genuine/synthetic counts.
- Admin: `/admin/testing` lists synthetic batches and rows; the Overview,
  Questions and Analysis pages never include them.
