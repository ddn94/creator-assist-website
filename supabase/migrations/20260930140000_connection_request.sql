-- Existing talent accounts connect by request. New emails still get an invite code.
-- The agency sees roster-card deals, plus talent content from connected_at
-- until disconnected_at. Older tracker items stay private.
-- Run after 20260930020000_disconnect.sql.

alter table public.talent_records
  add column if not exists connected_at timestamptz;

alter table public.talent_records
  add column if not exists request_user_id uuid references public.profiles (id) on delete set null;

update public.talent_records
set connected_at = created_at
where linked_user_id is not null
  and connected_at is null
  and status in ('active', 'disconnected');

do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'talent_records'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%status%'
  limit 1;

  if constraint_name is not null then
    execute format(
      'alter table public.talent_records drop constraint %I',
      constraint_name
    );
  end if;
end $$;

alter table public.talent_records
  add constraint talent_records_status_check
  check (status in ('record', 'invited', 'active', 'disconnected', 'requested'));

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

drop trigger if exists talent_records_stamp_connected on public.talent_records;
create trigger talent_records_stamp_connected
  before update of status, linked_user_id on public.talent_records
  for each row execute function public.stamp_connected_at();

create or replace function public.agency_can_see_content(
  p_owner uuid,
  p_record uuid,
  p_created timestamptz,
  p_agency_visible boolean
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_agency_visible and exists (
    select 1
    from public.talent_records t
    where t.agency_id = (select auth.uid())
      and (
        (
          p_record is not null
          and t.id = p_record
        )
        or (
          t.status = 'active'
          and t.connected_at is not null
          and p_owner is not null
          and t.linked_user_id = p_owner
          and p_created >= t.connected_at
        )
        or (
          t.status in ('disconnected', 'requested')
          and t.connected_at is not null
          and t.disconnected_at is not null
          and p_owner is not null
          and t.linked_user_id = p_owner
          and p_created >= t.connected_at
          and p_created <= t.disconnected_at
        )
      )
  );
$$;

-- Invite code when the email has no account. Request when it does.
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
          updated_at = now()
      where id = rec.id
        and status = 'disconnected';
    return 'request';
  end if;

  if clean_email is null then
    clean_email := nullif(lower(trim(coalesce(rec.email, ''))), '');
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
        updated_at = now()
    where id = rec.id
      and linked_user_id is null;

  return code;
end;
$$;

create or replace function public.respond_connection_request(p_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec public.talent_records%rowtype;
begin
  select * into rec
  from public.talent_records
  where id = p_id
    and status = 'requested'
    and (request_user_id = uid or linked_user_id = uid);

  if not found then
    raise exception 'Connection request not found';
  end if;

  if not p_accept then
    if rec.linked_user_id is not null then
      update public.talent_records
        set status = 'disconnected',
            request_user_id = null,
            updated_at = now()
        where id = rec.id
          and status = 'requested';
    else
      update public.talent_records
        set status = 'record',
            request_user_id = null,
            updated_at = now()
        where id = rec.id
          and status = 'requested';
    end if;
    return;
  end if;

  if exists (
    select 1 from public.talent_records
    where linked_user_id = uid
      and status = 'active'
      and id <> rec.id
  ) then
    raise exception 'Disconnect from your current agency first';
  end if;

  if rec.linked_user_id is not null and rec.disconnected_at is not null then
    update public.content_items
      set agency_visible = false
    where owner_id = rec.linked_user_id
      and created_at > rec.disconnected_at
      and (talent_record_id is null or talent_record_id <> rec.id);
  end if;

  update public.talent_records
    set status = 'active',
        linked_user_id = uid,
        request_user_id = null,
        connected_at = coalesce(connected_at, now()),
        disconnected_at = null,
        updated_at = now()
    where id = rec.id
      and status = 'requested';

  update public.content_items
    set owner_id = uid
  where talent_record_id = rec.id
    and owner_id is null;
end;
$$;

revoke all on function public.respond_connection_request(uuid, boolean) from public;
grant execute on function public.respond_connection_request(uuid, boolean) to authenticated;

drop policy if exists talent_records_select_self on public.talent_records;
create policy talent_records_select_self
  on public.talent_records
  for select
  to authenticated
  using (
    linked_user_id = (select auth.uid())
    or request_user_id = (select auth.uid())
  );

drop policy if exists profiles_select_my_agency on public.profiles;
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

  if clean_status = 'invited' and clean_email is null then
    raise exception 'Add an email to send an invite';
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
    row_status := 'requested';
    request_for := talent_id;
    code := null;
  else
    row_status := clean_status;
    if clean_status = 'invited' then
      code := public.generate_invite_code();
    end if;
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
