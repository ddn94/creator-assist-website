-- Remember when a talent declines a connection request.
-- A new request or invite code clears the mark so the card can ask again.

alter table public.talent_records
  add column if not exists declined_at timestamptz;

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
            declined_at = now(),
            updated_at = now()
        where id = rec.id
          and status = 'requested';
    else
      update public.talent_records
        set status = 'record',
            request_user_id = null,
            declined_at = now(),
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
        declined_at = null,
        updated_at = now()
    where id = rec.id
      and status = 'requested';

  update public.content_items
    set owner_id = uid
  where talent_record_id = rec.id
    and owner_id is null
    and agency_copy_of is null
    and talent_hidden_at is null;
end;
$$;
