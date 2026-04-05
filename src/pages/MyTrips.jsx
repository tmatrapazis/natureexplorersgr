import React, { useState, useCallback } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HikingTrip, Booking, OrganizerFollow, Organizer, Notification } from "@/api/db";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import PullToRefresh from '../components/ui/PullToRefresh';
import { format } from "date-fns";
import { toast } from "sonner";
import { createOptimisticTripDelete, createOptimisticTripUpdate } from "../lib/optimistic-mutations";
import MobileSelect from '../components/ui/MobileSelect';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, User as UserIcon, ClipboardList, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getComputedTripStatus, statusColors } from "../components/helpers/tripHelpers";
import { formatDateRange } from "../components/helpers/dateHelpers";
import { getTripInsights } from "../components/helpers/bookingHelpers";
import useSEO from '../components/seo/useSEO';
import PageWrapper from '../components/layout/PageWrapper';
import { useLanguage } from '../components/contexts/LanguageContext';
import { useTranslation } from '../components/translations/useTranslations';
import { getTripImage, handleImageError } from "../components/helpers/imageHelpers";
import OrganizerTripCard from "../components/trips/OrganizerTripCard";
import BookingList from "@/components/bookings/BookingList";
import { useOrganizerPlan } from "@/lib/useOrganizerPlan";
import UpgradePrompt from "@/components/upgrade/UpgradePrompt";

