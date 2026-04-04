/**
 * migrate-from-base44.mjs
 *
 * Migrates all Base44 entity data into Supabase tables.
 * Run with Node 18+ after setting the required env vars:
 *
 *   export B44_APP_ID=...
 *   export B44_TOKEN=...          # admin token from Base44 dashboard
 *   export VITE_SUPABASE_URL=...
 *   export SUPABASE_SERVICE_ROLE_KEY=...   # service_role key — NOT anon
 *
 *   node scripts/migrate-from-base44.mjs
 *
 * Run against a staging Supabase project first and verify row counts before
 * running against production.
 */

import { createClient as createBase44 } from '@base44/sdk';
import { createClient as createSupabase } from '@supabase/supabase-js';

// ── Config ────────────────────────────────────────────────────────────────────

const B44_APP_ID = process.env.B44_APP_ID;
const B44_TOKEN  = process.env.B44_TOKEN;
const B44_URL    = process.env.B44_URL || 'https://api.base44.com';
const SB_URL     = process.env.VITE_SUPABASE_URL;
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!B44_APP_ID || !B44_TOKEN || !SB_URL || !SB_SERVICE) {
  console.error('Missing required env vars:');
  if (!B44_APP_ID)  console.error('  B44_APP_ID');
  if (!B44_TOKEN)   console.error('  B44_TOKEN');
  if (!SB_URL)      console.error('  VITE_SUPABASE_URL');
  if (!SB_SERVICE)  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const base44   = createBase44({ appId: B44_APP_ID, serverUrl: B44_URL, token: B44_TOKEN });
const supabase = createSupabase(SB_URL, SB_SERVICE);

// ── Helpers ───────────────────────────────────────────────────────────────────

async function insert(table, rows) {
  if (!rows.length) { console.log(`  (no rows for ${table})`); return; }
  const { error } = await supabase.from(table).insert(rows);
  if (error) {
    console.error(`  [${table}] insert error: ${error.message}`);
    console.error('  First row:', JSON.stringify(rows[0], null, 2));
  }
}

// ── Step 1: Users → Supabase Auth + profiles ──────────────────────────────────

console.log('\n[1/9] Migrating users...');
const users    = await base44.entities.User.list();
const userIdMap = {}; // base44_id → supabase_uuid

for (const u of users) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: u.email,
    email_confirm: true,
    user_metadata: { full_name: u.full_name || u.fullName || '' },
  });
  if (error) {
    console.error(`  Auth create failed for ${u.email}: ${error.message}`);
    continue;
  }

  userIdMap[u.id] = data.user.id;

  const { error: profileError } = await supabase.from('profiles').upsert({
    id:                       data.user.id,
    full_name:                u.full_name                ?? u.fullName                ?? null,
    username:                 u.username                 ?? null,
    email:                    u.email,
    profile_picture_url:      u.profile_picture_url      ?? u.profilePictureUrl      ?? null,
    phone_number:             u.phone_number             ?? u.phoneNumber             ?? null,
    date_of_birth:            u.date_of_birth            ?? u.dateOfBirth             ?? null,
    training_status:          u.training_status          ?? u.trainingStatus          ?? null,
    blood_type:               u.blood_type               ?? u.bloodType               ?? null,
    health_status:            u.health_status            ?? u.healthStatus            ?? null,
    medical_needs:            u.medical_needs            ?? u.medicalNeeds            ?? null,
    dietary_requirements:     u.dietary_requirements     ?? u.dietaryRequirements     ?? null,
    emergency_contact_name:   u.emergency_contact_name   ?? u.emergencyContactName    ?? null,
    emergency_contact_number: u.emergency_contact_number ?? u.emergencyContactNumber  ?? null,
    organizer_code:           u.organizer_code           ?? u.organizerCode           ?? null,
    intended_role:            u.intended_role            ?? u.intendedRole            ?? null,
    certification_files:      u.certification_files      ?? u.certificationFiles      ?? null,
    bank_accounts:            u.bank_accounts            ?? u.bankAccounts            ?? null,
    social_profiles:          u.social_profiles          ?? u.socialProfiles          ?? null,
  });
  if (profileError) console.error(`  Profile upsert failed for ${u.email}: ${profileError.message}`);
}
console.log(`  ✓ ${users.length} users processed (${Object.keys(userIdMap).length} succeeded)`);

