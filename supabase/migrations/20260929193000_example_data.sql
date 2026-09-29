-- One example paid collab (and, for a solo talent, one idea) on signup.
-- A talent who joins from an agency invite gets a private example. The
-- agency cannot read that row. The agency's own example is a record-only
-- person plus one paid collab, which the agency can see.
-- An agency can also delete a record-only talent. Content on that record
-- is removed with it. Invited and joined talent stay.
-- Run after 20260929180000_record_content.sql.

alter table public.content_items
  add column if not exists agency_visible boolean not null default true;

-- ---------------------------------------------------------------------------
-- Example rows
-- ---------------------------------------------------------------------------

create or replace function public.seed_example_collab(
  p_owner uuid,
  p_record uuid,
  p_agency_visible boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.content_items (
    owner_id,
    talent_record_id,
    title,
    platform,
    niche,
    type,
    brand_name,
    stage,
    notes,
    fee_agreed,
    payment_terms,
    date_delivered,
    date_invoiced,
    date_paid,
    agency_visible
  )
  values (
    p_owner,
    p_record,
    'Sample paid collab',
    'Instagram',
    'Example',
    'paid_collab',
    'Sample brand',
    'delivered',
    'Example deal so Payments and P&L are not empty. Delete it anytime.',
    1000,
    'net_30',
    now(),
    now(),
    now(),
    p_agency_visible
  );
end;
$$;

revoke all on function public.seed_example_collab(uuid, uuid, boolean) from public;
revoke all on function public.seed_example_collab(uuid, uuid, boolean) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Signup
-- ---------------------------------------------------------------------------

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
  sample_record uuid;
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

    if chosen_role = 'talent' then
      perform public.seed_example_collab(new.id, null, true);
      insert into public.ideas (owner_id, title, body, status)
      values (
        new.id,
        'Sample idea',
        'Example idea. Turn it into content, or delete it.',
        'idea'
      );
    elsif chosen_role = 'agency' then
      insert into public.talent_records (
        agency_id, name, status, platform, niche, notes
      )
      values (
        new.id,
        'Sample talent',
        'record',
        'Instagram',
        'Example',
        'Example person on your roster. Delete this when you add real talent.'
      )
      returning id into sample_record;
      perform public.seed_example_collab(null, sample_record, true);
    end if;

    return new;
  end if;

  if kind = 'talent' then
    if chosen_role is distinct from 'talent' then
      raise exception 'this invite is for a talent account';
    end if;

    select * into rec from public.talent_records where invite_code = code;

    insert into public.profiles (
      id, email, role, display_name, country, currency, onboarding
    )
    values (
      new.id,
      email,
      'talent',
      rec.name,
      rec.location,
      rec.currency,
      jsonb_strip_nulls(jsonb_build_object(
        'niche', nullif(trim(coalesce(rec.niche, '')), ''),
        'platforms',
          case
            when nullif(trim(coalesce(rec.platform, '')), '') is null then null
            else jsonb_build_array(
              jsonb_build_object(
                'platform', trim(rec.platform),
                'handle', coalesce(nullif(trim(coalesce(rec.handle, '')), ''), ''),
                'followers', greatest(coalesce(rec.followers, 0), 0)
              )
            )
          end
      ))
    );

    update public.talent_records
      set linked_user_id = new.id,
          status = 'active',
          platform = null,
          handle = null,
          followers = null,
          niche = null,
          location = null,
          currency = null,
          updated_at = now()
      where id = rec.id and linked_user_id is null;

    if not found then
      raise exception 'invite already used';
    end if;

    if not exists (
      select 1 from public.content_items where talent_record_id = rec.id
    ) then
      perform public.seed_example_collab(new.id, null, false);
    end if;

    return new;
  end if;

  raise exception 'invalid invite code';
end;
$$;

-- ---------------------------------------------------------------------------
-- Agency cannot read a private example
-- ---------------------------------------------------------------------------

drop policy if exists content_select_own_or_agency on public.content_items;
create policy content_select_own_or_agency
  on public.content_items
  for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    or (
      agency_visible
      and public.is_agency_of_owner(owner_id)
    )
    or (
      agency_visible
      and public.agency_owns_record(talent_record_id)
    )
  );

drop policy if exists content_update_own_or_agency on public.content_items;
create policy content_update_own_or_agency
  on public.content_items
  for update
  to authenticated
  using (
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
          or (
            c.agency_visible
            and public.is_agency_of_owner(c.owner_id)
          )
          or (
            c.agency_visible
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
          or (
            c.agency_visible
            and public.is_agency_of_owner(c.owner_id)
          )
          or (
            c.agency_visible
            and public.agency_owns_record(c.talent_record_id)
          )
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Delete a record-only talent
-- ---------------------------------------------------------------------------

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
    and status = 'record'
    and linked_user_id is null;

  if not found then
    raise exception 'Only a record that has not been invited can be removed';
  end if;
end;
$$;

revoke all on function public.agency_delete_record(uuid) from public;
grant execute on function public.agency_delete_record(uuid) to authenticated;
