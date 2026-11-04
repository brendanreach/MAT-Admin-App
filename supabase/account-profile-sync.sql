-- ============================================================
-- MAT Admin App
-- Account profile sync (Google and other social sign-ins)
--
-- Purpose:
-- Parents who sign in with Google get a login (auth.users) but
-- no row in public.account_profiles, so they never appear under
-- Roster > Link Accounts to Athletes and cannot be linked.
--
-- This script:
--   1. Creates an account_profiles row for every existing login
--      that does not have one (name taken from the Google
--      profile when there is no display name).
--   2. Adds a trigger so every future sign-up, from any provider,
--      gets a profile automatically. New profiles start with no
--      roles, which the app shows as "Pending approval".
--   3. Rebuilds admin_get_account_member_assignments() so the
--      Link Accounts list is built from every login, not only
--      logins that already have a profile.
--
-- Run once in the Supabase SQL editor. Safe to re-run. The whole
-- script runs in one transaction, so if any step fails nothing
-- is changed. The last query lists any login still missing a
-- profile; it should return no rows.
--
-- Security notes:
-- - The trigger never blocks a sign-in: any error inside it is
--   logged as a warning and the sign-up continues.
-- - Existing profiles, roles and links are never changed.
-- - The list function stays admin only (public.is_admin()).
-- ============================================================

begin;


-- ============================================================
-- 0. SANITY CHECK
-- ============================================================

do $$
begin
    perform public.is_admin();
end
$$;


-- ============================================================
-- 1. NEW PROFILES START WITH NO ROLES
-- Only adds a default if the roles column has none today.
-- ============================================================

do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'account_profiles'
          and column_name = 'roles'
          and column_default is null
    ) then
        execute 'alter table public.account_profiles alter column roles set default ''{}''';
    end if;
end
$$;


-- ============================================================
-- 2. DISPLAY NAME FROM A LOGIN
-- Google sends full_name / name; email sign-ups may send
-- display_name. Falls back to the part of the email before @.
-- ============================================================

create or replace function public.mat_login_display_name(
    meta jsonb,
    login_email text
)
returns text
language sql
immutable
as $$
    select coalesce(
        nullif(trim(meta ->> 'display_name'), ''),
        nullif(trim(meta ->> 'full_name'), ''),
        nullif(trim(meta ->> 'name'), ''),
        nullif(split_part(coalesce(login_email, ''), '@', 1), ''),
        'New account'
    );
$$;


-- ============================================================
-- 3. BACKFILL EXISTING LOGINS
-- "on conflict do nothing" skips anyone who already has a
-- profile, including by any other unique column.
-- ============================================================

insert into public.account_profiles (id, email, display_name)
select
    u.id,
    u.email,
    public.mat_login_display_name(u.raw_user_meta_data, u.email)
from auth.users u
where not exists (
    select 1
    from public.account_profiles p
    where p.id = u.id
)
on conflict do nothing;


-- ============================================================
-- 4. PROFILE FOR EVERY FUTURE SIGN-UP
-- Named zz_... so it runs after any existing trigger on
-- auth.users (Postgres fires triggers in name order). If an
-- older trigger already made the profile, this does nothing.
-- ============================================================

create or replace function public.mat_ensure_account_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.account_profiles (id, email, display_name)
    values (
        new.id,
        new.email,
        public.mat_login_display_name(new.raw_user_meta_data, new.email)
    )
    on conflict do nothing;

    return new;
exception
    when others then
        raise warning 'mat_ensure_account_profile skipped for %: %', new.id, sqlerrm;
        return new;
end;
$$;

revoke all on function public.mat_ensure_account_profile() from public, anon, authenticated;

drop trigger if exists zz_mat_ensure_account_profile on auth.users;

create trigger zz_mat_ensure_account_profile
after insert on auth.users
for each row
execute function public.mat_ensure_account_profile();


-- ============================================================
-- 5. LINK ACCOUNTS LIST (admin only)
-- One row per login with no links, or one row per link.
-- Returned as jsonb so member and link ids keep whatever type
-- the existing tables use.
-- ============================================================

drop function if exists public.admin_get_account_member_assignments();

create function public.admin_get_account_member_assignments()
returns setof jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
    if not public.is_admin() then
        raise exception 'Only admins can view account links.'
            using errcode = '42501';
    end if;

    return query
    select jsonb_build_object(
        'account_id', u.id,
        'email', coalesce(p.email, u.email),
        'display_name', coalesce(
            nullif(trim(p.display_name), ''),
            public.mat_login_display_name(u.raw_user_meta_data, u.email)
        ),
        'roles', coalesce(to_jsonb(p.roles), '[]'::jsonb),
        'link_id', l.id,
        'member_id', l.member_id,
        'relationship_type', l.relationship_type,
        'member_name', nullif(trim(concat_ws(' ', m.first_name, m.last_name)), '')
    )
    from auth.users u
    left join public.account_profiles p
        on p.id = u.id
    left join public.account_member_links l
        on l.account_id = u.id
    left join public.members m
        on m.id = l.member_id
    order by
        lower(coalesce(nullif(trim(p.display_name), ''), u.email, '')),
        u.id,
        lower(concat_ws(' ', m.first_name, m.last_name));
end;
$$;

revoke all on function public.admin_get_account_member_assignments() from public, anon;
grant execute on function public.admin_get_account_member_assignments() to authenticated;


commit;


-- ============================================================
-- 6. CHECK
-- Logins still without a profile. Expected: no rows.
-- ============================================================

select
    u.id,
    u.email,
    u.raw_app_meta_data ->> 'provider' as provider,
    u.created_at
from auth.users u
where not exists (
    select 1
    from public.account_profiles p
    where p.id = u.id
);
