-- Nature Explorers v2 — 0003 Row Level Security
-- Enable RLS on every table, then add policies. Review before production.
-- Principle: public reads only PUBLISHED/VERIFIED content; users touch only their own rows;
-- organizers touch only data for organizers they own; health data is organizer-scoped.

-- ------------------------------------------------------------
alter table profiles              enable row level security;
alter table organizers            enable row level security;
alter table mountain_guides       enable row level security;
alter table regions               enable row level security;
alter table cancellation_policies enable row level security;
alter table trips                 enable row level security;
alter table pricing_tiers         enable row level security;
alter table refuges               enable row level security;
alter table bookings              enable row level security;
alter table payment_schedules     enable row level security;
alter table refunds               enable row level security;
alter table reviews               enable row level security;
alter table conversations         enable row level security;
alter table messages              enable row level security;
alter table sightings             enable row level security;
alter table badges                enable row level security;
alter table user_badges           enable row level security;
alter table subscriptions         enable row level security;
alter table audit_log             enable row level security;

-- ============================================================
-- profiles
-- ============================================================
create policy profiles_read_all   on profiles for select using (true);
create policy profiles_update_own on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================
-- organizers  (public sees verified; owner sees/edits own)
-- ============================================================
create policy organizers_public_read on organizers for select
  using (verification_status = 'verified' or owner_id = auth.uid());
create policy organizers_owner_insert on organizers for insert with check (owner_id = auth.uid());
create policy organizers_owner_update on organizers for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ============================================================
-- mountain_guides
-- ============================================================
create policy guides_public_read on mountain_guides for select using (true);
create policy guides_owner_write on mountain_guides for all
  using (is_organizer_owner(organizer_id)) with check (is_organizer_owner(organizer_id));

-- ============================================================
-- regions / refuges / badges  (public read; writes = service role only)
-- ============================================================
create policy regions_public_read on regions for select using (true);
create policy refuges_public_read on refuges for select using (true);
create policy badges_public_read  on badges  for select using (true);

-- ============================================================
-- cancellation_policies  (public read; owner writes)
-- ============================================================
create policy cxl_public_read on cancellation_policies for select using (true);
create policy cxl_owner_write on cancellation_policies for all
  using (is_organizer_owner(organizer_id)) with check (is_organizer_owner(organizer_id));

-- ============================================================
-- trips  (public sees published; owner manages own)
-- ============================================================
create policy trips_public_read on trips for select
  using (status = 'published' or is_organizer_owner(organizer_id));
create policy trips_owner_write on trips for all
  using (is_organizer_owner(organizer_id)) with check (is_organizer_owner(organizer_id));

-- ============================================================
-- pricing_tiers  (public read; owner writes via parent trip)
-- ============================================================
create policy tiers_public_read on pricing_tiers for select using (true);
create policy tiers_owner_write on pricing_tiers for all
  using (owns_trip(trip_id)) with check (owns_trip(trip_id));

-- ============================================================
-- bookings
--   hiker: read/insert/update own
--   organizer: read (and update status) bookings for trips they own
--   NOTE: health_notes is a column; restrict column exposure in the API layer
--         so hikers/organizers only receive it where appropriate.
-- ============================================================
create policy bookings_hiker_read   on bookings for select using (hiker_id = auth.uid());
create policy bookings_hiker_insert on bookings for insert with check (hiker_id = auth.uid());
create policy bookings_hiker_update on bookings for update using (hiker_id = auth.uid());
create policy bookings_org_read     on bookings for select using (owns_trip(trip_id));
create policy bookings_org_update   on bookings for update using (owns_trip(trip_id));

-- ============================================================
-- payment_schedules / refunds  (visible to the booking's hiker or the trip owner)
-- ============================================================
create policy sched_read on payment_schedules for select using (
  exists (select 1 from bookings b where b.id = booking_id
          and (b.hiker_id = auth.uid() or owns_trip(b.trip_id))));
create policy refunds_read on refunds for select using (
  exists (select 1 from bookings b where b.id = booking_id
          and (b.hiker_id = auth.uid() or owns_trip(b.trip_id))));
-- Inserts/updates to schedules & refunds happen via Edge Functions (service role).

-- ============================================================
-- reviews  (public read; hiker may insert only for their own PAID booking)
-- ============================================================
create policy reviews_public_read on reviews for select using (true);
create policy reviews_hiker_insert on reviews for insert with check (
  hiker_id = auth.uid()
  and exists (select 1 from bookings b
              where b.id = booking_id and b.hiker_id = auth.uid() and b.status = 'paid')
);

-- ============================================================
-- conversations + messages  (participants only)
-- ============================================================
create policy conv_participant_read on conversations for select
  using (hiker_id = auth.uid() or is_organizer_owner(organizer_id));
create policy conv_participant_insert on conversations for insert
  with check (hiker_id = auth.uid() or is_organizer_owner(organizer_id));

create policy messages_participant_read on messages for select using (
  exists (select 1 from conversations c where c.id = conversation_id
          and (c.hiker_id = auth.uid() or is_organizer_owner(c.organizer_id))));
create policy messages_participant_insert on messages for insert with check (
  sender_id = auth.uid()
  and exists (select 1 from conversations c where c.id = conversation_id
              and (c.hiker_id = auth.uid() or is_organizer_owner(c.organizer_id))));

-- ============================================================
-- sightings  (public read for the community feed; owner writes own)
-- ============================================================
create policy sightings_public_read on sightings for select using (true);
create policy sightings_owner_write on sightings for all
  using (hiker_id = auth.uid()) with check (hiker_id = auth.uid());

-- ============================================================
-- user_badges  (read own; awards written by service role)
-- ============================================================
create policy user_badges_read_own on user_badges for select using (profile_id = auth.uid());

-- ============================================================
-- subscriptions  (organizer reads own; writes via Stripe webhook / service role)
-- ============================================================
create policy subs_owner_read on subscriptions for select using (is_organizer_owner(organizer_id));

-- ============================================================
-- audit_log  (no client access; service role only — leave without permissive policy)
-- ============================================================