// ── Step 2: Refuges ───────────────────────────────────────────────────────────

console.log('\n[2/9] Migrating refuges...');
const refuges = await base44.entities.Refuge.list();
await insert('refuges', refuges.map(r => ({
  name:        r.name,
  altitude_m:  r.altitude_m  ?? r.altitudeM  ?? null,
  location:    r.location    ?? null,
  description: r.description ?? null,
  latitude:    r.latitude    ?? null,
  longitude:   r.longitude   ?? null,
  image_url:   r.image_url   ?? r.imageUrl   ?? null,
})));
console.log(`  ✓ ${refuges.length} refuges`);

// ── Step 3: Mountain Guides ───────────────────────────────────────────────────

console.log('\n[3/9] Migrating mountain guides...');
const guides = await base44.entities.MountainGuide.list();
await insert('mountain_guides', guides.map(g => ({
  full_name:         g.full_name         ?? g.fullName         ?? null,
  profile_image_url: g.profile_image_url ?? g.profileImageUrl  ?? null,
  bio:               g.bio               ?? null,
  location:          g.location          ?? null,
  certifications:    g.certifications    ?? null,
})));
console.log(`  ✓ ${guides.length} guides`);

// ── Step 4: Organizers ────────────────────────────────────────────────────────

console.log('\n[4/9] Migrating organizers...');
const organizers = await base44.entities.Organizer.list();
await insert('organizers', organizers.map(o => ({
  organizer_code:       o.organizer_code       ?? o.organizerCode       ?? null,
  full_name:            o.full_name             ?? o.fullName             ?? null,
  username:             o.username              ?? null,
  bio:                  o.bio                   ?? null,
  profile_image_url:    o.profile_image_url     ?? o.profileImageUrl     ?? null,
  location:             o.location              ?? null,
  verified:             o.verified              ?? false,
  payment_instructions: o.payment_instructions  ?? o.paymentInstructions ?? null,
  plan:                 o.plan                  ?? 'free',
  plan_expires_at:      o.plan_expires_at       ?? o.planExpiresAt       ?? null,
})));
console.log(`  ✓ ${organizers.length} organizers`);

// ── Step 5: Hiking Trips ──────────────────────────────────────────────────────

console.log('\n[5/9] Migrating hiking trips...');
const trips    = await base44.entities.HikingTrip.list();
const tripIdMap = {}; // base44_id → supabase_uuid

for (const t of trips) {
  const { data, error } = await supabase.from('hiking_trips').insert({
    title:            t.title,
    description:      t.description      ?? null,
    location:         t.location         ?? null,
    start_date:       t.start_date       ?? t.startDate       ?? null,
    end_date:         t.end_date         ?? t.endDate         ?? null,
    price:            t.price            ?? 0,
    pricing_options:  t.pricing_options  ?? t.pricingOptions  ?? [],
    total_attendees:  t.total_attendees  ?? t.totalAttendees  ?? 10,
    difficulty:       t.difficulty       ?? 'moderate',
    distance_km:      t.distance_km      ?? t.distanceKm      ?? null,
    elevation_gain_m: t.elevation_gain_m ?? t.elevationGainM  ?? null,
    image_url:        t.image_url        ?? t.imageUrl        ?? null,
    status:           t.status           ?? 'upcoming',
    organizer_code:   t.organizer_code   ?? t.organizerCode   ?? null,
    event_url:        t.event_url        ?? t.eventUrl        ?? null,
    tags:             t.tags             ?? [],
    requirements:     t.requirements     ?? [],
    departure_from:   t.departure_from   ?? t.departureFrom   ?? [],
    cancel_policy:    t.cancel_policy    ?? t.cancelPolicy    ?? null,
    latitude:         t.latitude         ?? null,
    longitude:        t.longitude        ?? null,
    view_count:       t.view_count       ?? t.viewCount       ?? 0,
  }).select('id').single();
  if (error) { console.error(`  Trip insert failed (${t.title}): ${error.message}`); continue; }
  tripIdMap[t.id] = data.id;
}
console.log(`  ✓ ${trips.length} trips processed (${Object.keys(tripIdMap).length} succeeded)`);

