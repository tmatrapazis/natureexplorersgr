-- Nature Explorers v2 — 0002 functions & triggers

-- ============================================================
-- updated_at auto-touch
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','organizers','mountain_guides','regions','trips',
    'refuges','bookings','subscriptions'
  ]
  loop
    execute format(
      'create trigger trg_%1$s_updated before update on %1$s
         for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- ============================================================
-- Auto-create a profile row when a new auth user signs up
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- Slot availability — SECURITY DEFINER RPC (bypasses RLS for counts only)
-- Mirrors the legacy Booking.getTierAvailability() contract.
-- ============================================================
create or replace function get_tier_availability(p_trip_id uuid)
returns table (pricing_tier_id uuid, label text, price numeric, remaining integer)
language sql security definer set search_path = public as $$
  select id, label, price, remaining
  from pricing_tiers
  where trip_id = p_trip_id
  order by price asc;
$$;

grant execute on function get_tier_availability(uuid) to anon, authenticated;

-- ============================================================
-- Helper: is the current user the owner of a given organizer?
-- (used by RLS policies in 0003)
-- ============================================================
create or replace function is_organizer_owner(p_organizer_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from organizers o
    where o.id = p_organizer_id and o.owner_id = auth.uid()
  );
$$;

-- Helper: does the current user own the organizer that runs a given trip?
create or replace function owns_trip(p_trip_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from trips t
    join organizers o on o.id = t.organizer_id
    where t.id = p_trip_id and o.owner_id = auth.uid()
  );
$$;
