-- Creator Assist auth, profiles, waitlist, and agency talent records.
-- Run this entire script once in each Supabase project (staging and main):
-- Dashboard → SQL Editor → New query → paste → Run.
--
-- Auth emails (confirm + password reset) are sent by Supabase.
-- Waitlist and agency invite emails are sent by you. The codes live in
-- public.waitlist and public.talent_records.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('talent', 'agency')),
  display_name text,
  avatar_path text,
  agency_name text,
  country text,
  currency text,
  onboarding jsonb not null default '{}'::jsonb,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  invite_code text not null unique,
  created_at timestamptz not null default now(),
  consumed_at timestamptz,
  consumed_by uuid references auth.users (id) on delete set null
);

create table public.talent_records (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  email text,
  status text not null check (status in ('record', 'invited', 'active')),
  invite_code text unique,
  linked_user_id uuid references public.profiles (id) on delete set null,
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

-- ---------------------------------------------------------------------------
-- Profile guards
-- ---------------------------------------------------------------------------

create or replace function public.protect_profile()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.id := old.id;
  new.email := old.email;
  new.role := old.role;
  new.created_at := old.created_at;
  new.updated_at := now();
  if new.avatar_path is not null
     and new.avatar_path is distinct from (auth.uid()::text || '/avatar') then
    raise exception 'invalid avatar path';
  end if;
  return new;
end;
$$;

create trigger profiles_protect
  before update on public.profiles
  for each row execute function public.protect_profile();

-- ---------------------------------------------------------------------------
-- Invite codes
-- ---------------------------------------------------------------------------

create or replace function public.generate_invite_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i integer;
  n integer;
begin
  for n in 1..12 loop
    code := '';
    for i in 1..8 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::integer, 1);
    end loop;
    if not exists (select 1 from public.waitlist where invite_code = code)
       and not exists (select 1 from public.talent_records where invite_code = code) then
      return code;
    end if;
  end loop;
  raise exception 'Could not generate an invite code';
end;
$$;

