-- Nature Explorers v2 — 0001 init schema
-- Postgres / Supabase. Apply in order (0001 → 0002 → 0003). RLS is enabled in 0003.
-- Review with a DBA before production; column sets are intentionally pragmatic.

create extension if not exists pgcrypto;
create extension if not exists postgis;

-- ============================================================
-- Enums
-- ============================================================
create type user_role            as enum ('visitor','hiker','organizer');
create type verification_status  as enum ('pending','verified','rejected');
create type organizer_plan       as enum ('free','pro');
create type trip_difficulty      as enum ('easy','moderate','hard','expert');
create type trip_type            as enum ('day','multi_day');
create type trip_status          as enum ('draft','published','cancelled','completed');
create type booking_status       as enum ('pending','confirmed','paid','cancelled','declined');
create type balance_status       as enum ('scheduled','charged','failed','cancelled');
create type cancellation_preset  as enum ('day_standard','multiday_standard','graduated','flexible','custom');
create type refund_initiator     as enum ('hiker','organizer','system');
create type conversation_type    as enum ('booking','inquiry');
create type subscription_status  as enum ('active','past_due','canceled','incomplete');

-- ============================================================
-- profiles (1:1 with auth.users)
-- ============================================================
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          user_role   not null default 'hiker',
  full_name     text,
  avatar_url    text,
  locale        text        not null default 'el',
  explorer_rank text        default 'seedling',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- organizers
