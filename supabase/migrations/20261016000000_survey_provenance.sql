-- TheGreenFeed — survey provenance + correct schema_version default
--
-- Two changes, both non-destructive and idempotent:
--
-- 1. Adds an explicit provenance marker for synthetic test rows so they can be
--    excluded from every research view and export, and grouped/removed per
--    import run.
-- 2. Corrects the `schema_version` default. The original migration defaulted to
--    'v1', but v1 was never a published instrument — the first shipped
--    instrument was tagged v2. A row that omits its version must never be
--    recorded under an unsupported legacy tag, so the default becomes the
--    current instrument version, 'v4'.
--
-- Safe to run more than once. It does not touch, rewrite, or delete any rows.

-- 1. Provenance columns ------------------------------------------------------
alter table public.survey_submissions
  add column if not exists is_synthetic boolean not null default false,
  add column if not exists synthetic_batch_id text;

comment on column public.survey_submissions.is_synthetic is
  'Provenance marker. false = genuine submission (the default, and the only value the public /api/survey route can produce). true = synthetic test row, writable only through the authorised import script.';

comment on column public.survey_submissions.synthetic_batch_id is
  'Groups one synthetic import run so the batch can be inspected or removed together. NULL for genuine rows and for ungrouped synthetic rows.';

-- Index so the genuine-only filter used by analysis and exports stays cheap.
create index if not exists survey_submissions_is_synthetic_idx
  on public.survey_submissions (is_synthetic);

-- 2. Correct the schema_version default --------------------------------------
alter table public.survey_submissions
  alter column schema_version set default 'v4';

comment on column public.survey_submissions.schema_version is
  'Instrument version that produced the row. Current: v4. Frozen legacy: v3, v2 (same 16-question wording). v1 was never published and is treated as unsupported.';
