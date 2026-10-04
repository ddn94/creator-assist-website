-- An invite or a request that was never joined can be removed.
-- That cancels the code or the request and deletes only that card.
-- A card they already joined stays.

create or replace function public.agency_delete_record(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if not exists (
    select 1 from public.profiles where id = uid and role = 'agency'
  ) then
    raise exception 'Only an agency can remove a record';
  end if;

  delete from public.talent_records
  where id = p_id
    and agency_id = uid
    and status in ('record', 'invited', 'requested')
    and linked_user_id is null;

  if not found then
    raise exception 'Only a card that has not been joined can be removed';
  end if;
end;
$$;
