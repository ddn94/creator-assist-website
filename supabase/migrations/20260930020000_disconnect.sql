-- Either a connected talent or their agency can disconnect.
-- The agency keeps content that existed at that moment. Later content stays
-- private to the talent. The talent keeps everything, including record deals.
-- Run after 20260929193000_example_data.sql.

alter table public.talent_records
  add column if not exists disconnected_at timestamptz;

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
  check (status in ('record', 'invited', 'active', 'disconnected'));

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

-- Read path: live link, an unclaimed record, or history up to disconnect.
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
          p_owner is null
          and t.id = p_record
          and t.status = 'record'
        )
        or (
          t.status = 'active'
          and p_owner is not null
          and t.linked_user_id = p_owner
        )
        or (
          t.status = 'disconnected'
          and t.disconnected_at is not null
          and p_created <= t.disconnected_at
          and (
            (p_owner is not null and t.linked_user_id = p_owner)
            or t.id = p_record
          )
        )
      )
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

create or replace function public.disconnect_talent_link(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec public.talent_records%rowtype;
begin
  select * into rec from public.talent_records where id = p_id;
  if not found then
    raise exception 'Talent record not found';
  end if;

  if rec.status <> 'active' or rec.linked_user_id is null then
    raise exception 'Only a connected talent can be disconnected';
  end if;

  if uid <> rec.agency_id and uid <> rec.linked_user_id then
    raise exception 'You cannot disconnect this talent';
  end if;

  update public.talent_records
    set status = 'disconnected',
        disconnected_at = now(),
        updated_at = now()
    where id = rec.id
      and status = 'active';

  if not found then
    raise exception 'Only a connected talent can be disconnected';
  end if;
end;
$$;

revoke all on function public.agency_can_see_content(uuid, uuid, timestamptz, boolean) from public;
revoke all on function public.agency_can_read_talent_profile(uuid) from public;
revoke all on function public.disconnect_talent_link(uuid) from public;
grant execute on function public.agency_can_see_content(uuid, uuid, timestamptz, boolean) to authenticated;
grant execute on function public.agency_can_read_talent_profile(uuid) to authenticated;
grant execute on function public.disconnect_talent_link(uuid) to authenticated;

drop policy if exists content_select_own_or_agency on public.content_items;
create policy content_select_own_or_agency
  on public.content_items
  for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    or public.agency_can_see_content(
      owner_id,
      talent_record_id,
      created_at,
      agency_visible
    )
  );

drop policy if exists deliverables_select on public.content_deliverables;
create policy deliverables_select
  on public.content_deliverables
  for select
  to authenticated
  using (
    exists (
      select 1 from public.content_items c
      where c.id = content_id
        and (
          c.owner_id = (select auth.uid())
          or public.agency_can_see_content(
            c.owner_id,
            c.talent_record_id,
            c.created_at,
            c.agency_visible
          )
        )
    )
  );

drop policy if exists expenses_select on public.content_expenses;
create policy expenses_select
  on public.content_expenses
  for select
  to authenticated
  using (
    exists (
      select 1 from public.content_items c
      where c.id = content_id
        and (
          c.owner_id = (select auth.uid())
          or public.agency_can_see_content(
            c.owner_id,
            c.talent_record_id,
            c.created_at,
            c.agency_visible
          )
        )
    )
  );

drop policy if exists profiles_select_linked_talent on public.profiles;
create policy profiles_select_linked_talent
  on public.profiles
  for select
  to authenticated
  using (public.agency_can_read_talent_profile(id));

drop policy if exists talent_records_select_self on public.talent_records;
create policy talent_records_select_self
  on public.talent_records
  for select
  to authenticated
  using (linked_user_id = (select auth.uid()));

drop policy if exists profiles_select_my_agency on public.profiles;
create policy profiles_select_my_agency
  on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.talent_records t
      where t.linked_user_id = (select auth.uid())
        and t.agency_id = profiles.id
        and t.status in ('active', 'disconnected')
    )
  );
