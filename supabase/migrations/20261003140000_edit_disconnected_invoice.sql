-- An agency can update payment terms, invoice date, and paid date
-- on a disconnected deal snapshot. The talent's row is a different record.
-- Run after 20261003130000_deal_currency.sql.

create or replace function public.guard_agency_copy_invoice_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.agency_copy_of is null then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.owner_id is distinct from old.owner_id
     or new.talent_record_id is distinct from old.talent_record_id
     or new.title is distinct from old.title
     or new.platform is distinct from old.platform
     or new.niche is distinct from old.niche
     or new.type is distinct from old.type
     or new.brand_name is distinct from old.brand_name
     or new.stage is distinct from old.stage
     or new.go_live_date is distinct from old.go_live_date
     or new.shot_list is distinct from old.shot_list
     or new.notes is distinct from old.notes
     or new.idea_title is distinct from old.idea_title
     or new.fee_agreed is distinct from old.fee_agreed
     or new.currency is distinct from old.currency
     or new.created_at is distinct from old.created_at
     or new.agency_visible is distinct from old.agency_visible
     or new.talent_hidden_at is distinct from old.talent_hidden_at
     or new.agency_copy_of is distinct from old.agency_copy_of
     or (
       new.date_delivered is distinct from old.date_delivered
       and old.date_delivered is not null
     )
  then
    raise exception 'A disconnected snapshot only accepts payment terms, invoice date, and paid date';
  end if;

  return new;
end;
$$;

drop trigger if exists content_items_guard_agency_copy on public.content_items;
create trigger content_items_guard_agency_copy
  before update on public.content_items
  for each row execute function public.guard_agency_copy_invoice_update();

drop policy if exists content_update_own_or_agency on public.content_items;
create policy content_update_own_or_agency
  on public.content_items
  for update
  to authenticated
  using (
    (
      owner_id = (select auth.uid())
      and talent_hidden_at is null
      and agency_copy_of is null
    )
    or (
      agency_visible
      and agency_copy_of is null
      and public.is_agency_of_owner(owner_id)
    )
    or (
      owner_id is null
      and agency_visible
      and public.agency_owns_record(talent_record_id)
    )
    or (
      agency_copy_of is not null
      and agency_visible
      and public.agency_owns_record(talent_record_id)
    )
  )
  with check (
    (
      owner_id = (select auth.uid())
      and talent_hidden_at is null
      and agency_copy_of is null
    )
    or (
      agency_visible
      and agency_copy_of is null
      and public.is_agency_of_owner(owner_id)
    )
    or (
      owner_id is null
      and agency_visible
      and public.agency_owns_record(talent_record_id)
    )
    or (
      agency_copy_of is not null
      and agency_visible
      and public.agency_owns_record(talent_record_id)
    )
  );

drop policy if exists content_changes_insert on public.content_changes;
create policy content_changes_insert
  on public.content_changes
  for insert
  to authenticated
  with check (
    actor_id = (select auth.uid())
    and exists (
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
            c.agency_copy_of is null
            and public.is_agency_of_owner(c.owner_id)
          )
          or (
            c.owner_id is null
            and public.agency_owns_record(c.talent_record_id)
          )
          or (
            c.agency_copy_of is not null
            and c.agency_visible
            and public.agency_owns_record(c.talent_record_id)
          )
        )
    )
  );
