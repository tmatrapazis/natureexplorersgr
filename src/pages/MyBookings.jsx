import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Booking, HikingTrip, Organizer, Notification } from '@/api/db';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Inbox, CalendarDays, Users, Euro, ExternalLink, X } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { useLanguage } from '@/components/contexts/LanguageContext';
import PageWrapper from '@/components/layout/PageWrapper';
import useSEO from '@/components/seo/useSEO';

const STATUS_STYLES = {
  pending:   'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  paid:      'bg-emerald-100 text-emerald-800 border-emerald-200',
  declined:  'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

const STATUS_LABELS = {
  pending:   { en: 'Pending Review',                el: 'Αναμονή Έγκρισης' },
  confirmed: { en: 'Confirmed — Awaiting Payment',  el: 'Εγκρίθηκε — Αναμονή Πληρωμής' },
  paid:      { en: 'Paid — Confirmed',              el: 'Πληρώθηκε — Επιβεβαιώθηκε' },
  declined:  { en: 'Declined',                      el: 'Απορρίφθηκε' },
  cancelled: { en: 'Cancelled',                     el: 'Ακυρώθηκε' },
};

const STATUS_MESSAGES = {
  pending:   { en: 'Your request has been sent. The organizer will review it shortly.', el: 'Το αίτημά σας εστάλη. Ο διοργανωτής θα το εξετάσει σύντομα.' },
  confirmed: { en: 'Your booking is confirmed! Please contact the organizer to arrange payment.', el: 'Η κράτησή σας εγκρίθηκε! Επικοινωνήστε με τον διοργανωτή για την πληρωμή.' },
  paid:      { en: 'Payment received. You\'re all set for the trip!', el: 'Η πληρωμή ελήφθη. Είστε έτοιμοι για την εκδρομή!' },
  declined:  { en: 'Your booking was not accepted. You may try booking another trip.', el: 'Η κράτησή σας δεν έγινε αποδεκτή.' },
  cancelled: { en: 'This booking was cancelled.', el: 'Αυτή η κράτηση ακυρώθηκε.' },
};

export default function MyBookingsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [confirmCancelId, setConfirmCancelId] = useState(null);

  useSEO({ title: 'My Bookings', noindex: true });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['my-bookings', user?.id],
    queryFn: () => Booking.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  // Fetch trip details for all bookings
  const tripIds = [...new Set(bookings.map(b => b.trip_id))];
  const { data: trips = [] } = useQuery({
    queryKey: ['booking-trips', tripIds.join(',')],
    queryFn: async () => {
      if (tripIds.length === 0) return [];
      const results = await Promise.all(tripIds.map(id => HikingTrip.get(id).catch(() => null)));
      return results.filter(Boolean);
    },
    enabled: tripIds.length > 0,
  });

  const tripMap = Object.fromEntries(trips.map(t => [t.id, t]));

  // Fetch organizers for confirmed bookings so we can show payment instructions
  const confirmedOrganizerCodes = [...new Set(
    bookings
      .filter(b => b.status === 'confirmed')
      .map(b => tripMap[b.trip_id]?.organizer_code)
      .filter(Boolean)
  )];
  const { data: organizers = [] } = useQuery({
    queryKey: ['booking-organizers', confirmedOrganizerCodes.join(',')],
    queryFn: async () => {
      if (confirmedOrganizerCodes.length === 0) return [];
      const results = await Promise.all(
        confirmedOrganizerCodes.map(code => Organizer.filter({ organizer_code: code }).then(r => r[0]).catch(() => null))
      );
      return results.filter(Boolean);
    },
    enabled: confirmedOrganizerCodes.length > 0,
  });
  const organizerMap = Object.fromEntries(organizers.map(o => [o.organizer_code, o]));

  const cancelMutation = useMutation({
    mutationFn: async (booking) => {
      await Booking.update(booking.id, { status: 'cancelled' });

      // Notify organizer
      try {
        const trip = tripMap[booking.trip_id];
        const organizerCode = trip?.organizer_code;
        if (organizerCode) {
          const { data: orgProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('organizer_code', organizerCode)
            .single();
          if (orgProfile?.id) {
            const hikerName = user.full_name || user.username || user.email;
            await Notification.create({
              user_id: orgProfile.id,
              title: `Booking cancelled for "${trip?.title || 'a trip'}"`,
              message: `${hikerName} cancelled their booking request (${booking.number_of_people} ${booking.number_of_people === 1 ? 'person' : 'people'}).`,
              link: '/managebookings',
              is_read: false,
            });
          }
        }
      } catch {
        // Non-critical
      }
    },
    onSuccess: () => {
      toast.success(language === 'el' ? 'Η κράτηση ακυρώθηκε.' : 'Booking cancelled.');
      setConfirmCancelId(null);
      queryClient.invalidateQueries({ queryKey: ['my-bookings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
    onError: () => {
      toast.error(language === 'el' ? 'Αποτυχία ακύρωσης.' : 'Failed to cancel booking.');
    },
  });

  if (bookingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto pb-20">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          {language === 'el' ? 'Οι Κρατήσεις μου' : 'My Bookings'}
        </h1>

        {bookings.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium mb-1">
              {language === 'el' ? 'Δεν έχετε κρατήσεις ακόμα.' : 'No bookings yet.'}
            </p>
            <p className="text-sm mb-4">
              {language === 'el' ? 'Εξερευνήστε τις διαθέσιμες εκδρομές.' : 'Browse available trips to get started.'}
            </p>
            <Link to={createPageUrl('Calendar')}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                {language === 'el' ? 'Εξερεύνηση Εκδρομών' : 'Explore Trips'}
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => {
              const trip = tripMap[booking.trip_id];
              const statusLabel = STATUS_LABELS[booking.status]?.[language] || booking.status;
              const statusMessage = STATUS_MESSAGES[booking.status]?.[language];
              const organizer = organizerMap[trip?.organizer_code];
              const paymentInstructions = organizer?.payment_instructions;

              return (
                <Card key={booking.id} className="overflow-hidden">
                  <div className="p-4 space-y-3">
                    {/* Trip title + status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-semibold text-base text-foreground leading-snug">
                          {trip?.title || booking.trip_title || (language === 'el' ? 'Εκδρομή' : 'Trip')}
                        </h2>
                        {trip?.start_date && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {format(new Date(trip.start_date), 'dd MMM yyyy')}
                          </p>
                        )}
                      </div>
                      <Badge className={`${STATUS_STYLES[booking.status]} border text-xs flex-shrink-0`}>
                        {statusLabel}
                      </Badge>
                    </div>

                    {/* Booking details */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {booking.number_of_people} {booking.number_of_people === 1
                          ? (language === 'el' ? 'άτομο' : 'person')
                          : (language === 'el' ? 'άτομα' : 'people')}
                      </span>
                      {booking.total_price > 0 && (
                        <span className="flex items-center gap-1">
                          <Euro className="w-3.5 h-3.5" />
                          {booking.total_price}
                        </span>
                      )}
                      {booking.pricing_option_label && (
                        <span className="text-xs">{booking.pricing_option_label}</span>
                      )}
                    </div>

                    {/* Status message */}
                    {booking.status === 'confirmed' ? (
                      <div className="text-sm rounded-lg px-3 py-2 bg-yellow-50 text-yellow-800 space-y-1">
                        <p className="font-medium">
                          {language === 'el'
                            ? 'Η κράτησή σας εγκρίθηκε! Παρακαλούμε προχωρήστε στην πληρωμή με έναν από τους παρακάτω τρόπους:'
                            : 'Your booking is confirmed! Please proceed with payment using one of the following methods:'}
                        </p>
                        {paymentInstructions ? (
                          <p className="whitespace-pre-line">{paymentInstructions}</p>
                        ) : (
                          <p>{language === 'el' ? 'Επικοινωνήστε με τον διοργανωτή για την πληρωμή.' : 'Please contact the organizer to arrange payment.'}</p>
                        )}
                      </div>
                    ) : statusMessage ? (
                      <p className={`text-sm rounded-lg px-3 py-2 ${
                        booking.status === 'paid'     ? 'bg-emerald-50 text-emerald-800' :
                        booking.status === 'declined' ? 'bg-red-50 text-red-700' :
                        'bg-muted/50 text-muted-foreground'
                      }`}>
                        {statusMessage}
                      </p>
                    ) : null}

                    {/* Cancel confirmation */}
                    {confirmCancelId === booking.id && (
                      <div className="flex items-center justify-between gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 font-medium">
                          {language === 'el' ? 'Να ακυρωθεί η κράτηση;' : 'Cancel this booking request?'}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setConfirmCancelId(null)}
                          >
                            {language === 'el' ? 'Όχι' : 'No'}
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                            disabled={cancelMutation.isPending}
                            onClick={() => cancelMutation.mutate(booking)}
                          >
                            {cancelMutation.isPending
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : (language === 'el' ? 'Ναι, ακύρωση' : 'Yes, cancel')}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
                      </span>
                      <div className="flex items-center gap-2">
                        {booking.status === 'pending' && confirmCancelId !== booking.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => setConfirmCancelId(booking.id)}
                          >
                            <X className="w-3 h-3 mr-1" />
                            {language === 'el' ? 'Ακύρωση' : 'Cancel'}
                          </Button>
                        )}
                        {trip && (
                          <Link to={`${createPageUrl('TripDetails')}?id=${trip.id}`}>
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              {language === 'el' ? 'Δες εκδρομή' : 'View trip'}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
