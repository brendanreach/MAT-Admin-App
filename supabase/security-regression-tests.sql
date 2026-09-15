-- ============================================================
-- MAT Admin App
-- Security Regression Tests
--
-- Purpose:
-- Re-run these checks after changing RLS policies, roles,
-- RPCs, member links, or storage rules.
--
-- IMPORTANT:
-- Replace the test email below if your test athlete changes.
-- ============================================================


-- ============================================================
-- TEST USER
-- ============================================================

-- Current test athlete:
-- testathlete@yourdomain.com


-- ============================================================
-- 1. VERIFY RLS IS ENABLED
-- ============================================================

select
    n.nspname as schema_name,
    c.relname as table_name,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n
    on n.oid = c.relnamespace
where n.nspname in ('public', 'storage')
  and c.relkind = 'r'
  and c.relname in (
      'account_profiles',
      'account_member_links',
      'members',
      'member_private_details',
      'tournaments',
      'tournament_entries',
      'tournament_results',
      'calendar_events',
      'announcements',
      'financial_transactions',
      'objects'
  )
order by
    n.nspname,
    c.relname;


-- EXPECTED:
-- rls_enabled = true for every row.


-- ============================================================
-- 2. AUDIT CURRENT POLICIES
-- ============================================================

select
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
from pg_policies
where schemaname in (
    'public',
    'storage'
)
and tablename in (
    'account_profiles',
    'account_member_links',
    'members',
    'member_private_details',
    'tournaments',
    'tournament_entries',
    'tournament_results',
    'calendar_events',
    'announcements',
    'financial_transactions',
    'objects'
)
order by
    schemaname,
    tablename,
    cmd,
    policyname;


-- REVIEW FOR:
-- - unexpected USING (true) policies
-- - duplicate broad policies
-- - accidental anon access
-- - policies broader than intended


-- ============================================================
-- 3. AUDIT TABLE GRANTS
-- ============================================================

select
    table_schema,
    table_name,
    grantee,
    privilege_type
from information_schema.role_table_grants
where table_schema in ('public', 'storage')
  and table_name in (
      'account_profiles',
      'account_member_links',
      'members',
      'member_private_details',
      'member_public_profiles',
      'tournaments',
      'tournament_entries',
      'tournament_results',
      'calendar_events',
      'announcements',
      'financial_transactions',
      'objects'
  )
  and grantee in ('anon', 'authenticated')
order by
    table_schema,
    table_name,
    grantee,
    privilege_type;


-- EXPECTED:
-- public app tables:
--   anon should have no grants
--
-- authenticated:
--   normal CRUD grants may exist
--   RLS must still determine actual access
--
-- storage.objects:
--   Supabase-managed grants may exist


-- ============================================================
-- 4. AUDIT SECURITY RPC EXECUTE GRANTS
-- ============================================================

select
    routine_schema,
    routine_name,
    privilege_type,
    grantee
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in (
      'has_account_role',
      'is_admin',
      'is_linked_to_member',
      'can_access_member',
      'save_member_admin',
      'get_member_tuition_admin',
      'get_member_private_details_admin',
      'set_member_profile_image',
      'clear_member_profile_image',
      'approve_member_profile_image',
      'reject_member_profile_image'
  )
order by
    routine_name,
    grantee,
    privilege_type;


-- EXPECTED:
-- authenticated = EXECUTE
-- postgres = EXECUTE
-- service_role = EXECUTE
-- anon should NOT appear


-- ============================================================
-- 5. TEST ATHLETE: MEMBER VISIBILITY
-- ============================================================

begin;

do $$
declare
    test_user_id uuid;
begin
    select id
    into test_user_id
    from auth.users
    where email = 'testathlete@yourdomain.com';

    if test_user_id is null then
        raise exception 'Test athlete account not found';
    end if;

    perform set_config(
        'request.jwt.claims',
        json_build_object(
            'sub', test_user_id::text,
            'role', 'authenticated'
        )::text,
        true
    );
end
$$;

set local role authenticated;

select
    id,
    first_name,
    last_name,
    birthdate,
    belt_rank,
    is_active,
    poomsae,
    sparring,
    breaking
from public.members;

rollback;


-- EXPECTED:
-- Only member rows linked to the test athlete account.


-- ============================================================
-- 6. TEST ATHLETE: PRIVATE MEMBER DETAILS
-- ============================================================

begin;

do $$
declare
    test_user_id uuid;
begin
    select id
    into test_user_id
    from auth.users
    where email = 'testathlete@yourdomain.com';

    if test_user_id is null then
        raise exception 'Test athlete account not found';
    end if;

    perform set_config(
        'request.jwt.claims',
        json_build_object(
            'sub', test_user_id::text,
            'role', 'authenticated'
        )::text,
        true
    );
end
$$;

set local role authenticated;

select *
from public.member_private_details;

rollback;


-- EXPECTED:
-- Success. No rows returned.


-- ============================================================
-- 7. TEST ATHLETE: FINANCIAL READ ACCESS
-- ============================================================

begin;

do $$
declare
    test_user_id uuid;
begin
    select id
    into test_user_id
    from auth.users
    where email = 'testathlete@yourdomain.com';

    if test_user_id is null then
        raise exception 'Test athlete account not found';
    end if;

    perform set_config(
        'request.jwt.claims',
        json_build_object(
            'sub', test_user_id::text,
            'role', 'authenticated'
        )::text,
        true
    );
