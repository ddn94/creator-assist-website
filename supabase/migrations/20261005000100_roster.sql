-- Roster: talent cards and how an agency and a talent connect.
-- A card is not an account. Status is record, invited, requested,
-- active, or disconnected. One email can sit on one card per agency.
-- Run after 20261005000000_accounts.sql.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table public.talent_records (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  email text,
  status text not null default 'record'
    check (status in ('record', 'invited', 'active', 'disconnected', 'requested')),
  invite_code text unique,
  linked_user_id uuid references public.profiles (id) on delete set null,
  request_user_id uuid references public.profiles (id) on delete set null,
  connected_at timestamptz,
  disconnected_at timestamptz,
  declined_at timestamptz,
  platform text,
  handle text,
  followers integer,
  niche text,
  notes text,
  location text,
  currency text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index talent_records_agency_id_idx on public.talent_records (agency_id);

-- First time a card becomes active, remember when the link started.
-- A later reconnect keeps the original connected_at.
create or replace function public.stamp_connected_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'active'
     and new.linked_user_id is not null
     and new.connected_at is null then
    new.connected_at := now();
  end if;
  return new;
end;
$$;

create trigger talent_records_stamp_connected
  before update of status, linked_user_id on public.talent_records
  for each row execute function public.stamp_connected_at();

-- ---------------------------------------------------------------------------
-- Who can see a linked person
-- ---------------------------------------------------------------------------

-- Live link only. Writes and new content use this.
create or replace function public.is_agency_of_owner(p_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.talent_records t
    where t.agency_id = (select auth.uid())
      and t.linked_user_id = p_owner
      and t.status = 'active'
  );
$$;

create or replace function public.agency_can_read_talent_profile(p_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.talent_records t
    where t.agency_id = (select auth.uid())
      and t.linked_user_id = p_profile
      and t.status in ('active', 'disconnected')
  );
$$;

-- ---------------------------------------------------------------------------
-- One email, one card
-- ---------------------------------------------------------------------------

create or replace function public.roster_name_for_email(
  p_agency uuid,
  p_email text,
  p_except uuid
)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(nullif(trim(t.name), ''), 'This person')
  from public.talent_records t
  left join public.profiles p on p.id = t.linked_user_id
  where t.agency_id = p_agency
    and (p_except is null or t.id is distinct from p_except)
    and p_email is not null
    and (
      lower(t.email) = p_email
      or lower(p.email) = p_email
    )
  order by t.created_at
  limit 1;
$$;

-- Save without inviting never looks up an account. Invite does.
create or replace function public.agency_add_talent(
  p_name text,
  p_email text,
  p_status text,
  p_platform text,
  p_handle text,
  p_followers integer,
  p_niche text,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  agency public.profiles%rowtype;
  new_id uuid;
  code text;
  clean_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  clean_status text := trim(coalesce(p_status, ''));
  talent_id uuid;
  request_for uuid;
  row_status text;
  existing_name text;
begin
  select * into agency from public.profiles where id = uid and role = 'agency';
  if not found then
    raise exception 'Only an agency can add talent';
  end if;

  if nullif(trim(coalesce(p_name, '')), '') is null then
    raise exception 'Name is required';
  end if;

  if clean_status not in ('record', 'invited') then
    raise exception 'invalid status';
  end if;

  existing_name := public.roster_name_for_email(uid, clean_email, null);
  if existing_name is not null then
    raise exception '% is already on your roster', existing_name;
  end if;

  if clean_status = 'record' then
    insert into public.talent_records (
      agency_id, name, email, status, invite_code, request_user_id,
      platform, handle, followers, niche, notes, location, currency
    )
    values (
      uid,
      trim(p_name),
      clean_email,
      'record',
      null,
      null,
      nullif(trim(coalesce(p_platform, '')), ''),
      nullif(trim(coalesce(p_handle, '')), ''),
      greatest(coalesce(p_followers, 0), 0),
      nullif(trim(coalesce(p_niche, '')), ''),
      nullif(trim(coalesce(p_notes, '')), ''),
      agency.country,
      agency.currency
    )
    returning id into new_id;

    return new_id;
  end if;

  if clean_email is null then
    raise exception 'Add an email to send an invite';
  end if;

  if exists (
    select 1 from public.profiles
    where lower(email) = clean_email
      and role = 'agency'
  ) then
    raise exception 'This email is an agency account';
  end if;

  select id into talent_id
  from public.profiles
  where lower(email) = clean_email
    and role = 'talent';

  if talent_id is not null then
    if exists (
      select 1 from public.talent_records
      where linked_user_id = talent_id
        and status = 'active'
    ) then
      raise exception 'This talent is already connected to an agency';
    end if;
    row_status := 'requested';
    request_for := talent_id;
  else
    row_status := 'invited';
    code := public.generate_invite_code();
  end if;

  insert into public.talent_records (
    agency_id, name, email, status, invite_code, request_user_id,
    platform, handle, followers, niche, notes, location, currency
  )
  values (
    uid,
    trim(p_name),
    clean_email,
    row_status,
    code,
    request_for,
    nullif(trim(coalesce(p_platform, '')), ''),
    nullif(trim(coalesce(p_handle, '')), ''),
    greatest(coalesce(p_followers, 0), 0),
    nullif(trim(coalesce(p_niche, '')), ''),
    nullif(trim(coalesce(p_notes, '')), ''),
    agency.country,
    agency.currency
  )
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.agency_invite_talent(p_id uuid, p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec public.talent_records%rowtype;
  clean_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  talent_id uuid;
  code text;
  existing_name text;
begin
  select * into rec
  from public.talent_records
  where id = p_id and agency_id = uid;

  if not found then
    raise exception 'Talent record not found';
  end if;

  if rec.status = 'active' then
    raise exception 'This talent already has an account';
  end if;

  if rec.status = 'disconnected' and rec.linked_user_id is not null then
    if exists (
      select 1 from public.talent_records
      where linked_user_id = rec.linked_user_id
        and status = 'active'
        and id <> rec.id
    ) then
      raise exception 'This talent is already connected to an agency';
    end if;

    update public.talent_records
      set status = 'requested',
          declined_at = null,
          updated_at = now()
      where id = rec.id
        and status = 'disconnected';
    return 'request';
  end if;

  if clean_email is null then
    clean_email := nullif(lower(trim(coalesce(rec.email, ''))), '');
  end if;

  existing_name := public.roster_name_for_email(uid, clean_email, rec.id);
  if existing_name is not null then
    raise exception '% is already on your roster', existing_name;
  end if;

  if exists (
    select 1 from public.profiles
    where lower(email) = clean_email
      and role = 'agency'
  ) then
    raise exception 'This email is an agency account';
  end if;

  if clean_email is not null then
    select id into talent_id
    from public.profiles
    where lower(email) = clean_email
      and role = 'talent';
  end if;

  if talent_id is not null then
    if exists (
      select 1 from public.talent_records
      where linked_user_id = talent_id
        and status = 'active'
    ) then
      raise exception 'This talent is already connected to an agency';
    end if;

    if rec.status = 'requested' and rec.request_user_id = talent_id then
      return 'request';
    end if;

    if rec.linked_user_id is not null then
      raise exception 'This talent already has an account';
    end if;

    if rec.status not in ('record', 'invited') then
      raise exception 'Only a record that has not joined can be requested';
    end if;

    update public.talent_records
      set email = clean_email,
          status = 'requested',
          request_user_id = talent_id,
          invite_code = null,
          declined_at = null,
          updated_at = now()
      where id = rec.id
        and linked_user_id is null;
    return 'request';
  end if;

  if rec.linked_user_id is not null or rec.status = 'active' then
    raise exception 'This talent already has an account';
  end if;

  if rec.status = 'invited' and rec.invite_code is not null and clean_email is not distinct from lower(rec.email) then
    return rec.invite_code;
  end if;

  if clean_email is null then
    raise exception 'Add an email to send an invite';
  end if;

  code := public.generate_invite_code();

  update public.talent_records
    set email = clean_email,
        status = 'invited',
        invite_code = code,
        declined_at = null,
        updated_at = now()
    where id = rec.id
      and linked_user_id is null;

  return code;
end;
$$;

-- A card they never joined can be removed. A joined card stays.
create or replace function public.agency_delete_record(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if not exists (
    select 1 from public.profiles where id = uid and role = 'agency'
  ) then
    raise exception 'Only an agency can remove a record';
  end if;

  delete from public.talent_records
  where id = p_id
    and agency_id = uid
    and status in ('record', 'invited', 'requested')
    and linked_user_id is null;

  if not found then
    raise exception 'Only a card that has not been joined can be removed';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------

alter table public.talent_records enable row level security;

create policy talent_records_select_own
  on public.talent_records
  for select
  to authenticated
  using (agency_id = (select auth.uid()));

create policy talent_records_select_self
  on public.talent_records
  for select
  to authenticated
  using (
    linked_user_id = (select auth.uid())
    or request_user_id = (select auth.uid())
  );

create policy profiles_select_linked_talent
  on public.profiles
  for select
  to authenticated
  using (public.agency_can_read_talent_profile(id));

create policy profiles_select_my_agency
  on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.talent_records t
      where t.agency_id = profiles.id
        and t.status in ('active', 'disconnected', 'requested')
        and (
          t.linked_user_id = (select auth.uid())
          or t.request_user_id = (select auth.uid())
        )
    )
  );

grant select on public.talent_records to authenticated;

revoke all on function public.is_agency_of_owner(uuid) from public;
revoke all on function public.agency_can_read_talent_profile(uuid) from public;
revoke all on function public.roster_name_for_email(uuid, text, uuid) from public;
revoke all on function public.roster_name_for_email(uuid, text, uuid) from anon, authenticated;
revoke all on function public.agency_add_talent(text, text, text, text, text, integer, text, text) from public;
revoke all on function public.agency_invite_talent(uuid, text) from public;
revoke all on function public.agency_delete_record(uuid) from public;

grant execute on function public.is_agency_of_owner(uuid) to authenticated;
grant execute on function public.agency_can_read_talent_profile(uuid) to authenticated;
grant execute on function public.agency_add_talent(text, text, text, text, text, integer, text, text) to authenticated;
grant execute on function public.agency_invite_talent(uuid, text) to authenticated;
grant execute on function public.agency_delete_record(uuid) to authenticated;
