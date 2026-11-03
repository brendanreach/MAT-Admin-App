-- ============================================================
-- MAT Admin App
-- Tournament Result Submissions (athlete-reported results)
--
-- Purpose:
-- Lets a signed-in athlete (or their linked parent account)
-- report their results for a tournament that has already
-- taken place. Submissions wait on an admin approval board;
-- nothing changes in the official entries or results until an
-- admin approves.
--
-- Run once in the Supabase SQL editor, after
-- tournament-registration.sql. Safe to re-run. The whole
-- script runs in one transaction, so if any step fails
-- nothing is changed.
--
-- Security notes:
-- - Athletes never write the submissions table directly. They
--   call submit_tournament_results(), which checks that the
--   caller's account is linked to the member
--   (account_member_links), that the tournament is over, and
--   that every event and result stage is a known value.
-- - Athletes can read only submissions for members linked to
--   their account, and withdraw only their pending ones.
-- - Only admins (public.is_admin()) can approve or reject.
--   Approving writes the official entry and result the same
--   way the admin Tournaments page does.
-- ============================================================

begin;


-- ============================================================
-- 0. SANITY CHECK
-- Fails early if the existing helpers are missing.
-- ============================================================

do $$
begin
    perform public.is_admin();
end
$$;


-- ============================================================
-- 1. SUBMISSIONS TABLE
-- tournament_id / member_id use the same column types as the
-- existing tables, whatever those are.
-- ============================================================

do $$
declare
    tournament_id_type text;
    member_id_type text;
begin
    select format_type(a.atttypid, a.atttypmod)
    into tournament_id_type
    from pg_attribute a
    where a.attrelid = 'public.tournaments'::regclass
      and a.attname = 'id';

    select format_type(a.atttypid, a.atttypmod)
    into member_id_type
    from pg_attribute a
    where a.attrelid = 'public.members'::regclass
      and a.attname = 'id';

    execute format(
        $sql$
        create table if not exists public.tournament_result_submissions (
            id uuid primary key default gen_random_uuid(),
            tournament_id %s not null references public.tournaments (id) on delete cascade,
            member_id %s not null references public.members (id) on delete cascade,
            event_name text not null,
            result_stage text,
            division text,
            notes text,
            status text not null default 'pending'
                check (status in ('pending', 'approved', 'rejected')),
            submitted_by uuid default auth.uid(),
            submitted_at timestamptz not null default now(),
            reviewed_by uuid,
            reviewed_at timestamptz,
            review_note text
        )
        $sql$,
        tournament_id_type,
        member_id_type
    );
end
$$;

comment on table public.tournament_result_submissions is
    'Results reported by athletes for past tournaments, waiting for admin approval.';

comment on column public.tournament_result_submissions.result_stage is
    'Gold, Silver, Bronze or a round. Empty means the athlete competed but had no result.';

-- One open submission per athlete, tournament and event; a new
-- submission replaces the pending one.
create unique index if not exists tournament_result_submissions_one_pending
    on public.tournament_result_submissions (tournament_id, member_id, event_name)
    where status = 'pending';

create index if not exists tournament_result_submissions_status_idx
    on public.tournament_result_submissions (status, submitted_at desc);

alter table public.tournament_result_submissions enable row level security;

revoke all on public.tournament_result_submissions from anon;
revoke insert, update, delete on public.tournament_result_submissions from authenticated;
grant select on public.tournament_result_submissions to authenticated;

drop policy if exists "result_submissions_select" on public.tournament_result_submissions;

create policy "result_submissions_select"
    on public.tournament_result_submissions
    for select
    to authenticated
    using (
        public.is_admin()
        or exists (
            select 1
            from public.account_member_links l
            where l.account_id = auth.uid()
              and l.member_id = tournament_result_submissions.member_id
        )
    );


-- ============================================================
-- 2. SHARED VALUES
-- Must match src/lib/tournamentEvents.js and the result stages
-- on the admin Tournaments page.
-- ============================================================

create or replace function public.mat_tournament_event_names()
returns text[]
language sql
immutable
as $$
    select array[
        'Sparring',
        'Recognized Poomsae - Individual',
        'World Class Poomsae - Individual',
        'World Class Poomsae - Mixed Pairs',
        'World Class Poomsae - Team',
        'Traditional Poomsae',
        'Board Breaking',
        'Weapons'
    ];
