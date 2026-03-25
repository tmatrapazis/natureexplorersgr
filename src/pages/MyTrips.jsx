import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { createOptimisticTripDelete, createOptimisticTripUpdate } from "../lib/optimistic-mutations";
import MobileSelect from '../components/ui/MobileSelect';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, User as UserIcon } from "lucide-react";
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

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ['my-trips', user?.organizer_code],
    queryFn: () => base44.entities.HikingTrip.filter({ organizer_code: user?.organizer_code }, "-start_date"),
    enabled: !!user?.organizer_code,
    initialData: [],
  });

  const { data: allBookings = [] } = useQuery({
    queryKey: ['all-bookings', user?.organizer_code],
    queryFn: async () => {
      if (!user?.organizer_code) return [];
      // Fetch only bookings for trips owned by this organizer to avoid loading
      // every booking in the system (privacy + performance).
      const orgTrips = await base44.entities.HikingTrip.filter({ organizer_code: user.organizer_code });
      if (!orgTrips || orgTrips.length === 0) return [];
      const tripIds = new Set(orgTrips.map(t => t.id));
      const allB = await base44.entities.Booking.list();
      return allB.filter(b => tripIds.has(b.trip_id));
    },
    enabled: !!user?.organizer_code,
    initialData: [],
  });

  const deleteTripMutation = useMutation({
    mutationFn: async (/** @type {any} */ tripId) => {
      return await base44.entities.HikingTrip.delete(tripId);
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
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['my-trips', user?.organizer_code] });
      queryClient.invalidateQueries({ queryKey: ['hiking-trips'] });
    },
  });

  const updateTripStatusMutation = useMutation({
    mutationFn: async (/** @type {any} */ { tripId, status }) => {
      return await base44.entities.HikingTrip.update(tripId, { status });
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
        emailPromises.push(base44.integrations.Core.SendEmail(email));

        notifications.push({
          user_id: booking.user_id,
          message: `Your trip "${trip.title}" has been cancelled. A refund is being processed.`,
          link: createPageUrl("MyBookings")
        });

        bookingUpdatePromises.push(base44.entities.Booking.update(booking.id, { status: 'cancelled' }));
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
        await base44.entities.Notification.bulkCreate(notifications);
      }

      return await base44.entities.HikingTrip.update(trip.id, { status: "cancelled" });
    },
    onSuccess: () => {
      toast.success(language === 'el' ? 'Η εκδρομή ακυρώθηκε με επιτυχία' : 'Trip cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['my-trips'] });
      queryClient.invalidateQueries({ queryKey: ['all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.error('Trip cancellation error:', error);
      toast.error(language === 'el' ? 'Σφάλμα ακύρωσης εκδρομής' : 'Error cancelling trip');
    },
  });

  const handleCancelTrip = (trip) => {
    if (window.confirm(t('organizer.cancel_trip_confirm'))) {
      cancelTripMutation.mutate({ trip });
    }
  };

  const handleDeleteTrip = (tripId) => {
    if (window.confirm(language === 'el' ? 'Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την εκδρομή; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.' : 'Are you sure you want to delete this trip? This action cannot be undone.')) {
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

  if (tripsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const draftTrips = (trips || []).filter(t => t.status === 'draft');
  const upcomingTrips = (trips || []).filter(t => (t.status === 'upcoming' || t.status === 'almost soldout') && new Date(t.start_date) > today);
  const happeningTrips = (trips || []).filter(t => t.status !== 'cancelled' && t.status !== 'draft' && ((new Date(t.start_date) <= today && t.end_date && new Date(t.end_date) >= today) || t.status === 'happening now'));
  const completedTrips = (trips || []).filter(t => t.status !== 'cancelled' && t.status !== 'draft' && (t.status === 'completed' || (t.end_date && new Date(t.end_date) < today)));
  const cancelledTrips = (trips || []).filter(t => t.status === 'cancelled');
  const cancellingTripId = /** @type {any} */(cancelTripMutation.variables)?.trip?.id;

  return (
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
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="draft">{language === 'el' ? 'Πρόχειρα' : 'Drafts'}</TabsTrigger>
                  <TabsTrigger value="upcoming">{t('organizer.tab_upcoming')}</TabsTrigger>
                  <TabsTrigger value="happening">{t('organizer.tab_happening')}</TabsTrigger>
                  <TabsTrigger value="completed">{t('organizer.tab_completed')}</TabsTrigger>
                  <TabsTrigger value="cancelled">{t('organizer.tab_cancelled')}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Mobile Select Dropdown */}
            <div className="md:hidden mb-4">
              <MobileSelect
                value={activeTab}
                onValueChange={setActiveTab}
                options={[
                  { value: 'draft', label: language === 'el' ? 'Πρόχειρα' : 'Drafts' },
                  { value: 'upcoming', label: t('organizer.tab_upcoming') },
                  { value: 'happening', label: t('organizer.tab_happening') },
                  { value: 'completed', label: t('organizer.tab_completed') },
                  { value: 'cancelled', label: t('organizer.tab_cancelled') },
                ]}
                placeholder={language === 'el' ? 'Επιλέξτε κατηγορία' : 'Select category'}
                label={language === 'el' ? 'Κατηγορία Εκδρομών' : 'Trip Category'}
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
            </Tabs>
            </>
            )}
      </div>
    </PageWrapper>
  );
}