-- ============================================================
create table organizers (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references profiles(id) on delete cascade,
  slug                text unique not null,
  name                text not null,
  bio                 text,
  logo_url            text,
  mite_number         text,                       -- ΜΗ.Τ.Ε. tourism registry
  gemi_number         text,                       -- Γ.Ε.ΜΗ.
  verification_status verification_status not null default 'pending',
  plan                organizer_plan not null default 'free',
  plan_expires_at     timestamptz,
  stripe_account_id   text,
  payout_enabled      boolean not null default false,
  insurance_verified  boolean not null default false,
  tax_id              text,                        -- DAC7
  vat_number          text,                        -- DAC7
  legal_address       text,                        -- DAC7
  country             text default 'GR',           -- DAC7
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index organizers_owner_idx on organizers(owner_id);

-- ============================================================
-- mountain_guides
-- ============================================================
create table mountain_guides (
  id             uuid primary key default gen_random_uuid(),
  organizer_id   uuid not null references organizers(id) on delete cascade,
  slug           text unique not null,
  name           text not null,
  certifications text,
  bio            text,
  photo_url      text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index guides_org_idx on mountain_guides(organizer_id);

-- ============================================================
-- regions (SEO backbone)
-- ============================================================
create table regions (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name_en    text not null,
  name_el    text not null,
  intro_en   text,
  intro_el   text,
  center     geography(Point,4326),
  hero_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- cancellation_policies (must exist before trips)
-- ============================================================
create table cancellation_policies (
  id                 uuid primary key default gen_random_uuid(),
  organizer_id       uuid references organizers(id) on delete cascade,
  name               text not null,
  preset             cancellation_preset not null default 'day_standard',
  -- tiers: [{ "days_before": 7, "refund_pct": 100 }, ...] highest days_before first
  tiers              jsonb not null default '[{"days_before":7,"refund_pct":100}]',
  fee_follows_refund boolean not null default true,
  created_at         timestamptz not null default now()
);

-- ============================================================
-- trips
-- ============================================================
create table trips (
  id                      uuid primary key default gen_random_uuid(),
  organizer_id            uuid not null references organizers(id) on delete cascade,
  slug                    text unique not null,
  title_en                text not null,
  title_el                text not null,
  description_en          text,
  description_el          text,
  region_id               uuid references regions(id),
  meeting_point           geography(Point,4326),
  route_gpx_url           text,
  difficulty              trip_difficulty not null default 'moderate',
  distance_km             numeric,
  elevation_m             integer,
  duration                text,
  trip_type               trip_type not null default 'day',
  start_at                timestamptz,
  end_at                  timestamptz,
  status                  trip_status not null default 'draft',
  cover_image             text,
  gallery                 jsonb default '[]',
  gear_list               jsonb default '[]',
  is_promoted_calendar    boolean not null default false,
  promoted_calendar_until timestamptz,
  cancellation_policy_id  uuid references cancellation_policies(id),
  deposit_enabled         boolean not null default false,
  deposit_amount          numeric,          -- fixed deposit (or use pct)
  deposit_pct             numeric,          -- 0-100
  balance_due_days_before integer,          -- e.g. 14
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index trips_org_idx    on trips(organizer_id);
create index trips_region_idx on trips(region_id);
create index trips_status_idx on trips(status);
-- NOTE: enforce the "free plan ≤ 3 active (published, future) events" cap in app logic
-- or a BEFORE INSERT/UPDATE trigger keyed on organizers.plan.

-- ============================================================
-- pricing_tiers
-- ============================================================
create table pricing_tiers (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references trips(id) on delete cascade,
  label      text not null,
  price      numeric not null,
  currency   text not null default 'EUR',
  slots      integer not null default 0,   -- total
  remaining  integer not null default 0,   -- current availability
  created_at timestamptz not null default now()
);
create index tiers_trip_idx on pricing_tiers(trip_id);

-- ============================================================
-- refuges (unique high-intent SEO asset)
-- ============================================================
create table refuges (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  name_en        text not null,
  name_el        text not null,
  region_id      uuid references regions(id),
  elevation_m    integer,
  capacity       integer,
  contact        text,
  access_notes_en text,
  access_notes_el text,
  coords         geography(Point,4326),
  photos         jsonb default '[]',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index refuges_region_idx on refuges(region_id);

-- ============================================================
-- bookings
-- ============================================================
create table bookings (
  id                       uuid primary key default gen_random_uuid(),
  trip_id                  uuid not null references trips(id) on delete restrict,
  hiker_id                 uuid not null references profiles(id) on delete cascade,
  pricing_tier_id          uuid not null references pricing_tiers(id),
  party_size               integer not null default 1,
  status                   booking_status not null default 'pending',
  total_amount             numeric not null,
  platform_fee_amount      numeric not null default 0,   -- 5% (min €1.50, capped)
  currency                 text not null default 'EUR',
  stripe_payment_intent_id text,
  health_notes             text,                          -- SPECIAL CATEGORY — organizer-only (see RLS)
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index bookings_trip_idx  on bookings(trip_id);
create index bookings_hiker_idx on bookings(hiker_id);

-- ============================================================
-- payment_schedules (deposit + balance)
-- ============================================================
create table payment_schedules (
  id                       uuid primary key default gen_random_uuid(),
  booking_id               uuid not null references bookings(id) on delete cascade,
  deposit_amount           numeric not null default 0,
  deposit_paid_at          timestamptz,
  balance_amount           numeric not null default 0,
  balance_due_at           timestamptz,
  balance_charged_at       timestamptz,
  balance_status           balance_status not null default 'scheduled',
  stripe_payment_method_id text,          -- saved mandate for off-session charge
  created_at               timestamptz not null default now()
);
create index sched_due_idx on payment_schedules(balance_due_at) where balance_status = 'scheduled';

-- ============================================================
-- refunds
-- ============================================================
create table refunds (
  id                    uuid primary key default gen_random_uuid(),
  booking_id            uuid not null references bookings(id) on delete cascade,
  amount                numeric not null,
  platform_fee_refunded numeric not null default 0,
  reason                text,
  initiated_by          refund_initiator not null default 'hiker',
  stripe_refund_id      text,
  status                text,
  created_at            timestamptz not null default now()
);

-- ============================================================
-- reviews (only on paid bookings — enforced by RLS)
-- ============================================================
create table reviews (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null unique references bookings(id) on delete cascade,
  trip_id      uuid not null references trips(id) on delete cascade,
  organizer_id uuid not null references organizers(id) on delete cascade,
  hiker_id     uuid not null references profiles(id) on delete cascade,
  rating       integer not null check (rating between 1 and 5),
  body         text,
  photos       jsonb default '[]',
  created_at   timestamptz not null default now()
);
create index reviews_trip_idx on reviews(trip_id);

-- ============================================================
-- conversations + messages (in-app messaging)
-- ============================================================
create table conversations (
  id           uuid primary key default gen_random_uuid(),
  type         conversation_type not null default 'booking',
  booking_id   uuid references bookings(id) on delete cascade,
  trip_id      uuid references trips(id) on delete cascade,
  hiker_id     uuid not null references profiles(id) on delete cascade,
  organizer_id uuid not null references organizers(id) on delete cascade,
  created_at   timestamptz not null default now()
);
create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references profiles(id) on delete cascade,
  body            text,
  attachments     jsonb default '[]',
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index messages_conv_idx on messages(conversation_id);

-- ============================================================
-- sightings (community feed) — append-only
-- ============================================================
create table sightings (
  id         uuid primary key default gen_random_uuid(),
  hiker_id   uuid not null references profiles(id) on delete cascade,
  trip_id    uuid references trips(id) on delete set null,
  species    text,
  caption    text,
  photos     jsonb default '[]',
  location   geography(Point,4326),
  created_at timestamptz not null default now()
);
create index sightings_hiker_idx on sightings(hiker_id);

-- ============================================================
-- gamification
-- ============================================================
create table badges (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name_en     text not null,
  name_el     text not null,
  description text,
  icon_url    text
);
create table user_badges (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  badge_id   uuid not null references badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  unique (profile_id, badge_id)
);

-- ============================================================
-- subscriptions (organizer Pro)
-- ============================================================
create table subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  organizer_id           uuid not null references organizers(id) on delete cascade,
  stripe_subscription_id text unique,
  status                 subscription_status not null default 'incomplete',
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ============================================================
-- audit_log
-- ============================================================
create table audit_log (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references profiles(id),
  action     text not null,
  entity     text,
  entity_id  uuid,
  detail     jsonb,
  created_at timestamptz not null default now()
);