end
$$;

set local role authenticated;

select *
from public.financial_transactions;

rollback;


-- EXPECTED:
-- Success. No rows returned.


-- ============================================================
-- 8. TEST ATHLETE: FINANCIAL WRITE ACCESS
--
-- IMPORTANT:
-- This test is EXPECTED TO FAIL.
-- Run this section separately if using the Supabase SQL editor.
-- ============================================================

/*

begin;

do $$
declare
    test_user_id uuid;
begin
    select id
    into test_user_id
    from auth.users
    where email = 'testathlete@yourdomain.com';

    if test_user_id is null then
        raise exception 'Test athlete account not found';
    end if;

    perform set_config(
        'request.jwt.claims',
        json_build_object(
            'sub', test_user_id::text,
            'role', 'authenticated'
        )::text,
        true
    );
end
$$;

set local role authenticated;

insert into public.financial_transactions (
    transaction_type,
    category,
    description,
    amount,
    transaction_date
)
values (
    'expense',
    'Security Test',
    'This insert should be blocked',
    1.00,
    current_date
);

rollback;

*/

-- EXPECTED ERROR:
-- new row violates row-level security policy
-- for table "financial_transactions"


-- ============================================================
-- 9. TEST ATHLETE: ROLE ESCALATION
--
-- IMPORTANT:
-- This test is EXPECTED TO AFFECT 0 ROWS.
-- ============================================================

begin;

do $$
declare
    test_user_id uuid;
begin
    select id
    into test_user_id
    from auth.users
    where email = 'testathlete@yourdomain.com';

    if test_user_id is null then
        raise exception 'Test athlete account not found';
    end if;

    perform set_config(
        'request.jwt.claims',
        json_build_object(
            'sub', test_user_id::text,
            'role', 'authenticated'
        )::text,
        true
    );
end
$$;

set local role authenticated;

update public.account_profiles
set roles = array['admin', 'athlete']
where id = auth.uid();

rollback;


-- EXPECTED:
-- UPDATE 0


-- ============================================================
-- 10. TEST ATHLETE: TOURNAMENT ENTRIES
-- ============================================================

begin;

do $$
declare
    test_user_id uuid;
begin
    select id
    into test_user_id
    from auth.users
    where email = 'testathlete@yourdomain.com';

    if test_user_id is null then
        raise exception 'Test athlete account not found';
    end if;

    perform set_config(
        'request.jwt.claims',
        json_build_object(
            'sub', test_user_id::text,
            'role', 'authenticated'
        )::text,
        true
    );
end
$$;

set local role authenticated;

select *
from public.tournament_entries;

rollback;


-- EXPECTED:
-- Only entries belonging to members linked to this account.
-- Zero rows is valid if the linked athlete has no entries.


-- ============================================================
-- 11. TEST ATHLETE: TOURNAMENT RESULTS
-- ============================================================

begin;

do $$
declare
    test_user_id uuid;
begin
    select id
    into test_user_id
    from auth.users
    where email = 'testathlete@yourdomain.com';

    if test_user_id is null then
        raise exception 'Test athlete account not found';
    end if;

    perform set_config(
        'request.jwt.claims',
        json_build_object(
            'sub', test_user_id::text,
            'role', 'authenticated'
        )::text,
        true
    );
end
$$;

set local role authenticated;

select *
from public.tournament_results;

rollback;


-- EXPECTED:
-- Only results belonging to accessible tournament entries.
-- Zero rows is valid.


-- ============================================================
-- 12. TEST ATHLETE: ADMIN TUITION RPC
--
-- IMPORTANT:
-- EXPECTED TO FAIL.
-- Run separately.
-- ============================================================

/*

begin;

do $$
declare
    test_user_id uuid;
begin
    select id
    into test_user_id
    from auth.users
    where email = 'testathlete@yourdomain.com';

    if test_user_id is null then
        raise exception 'Test athlete account not found';
    end if;

    perform set_config(
        'request.jwt.claims',
        json_build_object(
            'sub', test_user_id::text,
            'role', 'authenticated'
        )::text,
        true
    );
end
$$;

set local role authenticated;

select *
from public.get_member_tuition_admin();

rollback;

*/

-- EXPECTED ERROR:
-- Admin access required


-- ============================================================
-- 13. TEST ATHLETE: ADMIN PRIVATE DETAILS RPC
--
-- IMPORTANT:
-- EXPECTED TO FAIL.
-- Run separately.
-- ============================================================

/*

begin;

do $$
declare
    test_user_id uuid;
begin
    select id
    into test_user_id
    from auth.users
    where email = 'testathlete@yourdomain.com';

    if test_user_id is null then
        raise exception 'Test athlete account not found';
    end if;

    perform set_config(
        'request.jwt.claims',
        json_build_object(
            'sub', test_user_id::text,
            'role', 'authenticated'
        )::text,
        true
    );
end
$$;

set local role authenticated;

select *
from public.get_member_private_details_admin(
    '00000000-0000-0000-0000-000000000000'::uuid
);

rollback;

*/

-- EXPECTED ERROR:
-- Admin access required


-- ============================================================
-- END OF MAT SECURITY REGRESSION TESTS
-- ============================================================