-- ============================================================
-- MAT Admin App
-- Home Page Carousel
--
-- Purpose:
-- Adds admin-managed home page carousel slides and a private
-- storage bucket for their images.
--
-- Run once in the Supabase SQL editor. The whole script runs
-- in one transaction, so if any step fails nothing is changed.
--
-- Access:
-- - Approved accounts (admin, coach, athlete) can view slides
--   meant for them and read carousel images.
-- - Only admins can add, change, reorder or delete slides
--   and upload or remove carousel images.
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
-- 1. APPROVED ACCOUNT HELPER
-- ============================================================

create or replace function public.has_approved_role()
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
          and lower(trim(r.role)) in ('admin', 'coach', 'athlete')
    );
$$;

revoke all on function public.has_approved_role() from public, anon;
grant execute on function public.has_approved_role() to authenticated;


-- ============================================================
-- 2. SLIDES TABLE
--
-- slide_type:
--   custom            - fully written by an admin
--   next_tournament   - text filled in from the next tournament
--   latest_discussion - text filled in from the newest topic
--   welcome           - personalised welcome message
--
-- Automatic slides can still be turned on/off, reordered,
-- targeted and given a custom image.
-- ============================================================

create table if not exists public.home_carousel_slides (
    id uuid primary key default gen_random_uuid(),
    slide_type text not null default 'custom'
        check (slide_type in ('custom', 'next_tournament', 'latest_discussion', 'welcome')),
    image_path text,
    alt_text text,
    kicker text,
    title text,
    body text,
    button_label text,
    button_target text,
    audience text not null default 'everyone'
        check (audience in ('everyone', 'athletes', 'admins')),
    sort_order integer not null default 0,
    is_active boolean not null default true,
    starts_on date,
    ends_on date,
    created_by uuid default auth.uid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint home_carousel_slides_dates_check
        check (starts_on is null or ends_on is null or ends_on >= starts_on),
    constraint home_carousel_slides_custom_title_check
        check (slide_type <> 'custom' or nullif(trim(title), '') is not null)
);

create unique index if not exists home_carousel_slides_one_per_auto_type
    on public.home_carousel_slides (slide_type)
    where slide_type <> 'custom';

create or replace function public.touch_home_carousel_slide()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end
$$;

drop trigger if exists home_carousel_slides_touch on public.home_carousel_slides;

create trigger home_carousel_slides_touch
    before update on public.home_carousel_slides
    for each row
    execute function public.touch_home_carousel_slide();

insert into public.home_carousel_slides (slide_type, sort_order, audience)
values
    ('next_tournament', 10, 'everyone'),
    ('latest_discussion', 20, 'everyone'),
    ('welcome', 30, 'everyone')
on conflict do nothing;


-- ============================================================
-- 3. SLIDES TABLE SECURITY
-- ============================================================

alter table public.home_carousel_slides enable row level security;

revoke all on public.home_carousel_slides from anon;
grant select, insert, update, delete on public.home_carousel_slides to authenticated;

drop policy if exists "home_carousel_slides_select" on public.home_carousel_slides;
drop policy if exists "home_carousel_slides_admin_insert" on public.home_carousel_slides;
drop policy if exists "home_carousel_slides_admin_update" on public.home_carousel_slides;
drop policy if exists "home_carousel_slides_admin_delete" on public.home_carousel_slides;

create policy "home_carousel_slides_select"
    on public.home_carousel_slides
    for select
    to authenticated
    using (
        public.is_admin()
        or (
            public.has_approved_role()
            and audience in ('everyone', 'athletes')
        )
    );

create policy "home_carousel_slides_admin_insert"
    on public.home_carousel_slides
    for insert
    to authenticated
    with check (public.is_admin());

create policy "home_carousel_slides_admin_update"
    on public.home_carousel_slides
    for update
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());

create policy "home_carousel_slides_admin_delete"
    on public.home_carousel_slides
    for delete
    to authenticated
    using (public.is_admin());


-- ============================================================
-- 4. PRIVATE STORAGE BUCKET
-- 5 MB limit. The app compresses photos before upload, so
-- real uploads are usually well under 1 MB.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'home-carousel',
    'home-carousel',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "home_carousel_images_select" on storage.objects;
drop policy if exists "home_carousel_images_admin_insert" on storage.objects;
drop policy if exists "home_carousel_images_admin_update" on storage.objects;
drop policy if exists "home_carousel_images_admin_delete" on storage.objects;

create policy "home_carousel_images_select"
    on storage.objects
    for select
    to authenticated
    using (
        bucket_id = 'home-carousel'
        and public.has_approved_role()
    );

create policy "home_carousel_images_admin_insert"
    on storage.objects
    for insert
    to authenticated
    with check (
        bucket_id = 'home-carousel'
        and public.is_admin()
    );

create policy "home_carousel_images_admin_update"
    on storage.objects
    for update
    to authenticated
    using (
        bucket_id = 'home-carousel'
        and public.is_admin()
    )
    with check (
        bucket_id = 'home-carousel'
        and public.is_admin()
    );

create policy "home_carousel_images_admin_delete"
    on storage.objects
    for delete
    to authenticated
    using (
        bucket_id = 'home-carousel'
        and public.is_admin()
    );

commit;


-- ============================================================
-- END OF HOME PAGE CAROUSEL SCRIPT
-- ============================================================
