-- Agency can log content against a talent record before that person has an
-- account. Signup claims those rows onto the new profile (owner_id).
-- Run after 20260923200000_content.sql.

alter table public.content_items
  alter column owner_id drop not null;

alter table public.content_items
  add column talent_record_id uuid references public.talent_records (id) on delete cascade;

alter table public.content_items
  add constraint content_items_has_owner
  check (owner_id is not null or talent_record_id is not null);

create index content_items_talent_record_id_idx
  on public.content_items (talent_record_id);

create or replace function public.agency_owns_record(p_record uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.talent_records t
    where t.id = p_record
      and t.agency_id = (select auth.uid())
  );
$$;

-- Add is limited to a private record. Invited and active talent add their own.
create or replace function public.agency_can_add_record_content(p_record uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.talent_records t
    where t.id = p_record
      and t.agency_id = (select auth.uid())
      and t.status = 'record'
      and t.linked_user_id is null
  );
$$;

-- When the invite is consumed, the new account inherits record content.
create or replace function public.claim_record_content()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.linked_user_id is not null and old.linked_user_id is null then
    update public.content_items
      set owner_id = new.linked_user_id
      where talent_record_id = new.id
        and owner_id is null;
  end if;
  return new;
end;
$$;

drop trigger if exists talent_records_claim_content on public.talent_records;
create trigger talent_records_claim_content
  after update of linked_user_id on public.talent_records
  for each row execute function public.claim_record_content();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

drop policy if exists content_select_own_or_agency on public.content_items;
create policy content_select_own_or_agency
  on public.content_items
  for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    or public.is_agency_of_owner(owner_id)
    or public.agency_owns_record(talent_record_id)
  );

drop policy if exists content_insert_own on public.content_items;
create policy content_insert_own_or_record
  on public.content_items
  for insert
  to authenticated
  with check (
    (
      owner_id = (select auth.uid())
      and talent_record_id is null
    )
    or (
      owner_id is null
      and public.agency_can_add_record_content(talent_record_id)
    )
  );

drop policy if exists content_update_own_or_agency on public.content_items;
create policy content_update_own_or_agency
  on public.content_items
  for update
  to authenticated
  using (
    owner_id = (select auth.uid())
    or public.is_agency_of_owner(owner_id)
    or (
      owner_id is null
      and public.agency_owns_record(talent_record_id)
    )
  )
  with check (
    owner_id = (select auth.uid())
    or public.is_agency_of_owner(owner_id)
    or (
      owner_id is null
      and public.agency_owns_record(talent_record_id)
    )
  );

drop policy if exists content_delete_own on public.content_items;
create policy content_delete_own_or_record
  on public.content_items
  for delete
  to authenticated
  using (
    owner_id = (select auth.uid())
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
      select 1 from public.content_items c
      where c.id = content_id
        and (
          c.owner_id = (select auth.uid())
          or public.is_agency_of_owner(c.owner_id)
          or public.agency_owns_record(c.talent_record_id)
        )
    )
  );

drop policy if exists deliverables_write_own on public.content_deliverables;
create policy deliverables_write_own_or_record
  on public.content_deliverables
  for all
  to authenticated
  using (
    exists (
      select 1 from public.content_items c
      where c.id = content_id
        and (
          c.owner_id = (select auth.uid())
          or (
            c.owner_id is null
            and public.agency_owns_record(c.talent_record_id)
          )
        )
    )
  )
  with check (
    exists (
      select 1 from public.content_items c
      where c.id = content_id
        and (
          c.owner_id = (select auth.uid())
          or (
            c.owner_id is null
            and public.agency_owns_record(c.talent_record_id)
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
          or public.is_agency_of_owner(c.owner_id)
          or public.agency_owns_record(c.talent_record_id)
        )
    )
  );

drop policy if exists expenses_write_own on public.content_expenses;
create policy expenses_write_own_or_record
  on public.content_expenses
  for all
  to authenticated
  using (
    exists (
      select 1 from public.content_items c
      where c.id = content_id
        and (
          c.owner_id = (select auth.uid())
          or (
            c.owner_id is null
            and public.agency_owns_record(c.talent_record_id)
          )
        )
    )
  )
  with check (
    exists (
      select 1 from public.content_items c
      where c.id = content_id
        and (
          c.owner_id = (select auth.uid())
          or (
            c.owner_id is null
            and public.agency_owns_record(c.talent_record_id)
          )
        )
    )
  );

revoke all on function public.agency_owns_record(uuid) from public;
revoke all on function public.agency_can_add_record_content(uuid) from public;
grant execute on function public.agency_owns_record(uuid) to authenticated;
grant execute on function public.agency_can_add_record_content(uuid) to authenticated;
