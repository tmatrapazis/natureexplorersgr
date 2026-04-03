import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Booking } from '@/api/db';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import BookingCard from './BookingCard';
import { Loader2, Inbox } from 'lucide-react';
import MobileSelect from '@/components/ui/MobileSelect';

/**
 * Full booking list for an organizer's trip.
 *
 * Props:
 *   tripId             — the trip UUID
 *   paymentInstructions — string to pass down to BookingCard
 */
export default function BookingList({ tripId, paymentInstructions }) {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['organizer-bookings-trip', tripId],
    queryFn: () => Booking.filter({ trip_id: tripId }),
    enabled: !!tripId,
    staleTime: 60 * 1000,
  });

  // Fetch hiker profiles for all bookings
  const hikerIds = [...new Set(bookings.map(b => b.user_id))];
  const { data: hikerProfiles = [] } = useQuery({
    queryKey: ['hiker-profiles', hikerIds.join(',')],
    queryFn: async () => {
      if (hikerIds.length === 0) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username, email, date_of_birth, blood_type, training_status, health_status, medical_needs, dietary_requirements, emergency_contact_name, emergency_contact_number')
        .in('id', hikerIds);
      return data || [];
    },
    enabled: hikerIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const profileMap = Object.fromEntries(hikerProfiles.map(p => [p.id, p]));

  const filtered = statusFilter === 'all'
    ? bookings
    : bookings.filter(b => b.status === statusFilter);

  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    paid: bookings.filter(b => b.status === 'paid').length,
    declined: bookings.filter(b => b.status === 'declined').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
        <Inbox className="w-8 h-8" />
        <p className="text-sm">No booking requests yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status filter */}
      <MobileSelect
        value={statusFilter}
        onValueChange={setStatusFilter}
        options={[
          { value: 'all',       label: `All (${counts.all})` },
          { value: 'pending',   label: `Pending (${counts.pending})` },
          { value: 'confirmed', label: `Confirmed (${counts.confirmed})` },
          { value: 'paid',      label: `Paid (${counts.paid})` },
          { value: 'declined',  label: `Declined (${counts.declined})` },
        ]}
        label="Filter by status"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No bookings with this status.</p>
      ) : (
        filtered.map(booking => (
          <BookingCard
            key={booking.id}
            booking={booking}
            hikerProfile={profileMap[booking.user_id] || null}
            paymentInstructions={paymentInstructions}
          />
        ))
      )}
    </div>
  );
}
