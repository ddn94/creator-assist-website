-- Invite refuses an email that already belongs to an agency account.
-- No code is created and an existing private card is left unchanged.

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
