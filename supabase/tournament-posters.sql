-- ============================================================
-- MAT Admin App
-- Tournament Posters
--
-- Purpose:
-- Adds an optional event poster image to tournaments and a
-- private storage bucket to hold the poster files.
--
-- Run once in the Supabase SQL editor, after home-carousel.sql
-- (it reuses the has_approved_role() helper created there).
-- The whole script runs in one transaction, so if any step
-- fails nothing is changed.
--
-- Access:
-- - Approved accounts (admin, coach, athlete) can view posters.
-- - Only admins can upload, replace or remove posters.
-- ============================================================

begin;


-- ============================================================
-- 0. SANITY CHECK
-- Fails early if the existing helpers are missing.
-- ============================================================

do $$
begin
    perform public.is_admin();
    perform public.has_approved_role();
end
$$;


-- ============================================================
-- 1. POSTER COLUMN
-- Stores the file's path inside the tournament-posters bucket.
-- Empty means the tournament has no poster.
-- ============================================================

alter table public.tournaments
    add column if not exists poster_path text;


-- ============================================================
-- 2. PRIVATE STORAGE BUCKET
-- 5 MB limit. The app compresses posters before upload, so
-- real uploads are usually well under 1 MB.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'tournament-posters',
    'tournament-posters',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "tournament_posters_select" on storage.objects;
drop policy if exists "tournament_posters_admin_insert" on storage.objects;
drop policy if exists "tournament_posters_admin_update" on storage.objects;
drop policy if exists "tournament_posters_admin_delete" on storage.objects;

create policy "tournament_posters_select"
    on storage.objects
    for select
    to authenticated
    using (
        bucket_id = 'tournament-posters'
        and public.has_approved_role()
    );

create policy "tournament_posters_admin_insert"
    on storage.objects
    for insert
    to authenticated
    with check (
        bucket_id = 'tournament-posters'
        and public.is_admin()
    );

create policy "tournament_posters_admin_update"
    on storage.objects
    for update
    to authenticated
    using (
        bucket_id = 'tournament-posters'
        and public.is_admin()
    )
    with check (
        bucket_id = 'tournament-posters'
        and public.is_admin()
    );

create policy "tournament_posters_admin_delete"
    on storage.objects
    for delete
    to authenticated
    using (
        bucket_id = 'tournament-posters'
        and public.is_admin()
    );

commit;


-- ============================================================
-- END OF TOURNAMENT POSTERS SCRIPT
-- ============================================================
