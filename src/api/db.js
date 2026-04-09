/**
 * db.js — Supabase data access layer
 *
 * Replaces all base44.entities.* calls.
 * Each function returns plain data (throws on error).
 */
import { supabase } from './supabaseClient';

// ─── helpers ────────────────────────────────────────────────────────────────

function throwOnError({ data, error }) {
  if (error) throw error;
  return data;
}

// ─── HikingTrip ──────────────────────────────────────────────────────────────

export const HikingTrip = {
  async list(orderBy = 'start_date', columns = '*') {
    const asc = !orderBy.startsWith('-');
    const col = orderBy.replace(/^-/, '');
    return throwOnError(
      await supabase.from('hiking_trips').select(columns).neq('status', 'draft').order(col, { ascending: asc })
    );
  },

  async filter(conditions = {}, orderBy = 'start_date', columns = '*') {
    const asc = !orderBy.startsWith('-');
    const col = orderBy.replace(/^-/, '');
    let q = supabase.from('hiking_trips').select(columns).order(col, { ascending: asc });
    Object.entries(conditions).forEach(([k, v]) => { q = q.eq(k, v); });
    return throwOnError(await q);
  },

  async get(id) {
    return throwOnError(
      await supabase.from('hiking_trips').select('*').eq('id', id).single()
    );
  },

  async create(data) {
    return throwOnError(
      await supabase.from('hiking_trips').insert(data).select().single()
    );
  },

  async update(id, data) {
    return throwOnError(
      await supabase.from('hiking_trips').update(data).eq('id', id).select().maybeSingle()
    );
  },

  async delete(id) {
    return throwOnError(
      await supabase.from('hiking_trips').delete().eq('id', id)
    );
  },
};

// ─── Organizer ───────────────────────────────────────────────────────────────

export const Organizer = {
  async list(orderBy = 'full_name', columns = '*') {
    const asc = !orderBy.startsWith('-');
    const col = orderBy.replace(/^-/, '');
    return throwOnError(
      await supabase.from('organizers').select(columns).order(col, { ascending: asc })
    );
  },

  async filter(conditions = {}, columns = '*') {
    let q = supabase.from('organizers').select(columns);
    Object.entries(conditions).forEach(([k, v]) => { q = q.eq(k, v); });
    return throwOnError(await q);
  },

  async create(data) {
    return throwOnError(
      await supabase.from('organizers').insert(data).select().single()
    );
  },

  async update(id, data) {
    return throwOnError(
      await supabase.from('organizers').update(data).eq('id', id).select().single()
    );
  },

  async updatePlan(organizerCode, plan, planExpiresAt = null) {
    return throwOnError(
      await supabase
        .from('organizers')
        .update({ plan, plan_expires_at: planExpiresAt })
        .eq('organizer_code', organizerCode)
        .select()
        .single()
    );
  },
};

// ─── Booking ─────────────────────────────────────────────────────────────────

export const Booking = {
  async list() {
    return throwOnError(
      await supabase.from('bookings').select('*').order('created_at', { ascending: false })
    );
  },

  async filter(conditions = {}) {
    let q = supabase.from('bookings').select('*').order('created_at', { ascending: false });
    Object.entries(conditions).forEach(([k, v]) => { q = q.eq(k, v); });
    return throwOnError(await q);
  },

  // Fetch bookings for multiple trips at once (organizer dashboard)
  async filterByTripIds(tripIds) {
    if (!tripIds || tripIds.length === 0) return [];
    return throwOnError(
      await supabase
        .from('bookings')
        .select('*')
        .in('trip_id', tripIds)
        .order('created_at', { ascending: false })
    );
  },

  async create(data) {
    return throwOnError(
      await supabase.from('bookings').insert(data).select().single()
    );
  },

  async update(id, data) {
    return throwOnError(
      await supabase.from('bookings').update(data).eq('id', id).select().single()
    );
  },

  async delete(id) {
    return throwOnError(
      await supabase.from('bookings').delete().eq('id', id)
    );
  },

  // Returns aggregate available slots per tier, bypassing RLS via SECURITY DEFINER function.
  // Result shape: { "Standard": 8, "Early Bird": 0 }
  // Tiers with no slot limit are omitted (treat as null = no cap).
  async getTierAvailability(tripId) {
    const { data, error } = await supabase.rpc('get_trip_tier_availability', { p_trip_id: tripId });
    if (error) throw error;
    return Object.fromEntries(
      (data || [])
        .filter(row => row.slots_remaining !== null)
        .map(row => [row.label, row.slots_remaining])
    );
  },
};