// ── Step 6: Bookings ──────────────────────────────────────────────────────────

console.log('\n[6/9] Migrating bookings...');
const bookings = await base44.entities.Booking.list();
const mappedBookings = bookings.map(b => ({
  trip_id:              tripIdMap[b.trip_id ?? b.tripId]  ?? null,
  user_id:              userIdMap[b.user_id ?? b.userId]  ?? null,
  status:               b.status              ?? 'pending',
  number_of_people:     b.number_of_people    ?? b.numberOfPeople  ?? 1,
  notes:                b.notes               ?? null,
  pricing_option_label: b.pricing_option_label ?? b.pricingOptionLabel ?? null,
  price_per_person:     b.price_per_person    ?? b.pricePerPerson   ?? 0,
  total_price:          b.total_price         ?? b.totalPrice       ?? 0,
  created_at:           b.created_at          ?? b.createdAt        ?? new Date().toISOString(),
})).filter(b => {
  if (!b.trip_id) { console.warn('  Skipping booking: trip_id not resolved'); return false; }
  if (!b.user_id) { console.warn('  Skipping booking: user_id not resolved'); return false; }
  return true;
});
await insert('bookings', mappedBookings);
console.log(`  ✓ ${mappedBookings.length} / ${bookings.length} bookings inserted`);

// ── Step 7: Notifications ─────────────────────────────────────────────────────

console.log('\n[7/9] Migrating notifications...');
const notifications = await base44.entities.Notification.list();
const mappedNotifs = notifications.map(n => ({
  user_id:    userIdMap[n.user_id ?? n.userId] ?? null,
  title:      n.title     ?? '',
  message:    n.message   ?? null,
  link:       n.link      ?? null,
  is_read:    n.is_read   ?? n.isRead   ?? false,
  created_at: n.created_at ?? n.createdAt ?? new Date().toISOString(),
})).filter(n => n.user_id);
await insert('notifications', mappedNotifs);
console.log(`  ✓ ${mappedNotifs.length} / ${notifications.length} notifications inserted`);

// ── Step 8: Organizer Follows ─────────────────────────────────────────────────

console.log('\n[8/9] Migrating organizer follows...');
const follows = await base44.entities.OrganizerFollow.list();
const mappedFollows = follows.map(f => ({
  user_id:        userIdMap[f.user_id ?? f.userId]    ?? null,
  organizer_code: f.organizer_code ?? f.organizerCode ?? null,
})).filter(f => f.user_id && f.organizer_code);
await insert('organizer_follows', mappedFollows);
console.log(`  ✓ ${mappedFollows.length} / ${follows.length} follows inserted`);

// ── Step 9: Send password-reset emails ────────────────────────────────────────

console.log('\n[9/9] Sending password reset emails...');
let resetCount = 0;
for (const supabaseId of Object.values(userIdMap)) {
  const { data: { user } } = await supabase.auth.admin.getUserById(supabaseId);
  if (!user?.email) continue;
  const { error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: user.email,
  });
  if (error) console.warn(`  Reset link failed for ${user.email}: ${error.message}`);
  else resetCount++;
}
console.log(`  ✓ ${resetCount} password reset links generated`);

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n✅ Migration complete.');
console.log(`   Users migrated:  ${Object.keys(userIdMap).length} / ${users.length}`);
console.log(`   Trips migrated:  ${Object.keys(tripIdMap).length} / ${trips.length}`);
console.log('\nNext steps:');
console.log('  1. Run the verification SQL queries in the Supabase SQL editor.');
console.log('  2. Log in as a migrated user (after password reset) and verify data.');
console.log('  3. After confirming production migration, run Step 4 cleanup (see migration plan).');
