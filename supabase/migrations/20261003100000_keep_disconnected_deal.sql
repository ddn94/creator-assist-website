-- A talent delete after disconnect hides the deal from the talent.
-- The agency keeps the same row. A delete while still connected removes it
-- for both, as before.
-- Run after 20260930180000_content_changes.sql.

alter table public.content_items
  add column if not exists talent_hidden_at timestamptz;

-- True when a former agency should still see this row, and no current
-- agency should lose it.
create or replace function public.content_retained_by_disconnected_agency(
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
  select coalesce(p_agency_visible, false)
    and p_owner is not null
    and not exists (
      select 1
      from public.talent_records active
      where active.linked_user_id = p_owner
        and active.status = 'active'
        and active.connected_at is not null
        and (
          active.id = p_record
          or p_created >= active.connected_at
        )
    )
    and exists (
      select 1
      from public.talent_records former
      where former.linked_user_id = p_owner
        and former.status in ('disconnected', 'requested')
        and former.connected_at is not null
        and former.disconnected_at is not null
        and (
          former.id = p_record
          or (
            p_created >= former.connected_at
            and p_created <= former.disconnected_at
          )
        )
    );
$$;

create or replace function public.delete_owned_content(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.content_items%rowtype;
begin
  select * into row
  from public.content_items
  where id = p_id;

  if not found then
    raise exception 'Content not found';
  end if;

  if row.owner_id is distinct from (select auth.uid()) then
    raise exception 'You cannot delete this content';
  end if;

  if row.talent_hidden_at is not null then
    return;
  end if;

  update public.ideas
    set linked_content_id = null,
        status = 'idea'
  where linked_content_id = p_id;

  if public.content_retained_by_disconnected_agency(
    row.owner_id,
    row.talent_record_id,
    row.created_at,
    row.agency_visible
  ) then
    update public.content_items
      set talent_hidden_at = now()
    where id = p_id;
    return;
  end if;

  delete from public.content_items
  where id = p_id;
end;
$$;

revoke all on function public.content_retained_by_disconnected_agency(uuid, uuid, timestamptz, boolean) from public;
revoke all on function public.delete_owned_content(uuid) from public;
grant execute on function public.content_retained_by_disconnected_agency(uuid, uuid, timestamptz, boolean) to authenticated;
grant execute on function public.delete_owned_content(uuid) to authenticated;

drop policy if exists content_select_own_or_agency on public.content_items;
create policy content_select_own_or_agency
  on public.content_items
  for select
  to authenticated
  using (
    (
      owner_id = (select auth.uid())
      and talent_hidden_at is null
    )
    or public.agency_can_see_content(
      owner_id,
      talent_record_id,
      created_at,
      agency_visible
    )
  );

drop policy if exists content_update_own_or_agency on public.content_items;
create policy content_update_own_or_agency
  on public.content_items
  for update
  to authenticated
  using (
    (
      owner_id = (select auth.uid())
      and talent_hidden_at is null
    )
    or (
      agency_visible
      and public.is_agency_of_owner(owner_id)
    )
    or (
      owner_id is null
      and agency_visible
      and public.agency_owns_record(talent_record_id)
    )
  )
  with check (
    owner_id = (select auth.uid())
    or (
      agency_visible
      and public.is_agency_of_owner(owner_id)
    )
    or (
      owner_id is null
      and agency_visible
      and public.agency_owns_record(talent_record_id)
    )
  );

drop policy if exists content_delete_own_or_record on public.content_items;
create policy content_delete_own_or_record
  on public.content_items
  for delete
  to authenticated
  using (
    (
      owner_id = (select auth.uid())
      and not public.content_retained_by_disconnected_agency(
        owner_id,
        talent_record_id,
        created_at,
        agency_visible
      )
    )
    or (
      owner_id is null
      and public.agency_owns_record(talent_record_id)
    )
  );

drop policy if exists deliverables_select on public.content_deliverables;
create policy deliverables_select
  on public.content_deliverables
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.content_items c
      where c.id = content_id
        and (
          (
            c.owner_id = (select auth.uid())
            and c.talent_hidden_at is null
          )
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
      select 1
      from public.content_items c
      where c.id = content_id
        and (
          (
            c.owner_id = (select auth.uid())
            and c.talent_hidden_at is null
          )
          or public.agency_can_see_content(
            c.owner_id,
            c.talent_record_id,
            c.created_at,
            c.agency_visible
          )
        )
    )
  );

drop policy if exists content_changes_select on public.content_changes;
create policy content_changes_select
  on public.content_changes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.content_items c
      where c.id = content_id
        and (
          (
            c.owner_id = (select auth.uid())
            and c.talent_hidden_at is null
          )
          or public.agency_can_see_content(
            c.owner_id,
            c.talent_record_id,
            c.created_at,
            c.agency_visible
          )
        )
    )
  );