// ─── Promotion ────────────────────────────────────────────────────────────────

export const Promotion = {
  async getActive(type = null) {
    let q = supabase
      .from('promotions')
      .select('*, hiking_trips(*)')
      .eq('status', 'active')
      .gt('ends_at', new Date().toISOString());
    if (type) q = q.eq('type', type);
    return throwOnError(await q.order('created_at', { ascending: false }));
  },

  async filterByOrganizer(organizerCode) {
    return throwOnError(
      await supabase
        .from('promotions')
        .select('*, hiking_trips(title, start_date)')
        .eq('organizer_code', organizerCode)
        .order('created_at', { ascending: false })
    );
  },

  async create(data) {
    return throwOnError(
      await supabase.from('promotions').insert(data).select().single()
    );
  },

  async cancel(id) {
    return throwOnError(
      await supabase.from('promotions').update({ status: 'cancelled' }).eq('id', id).select().single()
    );
  },
};

// ─── Notification ─────────────────────────────────────────────────────────────

export const Notification = {
  async filter(conditions = {}) {
    let q = supabase.from('notifications').select('*').order('created_at', { ascending: false });
    Object.entries(conditions).forEach(([k, v]) => { q = q.eq(k, v); });
    return throwOnError(await q);
  },

  async create(data) {
    return throwOnError(
      await supabase.from('notifications').insert(data)
    );
  },

  async bulkCreate(rows) {
    return throwOnError(
      await supabase.from('notifications').insert(rows)
    );
  },

  async update(id, data) {
    return throwOnError(
      await supabase.from('notifications').update(data).eq('id', id).select().single()
    );
  },
};

// ─── OrganizerFollow ──────────────────────────────────────────────────────────

export const OrganizerFollow = {
  async filter(conditions = {}) {
    let q = supabase.from('organizer_follows').select('*');
    Object.entries(conditions).forEach(([k, v]) => { q = q.eq(k, v); });
    return throwOnError(await q);
  },

  async create(data) {
    return throwOnError(
      await supabase.from('organizer_follows').insert(data).select().single()
    );
  },

  async deleteMany(conditions = {}) {
    let q = supabase.from('organizer_follows').delete();
    Object.entries(conditions).forEach(([k, v]) => { q = q.eq(k, v); });
    return throwOnError(await q);
  },
};

// ─── MountainGuide ────────────────────────────────────────────────────────────

export const MountainGuide = {
  async list(orderBy = 'full_name') {
    const asc = !orderBy.startsWith('-');
    const col = orderBy.replace(/^-/, '');
    return throwOnError(
      await supabase.from('mountain_guides').select('*').order(col, { ascending: asc })
    );
  },

  async filter(conditions = {}) {
    let q = supabase.from('mountain_guides').select('*');
    Object.entries(conditions).forEach(([k, v]) => { q = q.eq(k, v); });
    return throwOnError(await q);
  },

  async create(data) {
    return throwOnError(
      await supabase.from('mountain_guides').insert(data).select().single()
    );
  },

  async update(id, data) {
    return throwOnError(
      await supabase.from('mountain_guides').update(data).eq('id', id).select().single()
    );
  },

  async delete(id) {
    return throwOnError(
      await supabase.from('mountain_guides').delete().eq('id', id)
    );
  },
};

// ─── Refuge ───────────────────────────────────────────────────────────────────

export const Refuge = {
  async list(orderBy = 'name') {
    return throwOnError(
      await supabase.from('refuges').select('*').order(orderBy, { ascending: true })
    );
  },
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export const Profile = {
  async get(id) {
    return throwOnError(
      await supabase.from('profiles').select('*').eq('id', id).single()
    );
  },

  async update(id, data) {
    return throwOnError(
      await supabase.from('profiles').update(data).eq('id', id).select().single()
    );
  },

  async delete(id) {
    // Deleting the auth user cascades to the profile via FK
    return throwOnError(
      await supabase.rpc('delete_user', { user_id: id })
    );
  },
};
