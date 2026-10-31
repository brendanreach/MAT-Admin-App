-- ============================================================
-- MAT Admin App
-- Tournament Registration (athlete self sign-up)
--
-- Purpose:
-- 1. Adds a registration link to tournaments so athletes can
--    find the organizer's sign-up page from the app.
-- 2. Adds the list of events offered at each tournament.
-- 3. Lets a signed-in athlete mark themselves as registered
--    for an upcoming tournament, choosing at least one of the
--    offered events, change those events later, or undo the
--    sign-up - without giving athletes general write access
--    to tournament_entries.
--
-- Run in the Supabase SQL editor, after tournament-fees.sql.
-- Safe to re-run (for example if an earlier version of this
-- script was already applied). The whole script runs in one
-- transaction, so if any step fails nothing is changed.
--
-- Security notes:
-- - Athletes never insert, update or delete entry rows
--   directly. They call the functions below, which check that
--   the caller's account is linked to the member
--   (account_member_links).
-- - Athletes can only sign up for, or change events on, a
--   tournament that has not ended and whose registration
--   deadline has not passed, and only with offered events.
-- - Once a coach records a result, the athlete can no longer
--   change events or withdraw; coaches handle it from there.
-- - Athletes can only withdraw an entry they created
--   themselves (self_registered = true).
-- - Coaches and admins keep full control on their own page,
--   including events not on the offered list.
-- ============================================================

begin;


-- ============================================================
-- 1. COLUMNS
-- ============================================================

alter table public.tournaments
    add column if not exists registration_url text;

alter table public.tournaments
    drop constraint if exists tournaments_registration_url_check;

alter table public.tournaments
    add constraint tournaments_registration_url_check
    check (
        registration_url is null
        or registration_url ~* '^https?://[^[:space:]]+$'
    );

comment on column public.tournaments.registration_url is
    'Optional link to the tournament organizer''s registration page.';

alter table public.tournaments
    add column if not exists available_events text[];

comment on column public.tournaments.available_events is
    'Events offered at this tournament. Null or empty means every event is offered (tournaments created before this list existed).';

alter table public.tournament_entries
    add column if not exists self_registered boolean not null default false;

comment on column public.tournament_entries.self_registered is
    'True when the athlete marked themselves as registered from the app.';


-- ============================================================
-- 2. SHARED CHECKS
-- ============================================================

-- Cleans the athlete's event list (trims, drops duplicates,
-- keeps order) and checks it against the tournament's offered
-- events. Raises a friendly error if anything is wrong.
create or replace function public.clean_athlete_tournament_events(
    requested_events text[],
    offered_events text[]
)
returns text[]
language plpgsql
immutable
set search_path = public
as $$
declare
    cleaned text[];
begin
    cleaned := array(
        select btrim(u.event_name)
        from unnest(coalesce(requested_events, '{}')) with ordinality as u(event_name, position)
        where nullif(btrim(u.event_name), '') is not null
        group by btrim(u.event_name)
        order by min(u.position)
    );

    if cardinality(cleaned) = 0 then
        raise exception 'Choose at least one event you are registered for.';
    end if;

    if coalesce(cardinality(offered_events), 0) > 0
       and exists (
           select 1
           from unnest(cleaned) as c(event_name)
           where not c.event_name = any(offered_events)
       ) then
        raise exception 'One or more of those events are not offered at this tournament.';
    end if;

    return cleaned;
end;
$$;

revoke all on function public.clean_athlete_tournament_events(text[], text[]) from public, anon;


-- ============================================================
-- 3. REGISTER (athlete marks themselves as registered)
-- ============================================================

-- Replaced by the version that takes the athlete's events.
drop function if exists public.register_for_tournament(public.tournaments.id%type, public.members.id%type);

create or replace function public.register_for_tournament(
    requested_tournament_id public.tournaments.id%type,
    requested_member_id public.members.id%type,
    requested_events text[]
)
returns public.tournament_entries
language plpgsql
security definer
set search_path = public
as $$
declare
    target_tournament public.tournaments;
    target_birthdate date;
    existing_entry public.tournament_entries;
    new_entry public.tournament_entries;
    competition_age integer;
    chosen_events text[];
begin
    if auth.uid() is null then
        raise exception 'You must be signed in to register.';
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

    -- One day of grace covers the gap between the server (UTC)
    -- and local time, so evening sign-ups on deadline day work.
    if coalesce(target_tournament.end_date, target_tournament.event_date) < current_date - 1 then
        raise exception 'This tournament has already taken place.';
    end if;

    if target_tournament.registration_deadline is not null
       and target_tournament.registration_deadline < current_date - 1 then
        raise exception 'Registration for this tournament has closed. Talk to your coach.';
    end if;

    chosen_events := public.clean_athlete_tournament_events(
        requested_events,
        target_tournament.available_events
    );

    select *
    into existing_entry
    from public.tournament_entries e
    where e.tournament_id = requested_tournament_id
      and e.member_id = requested_member_id
    limit 1;

    if found then
        return existing_entry;
    end if;

    select m.birthdate
    into target_birthdate
    from public.members m
    where m.id = requested_member_id;

    -- Same rule the coach page uses: tournament year minus birth year.
    if target_birthdate is not null and target_tournament.event_date is not null then
        competition_age :=
            extract(year from target_tournament.event_date)::integer
            - extract(year from target_birthdate)::integer;
    end if;

    -- jsonb_populate_record matches how the app's API writes rows,
    -- so "events" is stored correctly whatever its column type.
    insert into public.tournament_entries (
        member_id,
        tournament_id,
        events,
        division_age_group,
        has_paid,
        self_registered
    )
    select
        r.member_id,
        r.tournament_id,
        r.events,
        r.division_age_group,
        r.has_paid,
        r.self_registered
    from jsonb_populate_record(
        null::public.tournament_entries,
        jsonb_build_object(
            'member_id', requested_member_id,
            'tournament_id', requested_tournament_id,
            'events', to_jsonb(chosen_events),
            'division_age_group', competition_age::text,
            'has_paid', false,
            'self_registered', true
        )
    ) as r
    returning *
    into new_entry;

    return new_entry;