$$;

create or replace function public.mat_result_stage_names()
returns text[]
language sql
immutable
as $$
    select array[
        'Gold',
        'Silver',
        'Bronze',
        'Quarterfinals',
        'Round of 16',
        'Round of 32',
        'Round of 64',
        'Round of 128'
    ];
$$;


-- ============================================================
-- 3. SUBMIT (athlete reports results for a past tournament)
--
-- requested_results is a JSON array of
--   { "event_name": "...", "result_stage": "Gold" | null,
--     "division": "...", "notes": "..." }
-- ============================================================

create or replace function public.submit_tournament_results(
    requested_tournament_id public.tournaments.id%type,
    requested_member_id public.members.id%type,
    requested_results jsonb
)
returns setof public.tournament_result_submissions
language plpgsql
security definer
set search_path = public
as $$
declare
    target_tournament public.tournaments;
    item jsonb;
    clean_event text;
    clean_stage text;
    clean_division text;
    clean_notes text;
    saved public.tournament_result_submissions;
begin
    if auth.uid() is null then
        raise exception 'You must be signed in to submit results.';
    end if;

    if not exists (
        select 1
        from public.account_member_links l
        where l.account_id = auth.uid()
          and l.member_id = requested_member_id
    ) then
        raise exception 'Your account is not linked to this athlete.';
    end if;

    select *
    into target_tournament
    from public.tournaments t
    where t.id = requested_tournament_id;

    if not found then
        raise exception 'Tournament not found.';
    end if;

    if coalesce(target_tournament.end_date, target_tournament.event_date) is null
       or coalesce(target_tournament.end_date, target_tournament.event_date) >= current_date then
        raise exception 'Results can only be submitted after the tournament is over.';
    end if;

    if jsonb_typeof(requested_results) <> 'array'
       or jsonb_array_length(requested_results) = 0 then
        raise exception 'Choose at least one event to submit.';
    end if;

    if jsonb_array_length(requested_results) > 20 then
        raise exception 'Too many results in one submission.';
    end if;

    for item in select * from jsonb_array_elements(requested_results)
    loop
        clean_event := nullif(trim(item ->> 'event_name'), '');
        clean_stage := nullif(trim(item ->> 'result_stage'), '');
        clean_division := left(nullif(trim(item ->> 'division'), ''), 120);
        clean_notes := left(nullif(trim(item ->> 'notes'), ''), 500);

        if clean_event is null or not (clean_event = any (public.mat_tournament_event_names())) then
            raise exception 'Unknown event: %', coalesce(clean_event, '(blank)');
        end if;

        if clean_stage is not null and not (clean_stage = any (public.mat_result_stage_names())) then
            raise exception 'Unknown result: %', clean_stage;
        end if;

        update public.tournament_result_submissions s
        set result_stage = clean_stage,
            division = clean_division,
            notes = clean_notes,
            submitted_by = auth.uid(),
            submitted_at = now()
        where s.tournament_id = requested_tournament_id
          and s.member_id = requested_member_id
          and s.event_name = clean_event
          and s.status = 'pending'
        returning * into saved;

        if not found then
            insert into public.tournament_result_submissions (
                tournament_id, member_id, event_name, result_stage, division, notes, submitted_by
            )
            values (
                requested_tournament_id, requested_member_id, clean_event,
                clean_stage, clean_division, clean_notes, auth.uid()
            )
            returning * into saved;
        end if;

        return next saved;
    end loop;
end;
$$;

revoke all on function public.submit_tournament_results(public.tournaments.id%type, public.members.id%type, jsonb) from public, anon;
grant execute on function public.submit_tournament_results(public.tournaments.id%type, public.members.id%type, jsonb) to authenticated;


-- ============================================================
-- 4. WITHDRAW (athlete cancels a pending submission)
-- ============================================================

