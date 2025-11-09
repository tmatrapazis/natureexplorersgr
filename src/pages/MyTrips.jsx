
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Plus, User as UserIcon, XCircle, Edit, ListOrdered } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getComputedTripStatus, statusColors } from "../components/helpers/tripHelpers";
import { formatDateRange } from "../components/helpers/dateHelpers";
import { getTripInsights } from "../components/helpers/bookingHelpers";
import useSEO from '../components/seo/useSEO';
import { useLanguage } from '../components/contexts/LanguageContext';
import { useTranslation } from '../components/translations/useTranslations';

export default function MyTripsPage() {
  const queryClient = useQueryClient();

  // New code for localization and SEO
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
    queryFn: () => base44.auth.me(),
  });

  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ['my-trips', user?.id],
    queryFn: () => base44.entities.HikingTrip.filter({ organizer_id: user.id }, "-start_date"),
    enabled: !!user,
    initialData: [],
  });

  const { data: allBookings = [] } = useQuery({
    queryKey: ['all-bookings'],
    queryFn: () => base44.entities.Booking.list(),
    initialData: [],
  });

  const cancelTripMutation = useMutation({
    mutationFn: async ({ trip }) => {
      const tripBookings = allBookings.filter(b => b.trip_id === trip.id && b.status === "confirmed");

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

      await Promise.all(emailPromises);
      await Promise.all(bookingUpdatePromises);
      if (notifications.length > 0) {
        await base44.entities.Notification.bulkCreate(notifications);
      }

      return await base44.entities.HikingTrip.update(trip.id, { status: "cancelled" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-trips'] });
      queryClient.invalidateQueries({ queryKey: ['all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleCancelTrip = (trip) => {
    if (window.confirm("Are you sure you want to cancel this trip? This will notify all booked hikers and cannot be undone.")) {
      cancelTripMutation.mutate({ trip });
    }
  };

  const getBookingsForTrip = (tripId) => {
    return allBookings.filter(b => b.trip_id === tripId && b.status === "confirmed");
  };

  const getPendingBookingsForTrip = (tripId) => {
    return allBookings.filter(b => b.trip_id === tripId && b.status === "pending").length;
  };

  if (tripsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const tripsWithStatus = (trips || []).map(trip => ({...trip, computedStatus: getComputedTripStatus(trip)}));
  const filteredTrips = (status) => tripsWithStatus.filter(t => t.computedStatus === status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900">My Organized Trips</h1>
          <div className="flex gap-2">
            {user && (
              <Link to={`${createPageUrl("OrganizerProfile")}?id=${user.id}`}>
                <Button variant="outline">
                  <UserIcon className="w-4 h-4 mr-2" />
                  View My Profile
                </Button>
              </Link>
            )}
            <Link to={createPageUrl("CreateTrip")}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Create New Trip
              </Button>
            </Link>
          </div>
        </div>

        {tripsWithStatus.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-stone-300 mb-4" />
            <h3 className="text-lg font-semibold text-stone-700 mb-2">No trips yet</h3>
            <p className="text-stone-500 mb-4">Start organizing your first hiking adventure</p>
            <Link to={createPageUrl("CreateTrip")}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Create Your First Trip
              </Button>
            </Link>
          </Card>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="happening">Happening Now</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
            {['upcoming', 'happening', 'completed', 'cancelled'].map(statusKey => {
               const statusValue = statusKey === 'happening' ? 'happening now' : statusKey;
               return (
                <TabsContent key={statusKey} value={statusKey}>
                  <div className="grid gap-6">
                    {filteredTrips(statusValue).map((trip) => {
                      const bookings = getBookingsForTrip(trip.id);
                      const bookedSlots = bookings.reduce((sum, b) => sum + b.number_of_people, 0);
                      const pendingBookings = getPendingBookingsForTrip(trip.id);
                      const insights = getTripInsights(trip.id, allBookings);

                      return (
                        <Card key={trip.id} className="p-6 hover:shadow-lg transition-shadow">
                          <div className="flex flex-col md:flex-row gap-6">
                            {trip.image_url && (
                              <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0">
                                <img src={trip.image_url} alt={trip.title} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex flex-col md:flex-row justify-between gap-2 mb-3">
                                <div>
                                  <h3 className="text-xl font-bold text-stone-900 mb-2">{trip.title}</h3>
                                  <div className="flex flex-wrap gap-2">
                                    <Badge className={`${statusColors[trip.computedStatus]}`}>{trip.computedStatus}</Badge>
                                    <Badge variant="outline">{formatDateRange(trip.start_date, trip.end_date)}</Badge>
                                    {trip.tags && trip.tags.slice(0, 3).map(tag => (
                                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="grid sm:grid-cols-2 gap-3 mb-4 text-sm text-stone-600">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-emerald-600" />
                                  <span>{trip.location}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-emerald-600" />
                                  <span>{bookedSlots} / {trip.total_slots} confirmed</span>
                                </div>
                                {pendingBookings > 0 && (
                                    <div className="flex items-center gap-2 text-yellow-600 font-semibold">
                                        <ListOrdered className="w-4 h-4"/>
                                        <span>{pendingBookings} pending request(s)</span>
                                    </div>
                                )}
                              </div>

                              {insights.total > 0 && (
                                <div className="bg-stone-50 rounded-lg p-3 mb-4">
                                  <p className="text-xs font-semibold text-stone-600 mb-2">Booking Insights</p>
                                  <div className="flex gap-4 text-sm">
                                    <span>Pending: <strong>{insights.pending}</strong></span>
                                    <span>Confirmed: <strong className="text-emerald-600">{insights.confirmed}</strong></span>
                                    <span>Declined: <strong className="text-red-600">{insights.declined}</strong></span>
                                  </div>
                                </div>
                              )}

                              <div className="flex flex-wrap items-center gap-2">
                                <Link to={`${createPageUrl("ManageBookings")}?tripId=${trip.id}`}>
                                  <Button>Manage Bookings</Button>
                                </Link>
                                <Link to={`${createPageUrl("EditTrip")}?id=${trip.id}`}>
                                  <Button variant="outline"><Edit className="w-4 h-4 mr-2"/>Edit Trip</Button>
                                </Link>
                                {(trip.computedStatus === 'upcoming' || trip.computedStatus === 'happening now') && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleCancelTrip(trip)}
                                    disabled={cancelTripMutation.isPending && cancelTripMutation.variables?.trip.id === trip.id}
                                  >
                                    {cancelTripMutation.isPending && cancelTripMutation.variables?.trip.id === trip.id ? (
                                      <span className="flex items-center gap-2">Cancelling...</span>
                                    ) : (
                                      <>
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Cancel
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                    {filteredTrips(statusValue).length === 0 && (
                      <div className="text-center py-10 text-stone-500">No trips in this category.</div>
                    )}
                  </div>
                </TabsContent>
               );
            })}
          </Tabs>
        )}
      </div>
    </div>
  );
}
