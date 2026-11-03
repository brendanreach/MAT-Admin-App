-- ============================================================
-- MAT Admin App
-- Coach Access
--
-- Purpose:
-- Gives accounts with the "coach" role what the coach view in
-- the app needs:
-- - Read the full roster (public.members).
-- - Add and edit tournaments (no deleting tournaments).
-- - See everyone's tournament entries and results, and add,
--   change or remove them, the same as admins.
-- - Upload, replace and remove tournament posters.
--
-- Run once in the Supabase SQL editor, after
-- tournament-posters.sql. Safe to re-run. The whole script
-- runs in one transaction, so if any step fails nothing is
-- changed.
--
-- Security notes:
-- - These policies only ADD access for coaches. Existing admin
--   and athlete policies are not changed.
-- - Coaches get no access to member_private_details,
--   financial tables, account roles or carousel slides.
-- ============================================================

begin;


-- ============================================================
-- 0. SANITY CHECK
-- Fails early if the existing admin helper is missing.
-- ============================================================

do $$
begin
    perform public.is_admin();
end
$$;


-- ============================================================
-- 1. COACH HELPER
-- ============================================================

create or replace function public.is_coach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.account_profiles p
        cross join lateral unnest(p.roles) as r(role)
        where p.id = auth.uid()
          and lower(trim(r.role)) = 'coach'
    );
$$;

revoke all on function public.is_coach() from public, anon;
grant execute on function public.is_coach() to authenticated;


-- ============================================================
-- 2. ROSTER (read only)
-- ============================================================

drop policy if exists "members_coach_select" on public.members;

create policy "members_coach_select"
    on public.members
    for select
    to authenticated
    using (public.is_coach());


-- ============================================================
-- 3. TOURNAMENTS (read, add, edit - no delete)
-- ============================================================

drop policy if exists "tournaments_coach_select" on public.tournaments;
drop policy if exists "tournaments_coach_insert" on public.tournaments;
drop policy if exists "tournaments_coach_update" on public.tournaments;

create policy "tournaments_coach_select"
    on public.tournaments
    for select
    to authenticated
    using (public.is_coach());

create policy "tournaments_coach_insert"
    on public.tournaments
    for insert
    to authenticated
    with check (public.is_coach());

create policy "tournaments_coach_update"
    on public.tournaments
    for update
    to authenticated
    using (public.is_coach())
    with check (public.is_coach());


-- ============================================================
-- 4. TOURNAMENT ENTRIES (full control, like admins)
-- ============================================================

drop policy if exists "tournament_entries_coach_select" on public.tournament_entries;
drop policy if exists "tournament_entries_coach_insert" on public.tournament_entries;
drop policy if exists "tournament_entries_coach_update" on public.tournament_entries;
drop policy if exists "tournament_entries_coach_delete" on public.tournament_entries;

create policy "tournament_entries_coach_select"
    on public.tournament_entries
    for select
    to authenticated
    using (public.is_coach());

create policy "tournament_entries_coach_insert"
    on public.tournament_entries
    for insert
    to authenticated
    with check (public.is_coach());

create policy "tournament_entries_coach_update"
    on public.tournament_entries
    for update
    to authenticated
    using (public.is_coach())
    with check (public.is_coach());

create policy "tournament_entries_coach_delete"
    on public.tournament_entries
    for delete
    to authenticated
    using (public.is_coach());


-- ============================================================
-- 5. TOURNAMENT RESULTS (full control, like admins)
-- ============================================================

drop policy if exists "tournament_results_coach_select" on public.tournament_results;
drop policy if exists "tournament_results_coach_insert" on public.tournament_results;
drop policy if exists "tournament_results_coach_update" on public.tournament_results;
drop policy if exists "tournament_results_coach_delete" on public.tournament_results;

create policy "tournament_results_coach_select"
    on public.tournament_results
    for select
    to authenticated
    using (public.is_coach());

create policy "tournament_results_coach_insert"
    on public.tournament_results
    for insert
    to authenticated
    with check (public.is_coach());

create policy "tournament_results_coach_update"
    on public.tournament_results
    for update
    to authenticated
    using (public.is_coach())
    with check (public.is_coach());

create policy "tournament_results_coach_delete"
    on public.tournament_results
    for delete
    to authenticated
    using (public.is_coach());


-- ============================================================
-- 6. TOURNAMENT POSTERS (upload, replace, remove)
-- Viewing is already allowed for approved accounts by
-- tournament-posters.sql.
-- ============================================================

drop policy if exists "tournament_posters_coach_insert" on storage.objects;
drop policy if exists "tournament_posters_coach_update" on storage.objects;
drop policy if exists "tournament_posters_coach_delete" on storage.objects;

create policy "tournament_posters_coach_insert"
    on storage.objects
    for insert
    to authenticated
    with check (
        bucket_id = 'tournament-posters'
        and public.is_coach()
    );

create policy "tournament_posters_coach_update"
    on storage.objects
    for update
    to authenticated
    using (
        bucket_id = 'tournament-posters'
        and public.is_coach()
    )
    with check (
        bucket_id = 'tournament-posters'
        and public.is_coach()
    );

create policy "tournament_posters_coach_delete"
    on storage.objects
    for delete
    to authenticated
    using (
        bucket_id = 'tournament-posters'
        and public.is_coach()
    );

commit;


-- ============================================================
-- END OF COACH ACCESS SCRIPT
-- ============================================================
