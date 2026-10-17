-- TheGreenFeed — correct the survey_submissions schema_version default
--
-- The original table defaulted `schema_version` to 'v1', but v1 was never a
-- published instrument (the first shipped instrument was tagged v2). A row that
-- omits its version must never be recorded under an unsupported legacy tag, so
-- the default becomes the current instrument version, 'v4'.
--
-- Also removes two columns left over from an earlier revision (is_synthetic,
-- synthetic_batch_id) so the stored schema matches the application. Safe to run
-- more than once. It does not touch, rewrite, or delete any rows.

alter table public.survey_submissions
  alter column schema_version set default 'v4';

comment on column public.survey_submissions.schema_version is
  'Instrument version that produced the row. Current: v4. Frozen legacy: v3, v2 (same 16-question wording). v1 was never published and is treated as unsupported.';

alter table public.survey_submissions
  drop column if exists is_synthetic,
  drop column if exists synthetic_batch_id;

drop index if exists public.survey_submissions_is_synthetic_idx;
