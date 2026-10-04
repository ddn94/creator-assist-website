-- "Save as a record" never looks up a talent account.
-- It does not send a connection request or create an invite code.
-- Only Invite (p_status = invited) can do either.

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
