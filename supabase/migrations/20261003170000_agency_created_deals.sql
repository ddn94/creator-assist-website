-- Deals an agency logs on a private card stay editable by both people
-- after the talent joins. Talent-created deals stay locked for the agency.
-- A disconnect still freezes a copy; that snapshot is not marked here.

alter table public.content_items
  add column if not exists agency_created boolean not null default false;

update public.content_items
set agency_created = true
where talent_record_id is not null
  and agency_copy_of is null;

drop policy if exists deliverables_write_own_or_record on public.content_deliverables;
create policy deliverables_write_own_or_record
  on public.content_deliverables
  for all
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
            and c.agency_copy_of is null
          )
          or (
            c.owner_id is null
            and public.agency_owns_record(c.talent_record_id)
          )
          or (
            c.agency_created
            and c.agency_visible
            and c.talent_hidden_at is null
            and c.agency_copy_of is null
            and public.is_agency_of_owner(c.owner_id)
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.content_items c
      where c.id = content_id
        and (
          (
            c.owner_id = (select auth.uid())
            and c.talent_hidden_at is null
            and c.agency_copy_of is null
          )
          or (
            c.owner_id is null
            and public.agency_owns_record(c.talent_record_id)
          )
          or (
            c.agency_created
            and c.agency_visible
            and c.talent_hidden_at is null
            and c.agency_copy_of is null
            and public.is_agency_of_owner(c.owner_id)
          )
        )
    )
  );

drop policy if exists expenses_write_own_or_record on public.content_expenses;
create policy expenses_write_own_or_record
  on public.content_expenses
  for all
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
            and c.agency_copy_of is null
          )
          or (
            c.owner_id is null
            and public.agency_owns_record(c.talent_record_id)
          )
          or (
            c.agency_created
            and c.agency_visible
            and c.talent_hidden_at is null
            and c.agency_copy_of is null
            and public.is_agency_of_owner(c.owner_id)
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.content_items c
      where c.id = content_id
        and (
          (
            c.owner_id = (select auth.uid())
            and c.talent_hidden_at is null
            and c.agency_copy_of is null
          )
          or (
            c.owner_id is null
            and public.agency_owns_record(c.talent_record_id)
          )
          or (
            c.agency_created
            and c.agency_visible
            and c.talent_hidden_at is null
            and c.agency_copy_of is null
            and public.is_agency_of_owner(c.owner_id)
          )
        )
    )
  );
