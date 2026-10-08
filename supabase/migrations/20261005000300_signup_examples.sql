-- Signup and starter examples.
-- Creating an account saves the profile, uses the invite, links a roster
-- card when the code belongs to one, and moves deals logged on that card
-- onto the new account. A sample deal (and, for a waitlist talent, a
-- sample idea) is added so Payments and P&L are not empty.
-- Run last, after 20261005000200_content.sql.

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
declare
  new_id uuid;
  money_code text;
begin
  select nullif(trim(p.currency), '') into money_code
  from public.profiles p
  where p.id = p_owner;

  if money_code is null and p_record is not null then
    select nullif(trim(t.currency), '') into money_code
    from public.talent_records t
    where t.id = p_record;
  end if;

  money_code := coalesce(money_code, 'USD');

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
    currency,
    payment_terms,
    date_delivered,
    date_invoiced,
    date_paid,
    agency_visible,
    agency_created
  )
  values (
    p_owner,
    p_record,
    'Sample paid collab',
    'Instagram',
    'Example',
    'paid_collab',
    'Sample brand',
    case when p_owner is null then 'delivered' else 'concept' end,
    'A sample collab so you can see how Payments and P&L work. Delete it anytime.',
    1000,
    money_code,
    'net_30',
    now(),
    now(),
    now(),
    p_agency_visible,
    p_record is not null
  )
  returning id into new_id;

  insert into public.content_deliverables (content_id, type, quantity, rate)
  values (new_id, 'video', 1, 1000);

  insert into public.content_expenses (
    content_id, category, amount, note, expense_date, currency
  )
  values (
    new_id, 'editor', 150, 'Example expense. Delete it anytime.', current_date, money_code
  );
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke all on function public.seed_example_collab(uuid, uuid, boolean) from public;
revoke all on function public.seed_example_collab(uuid, uuid, boolean) from anon, authenticated;
revoke all on function public.handle_new_user() from public;
grant execute on function public.handle_new_user() to supabase_auth_admin;