export default function MyTripsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("upcoming");

  const { language } = useLanguage();
  const { t } = useTranslation(language);

  // Prevent indexing - this is an authenticated page
  useSEO({
    title: t('organizer.my_trips'),
    description: 'Manage my hiking trips',
    noindex: true
  });

  const { user } = useAuth();
  const { isPremium, isExpired, organizer: organizerData } = useOrganizerPlan();

  const { data: trips = [], isLoading: tripsLoading, isError: tripsError } = useQuery({
    queryKey: ['my-trips', user?.organizer_code],
    queryFn: () => HikingTrip.filter({ organizer_code: user?.organizer_code }, "-start_date"),
    enabled: !!user?.organizer_code,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const { data: allBookings = [] } = useQuery({
    queryKey: ['all-bookings', user?.organizer_code],
    queryFn: async () => {
      if (!user?.organizer_code) return [];
      const orgTrips = await HikingTrip.filter({ organizer_code: user.organizer_code });
      if (!orgTrips || orgTrips.length === 0) return [];
      const tripIds = orgTrips.map(t => t.id);
      return Booking.filterByTripIds(tripIds);
    },
    enabled: !!user?.organizer_code,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Realtime: invalidate allBookings whenever any booking row changes (INSERT, UPDATE, DELETE)
  // so the organizer's slot counts stay accurate without a manual refresh.
  React.useEffect(() => {
    if (!user?.organizer_code) return;
    const channel = supabase
      .channel(`mytrips-bookings-${user.organizer_code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        queryClient.invalidateQueries({ queryKey: ['all-bookings', user.organizer_code] });
        queryClient.invalidateQueries({ queryKey: ['tier-availability'] });
      })
      .subscribe();
    return () => { channel.unsubscribe(); supabase.removeChannel(channel); };
  }, [user?.organizer_code, queryClient]);

  const deleteTripMutation = useMutation({
    mutationFn: async (/** @type {any} */ tripId) => {
      return await HikingTrip.delete(tripId);
    },
    // Optimistic: remove the trip from the cache immediately so the UI updates
    // without waiting for the server round-trip.
    onMutate: async (tripId) => {
      await queryClient.cancelQueries({ queryKey: ['my-trips', user?.organizer_code] });
      const previous = queryClient.getQueryData(['my-trips', user?.organizer_code]);
      queryClient.setQueryData(['my-trips', user?.organizer_code], (old) =>
        Array.isArray(old) ? old.filter(t => t.id !== tripId) : old
      );
      return { previous };
    },
    onError: (_err, _tripId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['my-trips', user?.organizer_code], context.previous);
      }
      toast.error(t('organizer.delete_trip_error'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['my-trips', user?.organizer_code] });
      queryClient.invalidateQueries({ queryKey: ['hiking-trips'] });
    },
  });

  // Notify all followers when a draft trip is published (status → upcoming) from MyTrips.
  const notifyFollowersOnPublish = async (trip) => {
    if (!user?.organizer_code) return;
    try {
      const [follows, organizers] = await Promise.all([
        OrganizerFollow.filter({ organizer_code: user.organizer_code }),
        Organizer.filter({ organizer_code: user.organizer_code }),
      ]);
      if (!follows || follows.length === 0) return;

      // Only notify followers who opted in to trip notifications (newsletter_subscribed)
      const { data: subscribedProfiles } = await supabase
        .from('profiles')
        .select('id')
        .in('id', follows.map(f => f.user_id))
        .eq('newsletter_subscribed', true);

      const subscribedIds = new Set((subscribedProfiles || []).map(p => p.id));
      const eligibleFollows = follows.filter(f => subscribedIds.has(f.user_id));
      if (eligibleFollows.length === 0) return;

      const organizerName = organizers?.[0]?.full_name || user?.full_name || user?.organizer_code;
      await Notification.bulkCreate(
        eligibleFollows.map(f => ({
          user_id: f.user_id,
          title: language === 'el'
            ? `Νέα εκδρομή από ${organizerName}`
            : `New trip from ${organizerName}`,
          message: `"${trip.title}"`,
          link: `/tripdetails?id=${trip.id}`,
          is_read: false,
        }))
      );
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    } catch {
      // Non-critical — don't block the status update on notification failure
    }
  };

  const updateTripStatusMutation = useMutation({
    mutationFn: async (/** @type {any} */ { tripId, status }) => {
      return await HikingTrip.update(tripId, { status });
    },
    // Optimistic: update the status in cache immediately.
    onMutate: async ({ tripId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['my-trips', user?.organizer_code] });
      const previous = queryClient.getQueryData(['my-trips', user?.organizer_code]);
      queryClient.setQueryData(['my-trips', user?.organizer_code], (old) =>
        Array.isArray(old)
          ? old.map(t => t.id === tripId ? { ...t, status } : t)
          : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['my-trips', user?.organizer_code], context.previous);
      }
      toast.error(t('organizer.status_update_error'));
    },
    onSuccess: async (_result, { tripId, status }) => {
      // Notify followers when organizer publishes a draft trip
      if (status === 'upcoming') {
        const prevTrip = trips?.find(t => t.id === tripId);
        if (prevTrip?.status === 'draft') {
          await notifyFollowersOnPublish(prevTrip);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['my-trips', user?.organizer_code] });
      queryClient.invalidateQueries({ queryKey: ['hiking-trips'] });
    },
  });

  const cancelTripMutation = useMutation({
    mutationFn: async (/** @type {any} */ { trip }) => {
      const tripBookings = allBookings?.filter(b => b.trip_id === trip.id && (b.status === "confirmed" || b.status === "pending")) || [];

      const notifications = [];
      const emailPromises = [];
      const bookingUpdatePromises = [];

      for (const booking of tripBookings) {
        const email = {
          to: booking.user_email,
          subject: `Trip Cancelled: ${trip.title}`,
          body: `
              <p>Hello ${booking.user_name},</p>
              <p>We're writing to inform you that the hiking trip "${trip.title}" scheduled for ${format(new Date(trip.start_date), "MMMM d, yyyy")} has been cancelled by the organizer.</p>
              <p>Your booking has been cancelled, and a full refund will be processed automatically. You don't need to take any action.</p>
              <p>We apologize for any inconvenience this may cause.</p>
              <p>Sincerely,<br/>The Nature Explorers Team</p>
          `
        };
        // TODO: send cancellation email via Supabase Edge Function

        notifications.push({
          user_id: booking.user_id,
          title: language === 'el' ? 'Εκδρομή Ακυρώθηκε' : 'Trip Cancelled',
          message: language === 'el'
            ? `Η εκδρομή "${trip.title}" ακυρώθηκε. Η επιστροφή χρημάτων είναι σε εξέλιξη.`
            : `Your trip "${trip.title}" has been cancelled. A refund is being processed.`,
          link: createPageUrl("HikerProfile"),
          is_read: false,
        });

        bookingUpdatePromises.push(Booking.update(booking.id, { status: 'cancelled' }));
      }

      // Emails are best-effort — a delivery failure should not block the cancellation
      const emailResults = await Promise.allSettled(emailPromises);
      emailResults.forEach((result, i) => {
        if (result.status === 'rejected') {
          console.error(`Failed to send cancellation email for booking ${tripBookings[i]?.id}:`, result.reason);
        }
      });

      await Promise.all(bookingUpdatePromises);
      if (notifications.length > 0) {
        await Notification.bulkCreate(notifications);
      }

      return await HikingTrip.update(trip.id, { status: "cancelled" });
    },
    onSuccess: () => {
      toast.success(t('organizer.trip_cancelled'));
      queryClient.invalidateQueries({ queryKey: ['my-trips'] });
      queryClient.invalidateQueries({ queryKey: ['all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
    onError: (error) => {
      console.error('Trip cancellation error:', error);
      toast.error(t('errors.generic'));
    },
  });

  const handleCancelTrip = (trip) => {
    if (window.confirm(t('organizer.cancel_trip_confirm'))) {
      cancelTripMutation.mutate({ trip });
    }
  };

  const handleDeleteTrip = (tripId) => {
    if (window.confirm(t('organizer.delete_trip_confirm'))) {
      deleteTripMutation.mutate(tripId);
    }
  };

  const handleStatusChange = (tripId, newStatus) => {
    updateTripStatusMutation.mutate({ tripId, status: newStatus });
  };

  const getBookingsForTrip = (tripId) => {
    return allBookings.filter(b => b.trip_id === tripId && b.status === "confirmed");
  };

  const getPendingBookingsForTrip = (tripId) => {
    return allBookings.filter(b => b.trip_id === tripId && b.status === "pending").length;
  };

  const isRequiredFieldsFilled = (trip) => {
    return trip.title && trip.start_date && trip.location && trip.difficulty && trip.organizer_code;
  };

  const handleRecreateTrip = (trip) => {
    const { id, created_date, updated_date, created_by, start_date, end_date, ...tripData } = trip;
    navigate(createPageUrl("TripForm"), { state: { tripData } });
  };

  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { draftTrips, upcomingTrips, happeningTrips, completedTrips, cancelledTrips } = React.useMemo(() => {
    const list = trips || [];
    return {
      draftTrips:     list.filter(t => t.status === 'draft'),
      upcomingTrips:  list.filter(t => (t.status === 'upcoming' || t.status === 'almost soldout') && new Date(t.start_date) > today),
      happeningTrips: list.filter(t => t.status !== 'cancelled' && t.status !== 'draft' && ((new Date(t.start_date) <= today && t.end_date && new Date(t.end_date) >= today) || t.status === 'happening now')),
      completedTrips: list.filter(t => t.status !== 'cancelled' && t.status !== 'draft' && (t.status === 'completed' || (t.end_date && new Date(t.end_date) < today))),
      cancelledTrips: list.filter(t => t.status === 'cancelled'),
    };
  }, [trips, today]);
  const cancellingTripId = /** @type {any} */(cancelTripMutation.variables)?.trip?.id;

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['my-trips', user?.organizer_code] }),
      queryClient.invalidateQueries({ queryKey: ['all-bookings', user?.organizer_code] }),
    ]);
  }, [queryClient, user?.organizer_code]);

  if (tripsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (tripsError) {
    return (
      <PageWrapper>
        <div className="max-w-5xl mx-auto pb-20 pt-8 text-center">
          <p className="text-muted-foreground mb-4">
            {t('organizer.failed_to_load')} {t('organizer.please_refresh')}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            {t('common.refresh')}
          </Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <PageWrapper>
      <div className="max-w-5xl mx-auto pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">{t('organizer.my_trips')}</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {user && (
              <Link to={`${createPageUrl("OrganizerProfile")}?code=${user.organizer_code}`} className="w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto min-h-[44px]"
                  aria-label={t('organizer.view_profile')}
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  {t('organizer.view_profile')}
                </Button>
              </Link>
            )}
            {(isPremium || isExpired) && (
              <Link to={createPageUrl("ManageBookings")} className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto min-h-[44px]"
                  aria-label={t('manage_bookings.title')}
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  {t('manage_bookings.title')}
                </Button>
              </Link>
            )}
            <Link to={createPageUrl("TripForm")} className="w-full sm:w-auto">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto min-h-[44px]"
              aria-label={t('organizer.create_new_trip')}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('organizer.create_new_trip')}
            </Button>
            </Link>
          </div>
        </div>

        {trips.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('organizer.no_trips')}</h3>
            <p className="text-muted-foreground mb-4">{t('organizer.no_trips_message')}</p>
            <Link to={createPageUrl("TripForm")}>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
                aria-label={t('organizer.create_first_trip')}
              >
                {t('organizer.create_first_trip')}
              </Button>
            </Link>
          </Card>
        ) : (
          <>
            {/* Desktop Tabs */}
            <div className="hidden md:block mb-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="draft">{t('organizer.tab_drafts')}</TabsTrigger>
                  <TabsTrigger value="upcoming">{t('organizer.tab_upcoming')}</TabsTrigger>
                  <TabsTrigger value="happening">{t('organizer.tab_happening')}</TabsTrigger>
                  <TabsTrigger value="completed">{t('organizer.tab_completed')}</TabsTrigger>
                  <TabsTrigger value="cancelled">{t('organizer.tab_cancelled')}</TabsTrigger>
                  <TabsTrigger value="bookings">{t('organizer.tab_bookings')}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Mobile Select Dropdown */}
            <div className="md:hidden mb-4">
              <MobileSelect
                value={activeTab}
                onValueChange={setActiveTab}
                options={[
                  { value: 'draft', label: t('organizer.tab_drafts') },
                  { value: 'upcoming', label: t('organizer.tab_upcoming') },
                  { value: 'happening', label: t('organizer.tab_happening') },
                  { value: 'completed', label: t('organizer.tab_completed') },
                  { value: 'cancelled', label: t('organizer.tab_cancelled') },
                  { value: 'bookings', label: t('organizer.tab_bookings') },
                ]}
                placeholder={t('organizer.select_category')}
                label={t('organizer.trip_category')}
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="draft">
              <div className="grid gap-6">
                {draftTrips.map(trip => (
                  <OrganizerTripCard key={trip.id} trip={trip} allBookings={allBookings} language={language} t={t} today={today}
                    onStatusChange={handleStatusChange} onCancel={handleCancelTrip} onDelete={handleDeleteTrip} onRecreate={handleRecreateTrip}
                    cancelMutationPending={cancelTripMutation.isPending} cancelMutationTripId={cancellingTripId}
                    deleteMutationPending={deleteTripMutation.isPending}
                    showCancel={false} showRecreate={false} showDelete={true} isRequiredFieldsFilled={isRequiredFieldsFilled}
                  />
                ))}
                {draftTrips.length === 0 && <div className="text-center py-10 text-muted-foreground">{t('organizer.no_trips_in_category')}</div>}
              </div>
            </TabsContent>

            <TabsContent value="upcoming">
              <div className="grid gap-6">
                {upcomingTrips.map(trip => (
                  <OrganizerTripCard key={trip.id} trip={trip} allBookings={allBookings} language={language} t={t} today={today}
                    onStatusChange={handleStatusChange} onCancel={handleCancelTrip} onDelete={handleDeleteTrip} onRecreate={handleRecreateTrip}
                    cancelMutationPending={cancelTripMutation.isPending} cancelMutationTripId={cancellingTripId}
                    deleteMutationPending={deleteTripMutation.isPending}
                    showCancel={true} showRecreate={false} showDelete={true}
                  />
                ))}
                {upcomingTrips.length === 0 && <div className="text-center py-10 text-muted-foreground">{t('organizer.no_trips_in_category')}</div>}
              </div>
            </TabsContent>

            <TabsContent value="happening">
              <div className="grid gap-6">
                {happeningTrips.map(trip => (
                  <OrganizerTripCard key={trip.id} trip={trip} allBookings={allBookings} language={language} t={t} today={today}
                    onStatusChange={handleStatusChange} onCancel={handleCancelTrip} onDelete={handleDeleteTrip} onRecreate={handleRecreateTrip}
                    cancelMutationPending={cancelTripMutation.isPending} cancelMutationTripId={cancellingTripId}
                    deleteMutationPending={deleteTripMutation.isPending}
                    showCancel={true} showRecreate={false} showDelete={true}
                  />
                ))}
                {happeningTrips.length === 0 && <div className="text-center py-10 text-muted-foreground">{t('organizer.no_trips_in_category')}</div>}
              </div>
            </TabsContent>

            <TabsContent value="completed">
              <div className="grid gap-6">
                {completedTrips.map(trip => (
                  <OrganizerTripCard key={trip.id} trip={trip} allBookings={allBookings} language={language} t={t} today={today}
                    onStatusChange={handleStatusChange} onCancel={handleCancelTrip} onDelete={handleDeleteTrip} onRecreate={handleRecreateTrip}
                    cancelMutationPending={cancelTripMutation.isPending} cancelMutationTripId={cancellingTripId}
                    deleteMutationPending={deleteTripMutation.isPending}
                    showCancel={false} showRecreate={true} showDelete={false} showStatusChange={false} showEdit={false}
                  />
                ))}
                {completedTrips.length === 0 && <div className="text-center py-10 text-muted-foreground">{t('organizer.no_trips_in_category')}</div>}
              </div>
            </TabsContent>

            <TabsContent value="cancelled">
              <div className="grid gap-6">
                {cancelledTrips.map(trip => (
                  <OrganizerTripCard key={trip.id} trip={trip} allBookings={allBookings} language={language} t={t} today={today}
                    onStatusChange={handleStatusChange} onCancel={handleCancelTrip} onDelete={handleDeleteTrip} onRecreate={handleRecreateTrip}
                    cancelMutationPending={cancelTripMutation.isPending} cancelMutationTripId={cancellingTripId}
                    deleteMutationPending={deleteTripMutation.isPending}
                    showCancel={false} showRecreate={false} showDelete={true}
                  />
                ))}
                {cancelledTrips.length === 0 && <div className="text-center py-10 text-muted-foreground">{t('organizer.no_trips_in_category')}</div>}
              </div>
            </TabsContent>

            <TabsContent value="bookings">
              {!isPremium && !isExpired ? (
                <UpgradePrompt
                  feature={t('manage_bookings.title')}
                  description={t('organizer.upgrade_booking_feature')}
                />
              ) : (
                <div className="space-y-6">
                  {isExpired && (
                    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800">
                          {t('organizer.plan_expired_banner')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-400 text-amber-700 flex-shrink-0"
                        onClick={() => navigate(createPageUrl('OrganizerPlans'))}
                      >
                        {t('organizer.renew_plan')}
                      </Button>
                    </div>
                  )}
                  {[...draftTrips, ...upcomingTrips, ...happeningTrips].length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      {t('organizer.no_active_trips')}
                    </div>
                  ) : (
                    [...draftTrips, ...upcomingTrips, ...happeningTrips].map(trip => (
                      <Card key={trip.id} className="p-4">
                        <h3 className="font-semibold text-base mb-3 text-foreground">{trip.title}</h3>
                        <BookingList
                          tripId={trip.id}
                          tripTitle={trip.title}
                          paymentInstructions={organizerData?.payment_instructions || null}
                        />
                      </Card>
                    ))
                  )}
                </div>
              )}
            </TabsContent>
            </Tabs>
            </>
            )}
      </div>
    </PageWrapper>
    </PullToRefresh>
  );
}