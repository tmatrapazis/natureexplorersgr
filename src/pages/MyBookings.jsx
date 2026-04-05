import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Booking, HikingTrip, Organizer, Notification } from '@/api/db';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { sendBookingCancelledByHikerEmail } from '@/api/emailNotifications';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Inbox, CalendarDays, Users, Euro, ExternalLink, X } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { useLanguage } from '@/components/contexts/LanguageContext';
import { useTranslation } from '@/components/translations/useTranslations';
import PageWrapper from '@/components/layout/PageWrapper';
import useSEO from '@/components/seo/useSEO';

const STATUS_STYLES = {
  pending:   'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  paid:      'bg-[#f0e3c7]/40 text-[#0c281c] border-[#0c281c]/20',
  declined:  'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

export default function MyBookingsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const queryClient = useQueryClient();
  const [confirmCancelId, setConfirmCancelId] = useState(null);

  useSEO({ title: t('booking.my_bookings'), noindex: true });

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

  // Fetch organizers for confirmed bookings to show payment instructions
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
        confirmedOrganizerCodes.map(code =>
          Organizer.filter({ organizer_code: code }).then(r => r[0]).catch(() => null)
        )
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
            .select('id, email, full_name, username')
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
            // Email organizer (fire-and-forget)
            sendBookingCancelledByHikerEmail({
              organizerEmail: orgProfile.email,
              organizerName: orgProfile.full_name || orgProfile.username || '',
              hikerName,
              tripTitle: trip?.title || '',
              numberOfPeople: booking.number_of_people,
            });
          }
        }
      } catch {
        // Non-critical
      }
    },
    onSuccess: () => {
      toast.success(t('booking.cancelled_toast'));
      setConfirmCancelId(null);
      queryClient.invalidateQueries({ queryKey: ['my-bookings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
    onError: () => {
      toast.error(t('booking.cancel_failed_toast'));
    },
  });

  if (bookingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0c281c]" />
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto pb-20">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          {t('booking.my_bookings')}
        </h1>

        {bookings.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium mb-1">{t('booking.no_bookings_yet')}</p>
            <p className="text-sm mb-4">{t('booking.browse_available')}</p>
            <Link to={createPageUrl('Calendar')}>
              <Button className="bg-[#0c281c] hover:bg-[#0c281c]/90">
                {t('booking.explore_trips')}
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => {
              const trip = tripMap[booking.trip_id];
              const statusLabel = t(`booking.status_label_${booking.status}`) || booking.status;
              const organizer = organizerMap[trip?.organizer_code];
              const paymentInstructions = organizer?.payment_instructions;

              return (
                <Card key={booking.id} className="overflow-hidden">
                  <div className="p-4 space-y-3">
                    {/* Trip title + status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-semibold text-base text-foreground leading-snug">
                          {trip?.title || t('booking.trip_fallback')}
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
                          ? t('booking.person')
                          : t('booking.people')}
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
                        <p className="font-medium">{t('booking.msg_confirmed_payment')}</p>
                        {paymentInstructions ? (
                          <p className="whitespace-pre-line">{paymentInstructions}</p>
                        ) : (
                          <p>{t('booking.msg_confirmed_contact')}</p>
                        )}
                      </div>
                    ) : (
                      <p className={`text-sm rounded-lg px-3 py-2 ${
                        booking.status === 'paid'     ? 'bg-[#f0e3c7]/40 text-[#0c281c]' :
                        booking.status === 'declined' ? 'bg-red-50 text-red-700' :
                        'bg-muted/50 text-muted-foreground'
                      }`}>
                        {t(`booking.msg_${booking.status}`) || ''}
                      </p>
                    )}

                    {/* Cancel confirmation */}
                    {confirmCancelId === booking.id && (
                      <div className="flex items-center justify-between gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 font-medium">
                          {t('booking.cancel_confirm_prompt')}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setConfirmCancelId(null)}
                          >
                            {t('booking.cancel_no')}
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                            disabled={cancelMutation.isPending}
                            onClick={() => cancelMutation.mutate(booking)}
                          >
                            {cancelMutation.isPending
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : t('booking.cancel_yes')}
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
                            {t('booking.cancel_booking')}
                          </Button>
                        )}
                        {trip && (
                          <Link to={`${createPageUrl('TripDetails')}?id=${trip.id}`}>
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              {t('booking.view_trip')}
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