create or replace function public.withdraw_result_submission(
    submission_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if auth.uid() is null then
        raise exception 'You must be signed in.';
    end if;

    delete from public.tournament_result_submissions s
    where s.id = submission_id
      and s.status = 'pending'
      and exists (
          select 1
          from public.account_member_links l
          where l.account_id = auth.uid()
            and l.member_id = s.member_id
      );

    if not found then
        raise exception 'This submission can no longer be withdrawn.';
    end if;
end;
$$;

revoke all on function public.withdraw_result_submission(uuid) from public, anon;
grant execute on function public.withdraw_result_submission(uuid) to authenticated;


-- ============================================================
-- 5. REVIEW (admin approves or rejects)
--
-- Approving:
-- - Creates the athlete's tournament entry if they have none
--   (competition age = tournament year - birth year).
-- - Adds the event to the entry.
-- - Saves the result (when one was reported), replacing any
--   existing result for that event. Division and notes are
--   only overwritten when the athlete supplied them.
-- ============================================================

create or replace function public.review_result_submission(
    submission_id uuid,
    approve boolean,
    note text default null
)
returns public.tournament_result_submissions
language plpgsql
security definer
set search_path = public
as $$
declare
    submission public.tournament_result_submissions;
    target_tournament public.tournaments;
    target_birthdate date;
    target_entry public.tournament_entries;
    competition_age integer;
begin
    if not public.is_admin() then
        raise exception 'Only admins can review results.';
    end if;

    select *
    into submission
    from public.tournament_result_submissions s
    where s.id = submission_id
    for update;

    if not found then
        raise exception 'Submission not found.';
    end if;

    if submission.status <> 'pending' then
        raise exception 'This submission has already been reviewed.';
    end if;

    if approve then
        select *
        into target_tournament
        from public.tournaments t
        where t.id = submission.tournament_id;

        select *
        into target_entry
        from public.tournament_entries e
        where e.tournament_id = submission.tournament_id
          and e.member_id = submission.member_id
        order by e.id
        limit 1;

        if not found then
            select m.birthdate
            into target_birthdate
            from public.members m
            where m.id = submission.member_id;

            if target_birthdate is not null and target_tournament.event_date is not null then
                competition_age :=
                    extract(year from target_tournament.event_date)::integer
                    - extract(year from target_birthdate)::integer;
            end if;

            insert into public.tournament_entries (
                member_id,
                tournament_id,
                events,
                division_age_group,
                has_paid,
                self_registered
            )
            values (
                submission.member_id,
                submission.tournament_id,
                array[submission.event_name],
                competition_age::text,
                false,
                false
            )
            returning * into target_entry;
        elsif not (submission.event_name = any (coalesce(target_entry.events, '{}'::text[]))) then
            update public.tournament_entries e
            set events = (
                select array_agg(x order by array_position(public.mat_tournament_event_names(), x), x)
                from (
                    select distinct unnest(coalesce(e.events, '{}'::text[]) || array[submission.event_name]) as x
                ) s
            )
            where e.id = target_entry.id;
        end if;

        if submission.result_stage is not null then
            insert into public.tournament_results (
                tournament_entry_id,
                event_name,
                result_stage,
                placement,
                medal,
                division,
                notes
            )
            values (
                target_entry.id,
                submission.event_name,
                submission.result_stage,
                case submission.result_stage when 'Gold' then 1 when 'Silver' then 2 when 'Bronze' then 3 end,
                case when submission.result_stage in ('Gold', 'Silver', 'Bronze') then submission.result_stage else 'None' end,
                submission.division,
                submission.notes
            )
            on conflict (tournament_entry_id, event_name) do update
            set result_stage = excluded.result_stage,
                placement = excluded.placement,
                medal = excluded.medal,
                division = coalesce(excluded.division, public.tournament_results.division),
                notes = coalesce(excluded.notes, public.tournament_results.notes);
        end if;
    end if;

    update public.tournament_result_submissions s
    set status = case when approve then 'approved' else 'rejected' end,
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        review_note = left(nullif(trim(note), ''), 500)
    where s.id = submission_id
    returning * into submission;

    return submission;
end;
$$;

revoke all on function public.review_result_submission(uuid, boolean, text) from public, anon;
grant execute on function public.review_result_submission(uuid, boolean, text) to authenticated;

commit;


-- ============================================================
-- END OF TOURNAMENT RESULT SUBMISSIONS SCRIPT
-- ============================================================