create or replace function public.join_waitlist(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text := lower(trim(p_email));
begin
  if normalized !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email';
  end if;

  if exists (select 1 from public.waitlist where email = normalized) then
    return;
  end if;

  begin
    insert into public.waitlist (email, invite_code)
    values (normalized, public.generate_invite_code());
  exception
    when unique_violation then
      return;
  end;
end;
$$;

create or replace function public.lookup_invite(p_code text, p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  code text := upper(regexp_replace(coalesce(p_code, ''), '\s+', '', 'g'));
  email text := lower(trim(coalesce(p_email, '')));
  wl_email text;
  wl_consumed timestamptz;
  rec_email text;
  rec_status text;
  rec_linked uuid;
begin
  if code = '' or email = '' then
    return 'invalid';
  end if;

  select w.email, w.consumed_at
    into wl_email, wl_consumed
  from public.waitlist w
  where w.invite_code = code;

  if found then
    if wl_consumed is not null then
      return 'used';
    end if;
    if wl_email <> email then
      return 'email_mismatch';
    end if;
    return 'waitlist';
  end if;

  select t.email, t.status, t.linked_user_id
    into rec_email, rec_status, rec_linked
  from public.talent_records t
  where t.invite_code = code;

  if found then
    if rec_linked is not null or rec_status = 'active' then
      return 'used';
    end if;
    if rec_status <> 'invited' then
      return 'invalid';
    end if;
    if rec_email is null or lower(rec_email) <> email then
      return 'email_mismatch';
    end if;
    return 'talent';
  end if;

  return 'invalid';
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  code text := upper(regexp_replace(coalesce(new.raw_user_meta_data->>'invite_code', ''), '\s+', '', 'g'));
  chosen_role text := new.raw_user_meta_data->>'role';
  roster text := nullif(trim(coalesce(new.raw_user_meta_data->>'roster_size', '')), '');
  email text := lower(new.email);
  kind text;
  wl public.waitlist%rowtype;
  rec public.talent_records%rowtype;
begin
  if email is null or code = '' then
    raise exception 'invalid invite code';
  end if;

  kind := public.lookup_invite(code, email);

  if kind = 'waitlist' then
    if chosen_role not in ('talent', 'agency') then
      raise exception 'invalid role';
    end if;

    select * into wl from public.waitlist where invite_code = code;

    insert into public.profiles (id, email, role, onboarding)
    values (
      new.id,
      email,
      chosen_role,
      case
        when chosen_role = 'agency' and roster is not null
          then jsonb_build_object('rosterSize', roster)
        else '{}'::jsonb
      end
    );

    update public.waitlist
      set consumed_at = now(), consumed_by = new.id
      where id = wl.id and consumed_at is null;

    if not found then
      raise exception 'invite already used';
    end if;

    return new;
  end if;

  if kind = 'talent' then
    if chosen_role is distinct from 'talent' then
      raise exception 'this invite is for a talent account';
    end if;

    select * into rec from public.talent_records where invite_code = code;

    insert into public.profiles (id, email, role, display_name)
    values (new.id, email, 'talent', rec.name);

    update public.talent_records
      set linked_user_id = new.id,
          status = 'active',
          updated_at = now()
      where id = rec.id and linked_user_id is null;

    if not found then
      raise exception 'invite already used';
    end if;

    return new;
  end if;

  raise exception 'invalid invite code';
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Agency talent writes (the signed-in agency cannot set linked_user_id)
-- ---------------------------------------------------------------------------

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

  if clean_status = 'invited' then
    code := public.generate_invite_code();
  end if;

  insert into public.talent_records (
    agency_id,
    name,
    email,
    status,
    invite_code,
    platform,
    handle,
    followers,
    niche,
    notes,
    location,
    currency
  )
  values (
    uid,
    trim(p_name),
    clean_email,
    clean_status,
    code,
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
  code text;
begin
  select * into rec
  from public.talent_records
  where id = p_id and agency_id = uid;

  if not found then
    raise exception 'Talent record not found';
  end if;

  if rec.linked_user_id is not null or rec.status = 'active' then
    raise exception 'This talent already has an account';
  end if;

  if rec.status = 'invited' and rec.invite_code is not null then
    return rec.invite_code;
  end if;

  if clean_email is not null then
    rec.email := clean_email;
  end if;

  if rec.email is null then
    raise exception 'Add an email to send an invite';
  end if;

  code := public.generate_invite_code();

  update public.talent_records
    set email = rec.email,
        status = 'invited',
        invite_code = code,
        updated_at = now()
    where id = rec.id and linked_user_id is null;

  return code;
end;
$$;

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.waitlist enable row level security;
alter table public.talent_records enable row level security;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy talent_records_select_own
  on public.talent_records
  for select
  to authenticated
  using (agency_id = (select auth.uid()));

revoke all on public.waitlist from public, anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.talent_records to authenticated;

revoke all on function public.generate_invite_code() from public;
revoke all on function public.handle_new_user() from public;
revoke all on function public.protect_profile() from public;
revoke all on function public.join_waitlist(text) from public;
revoke all on function public.lookup_invite(text, text) from public;
revoke all on function public.agency_add_talent(text, text, text, text, text, integer, text, text) from public;
revoke all on function public.agency_invite_talent(uuid, text) from public;

grant execute on function public.join_waitlist(text) to anon, authenticated;
grant execute on function public.lookup_invite(text, text) to anon, authenticated;
grant execute on function public.agency_add_talent(text, text, text, text, text, integer, text, text) to authenticated;
grant execute on function public.agency_invite_talent(uuid, text) to authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;
grant execute on function public.protect_profile() to authenticated;

-- ---------------------------------------------------------------------------
-- Profile photos. Objects are public so the app can show them with a URL.
-- Path must be {user id}/avatar.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_read on storage.objects;
drop policy if exists avatars_insert_own on storage.objects;
drop policy if exists avatars_update_own on storage.objects;
drop policy if exists avatars_delete_own on storage.objects;

create policy avatars_read
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

create policy avatars_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy avatars_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy avatars_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