end;
$$;

revoke all on function public.register_for_tournament(public.tournaments.id%type, public.members.id%type, text[]) from public, anon;
grant execute on function public.register_for_tournament(public.tournaments.id%type, public.members.id%type, text[]) to authenticated;


-- ============================================================
-- 4. CHANGE EVENTS (athlete updates their own events)
-- ============================================================

create or replace function public.update_my_tournament_events(
    requested_entry_id public.tournament_entries.id%type,
    requested_events text[]
)
returns public.tournament_entries
language plpgsql
security definer
set search_path = public
as $$
declare
    target_entry public.tournament_entries;
    target_tournament public.tournaments;
    chosen_events text[];
    updated_entry public.tournament_entries;
begin
    if auth.uid() is null then
        raise exception 'You must be signed in.';
    end if;

    select *
    into target_entry
    from public.tournament_entries e
    where e.id = requested_entry_id;

    if not found then
        raise exception 'Registration not found.';
    end if;

    if not exists (
        select 1
        from public.account_member_links l
        where l.account_id = auth.uid()
          and l.member_id = target_entry.member_id
    ) then
        raise exception 'Your account is not linked to this athlete.';
    end if;

    select *
    into target_tournament
    from public.tournaments t
    where t.id = target_entry.tournament_id;

    if coalesce(target_tournament.end_date, target_tournament.event_date) < current_date - 1 then
        raise exception 'This tournament has already taken place.';
    end if;

    if target_tournament.registration_deadline is not null
       and target_tournament.registration_deadline < current_date - 1 then
        raise exception 'Registration has closed. Talk to your coach to change your events.';
    end if;

    if exists (
        select 1
        from public.tournament_results r
        where r.tournament_entry_id = target_entry.id
    ) then
        raise exception 'Results have been recorded for this entry. Talk to your coach.';
    end if;

    chosen_events := public.clean_athlete_tournament_events(
        requested_events,
        target_tournament.available_events
    );

    update public.tournament_entries e
    set events = (
        jsonb_populate_record(
            null::public.tournament_entries,
            jsonb_build_object('events', to_jsonb(chosen_events))
        )
    ).events
    where e.id = target_entry.id
    returning e.*
    into updated_entry;

    return updated_entry;
end;
$$;

revoke all on function public.update_my_tournament_events(public.tournament_entries.id%type, text[]) from public, anon;
grant execute on function public.update_my_tournament_events(public.tournament_entries.id%type, text[]) to authenticated;


-- ============================================================
-- 5. WITHDRAW (athlete undoes their own sign-up)
-- ============================================================

create or replace function public.withdraw_tournament_registration(
    requested_entry_id public.tournament_entries.id%type
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    target_entry public.tournament_entries;
    target_tournament public.tournaments;
begin
    if auth.uid() is null then
        raise exception 'You must be signed in.';
    end if;

    select *
    into target_entry
    from public.tournament_entries e
    where e.id = requested_entry_id;

    if not found then
        raise exception 'Registration not found.';
    end if;

    if not exists (
        select 1
        from public.account_member_links l
        where l.account_id = auth.uid()
          and l.member_id = target_entry.member_id
    ) then
        raise exception 'Your account is not linked to this athlete.';
    end if;

    if not target_entry.self_registered then
        raise exception 'Your coach added this entry. Talk to your coach to withdraw.';
    end if;

    if exists (
        select 1
        from public.tournament_results r
        where r.tournament_entry_id = target_entry.id
    ) then
        raise exception 'Results have been recorded for this entry. Talk to your coach.';
    end if;

    select *
    into target_tournament
    from public.tournaments t
    where t.id = target_entry.tournament_id;

    if coalesce(target_tournament.end_date, target_tournament.event_date) < current_date - 1 then
        raise exception 'This tournament has already taken place.';
    end if;

    if target_tournament.registration_deadline is not null
       and target_tournament.registration_deadline < current_date - 1 then
        raise exception 'Registration has closed. Talk to your coach to withdraw.';
    end if;

    delete from public.tournament_entries
    where id = target_entry.id;
end;
$$;

revoke all on function public.withdraw_tournament_registration(public.tournament_entries.id%type) from public, anon;
grant execute on function public.withdraw_tournament_registration(public.tournament_entries.id%type) to authenticated;


-- Refresh the API schema cache so the app can use the changes right away.
notify pgrst, 'reload schema';

commit;
