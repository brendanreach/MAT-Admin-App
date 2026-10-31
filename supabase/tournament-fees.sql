-- ============================================================
-- MAT Admin App
-- Tournament Fee Information
--
-- Purpose:
-- Adds a spectator fee and a fee notes field to tournaments so
-- athletes and parents can see what a tournament will cost.
-- These fees are paid directly to the tournament organizer;
-- MAT does not collect them, so they are informational only.
--
-- Run once in the Supabase SQL editor. The whole script runs
-- in one transaction, so if any step fails nothing is changed.
--
-- Notes:
-- - The existing tournament_entries.has_paid column is left in
--   place so no historical data is lost. The app no longer
--   reads or changes it.
-- - Existing row-level security on public.tournaments already
--   covers the new columns; no policy changes are needed.
-- ============================================================

begin;

alter table public.tournaments
    add column if not exists spectator_fee numeric(10, 2),
    add column if not exists fee_notes text;

alter table public.tournaments
    drop constraint if exists tournaments_spectator_fee_check;

alter table public.tournaments
    add constraint tournaments_spectator_fee_check
    check (spectator_fee is null or spectator_fee >= 0);

comment on column public.tournaments.entry_fee is
    'Informational. Per-athlete entry fee paid to the tournament organizer, not to MAT.';

comment on column public.tournaments.spectator_fee is
    'Informational. Spectator admission fee paid to the tournament organizer, not to MAT.';

comment on column public.tournaments.fee_notes is
    'Optional details about tournament costs, such as where to pay or per-event pricing.';

-- Refresh the API schema cache so the app can use the new columns right away.
notify pgrst, 'reload schema';

commit;
