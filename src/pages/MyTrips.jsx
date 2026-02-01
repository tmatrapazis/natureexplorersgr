import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Users, Plus, User as UserIcon, XCircle, Edit, ListOrdered, Trash2, RefreshCw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getComputedTripStatus, statusColors } from "../components/helpers/tripHelpers";
import { formatDateRange } from "../components/helpers/dateHelpers";
import { getTripInsights } from "../components/helpers/bookingHelpers";
import useSEO from '../components/seo/useSEO';
import { useLanguage } from '../components/contexts/LanguageContext';
import { useTranslation } from '../components/translations/useTranslations';
import { getTripImage, handleImageError } from "../components/helpers/imageHelpers";

export default function MyTripsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
    queryKey: ['my-trips', user?.organizer_code],
    queryFn: () => base44.entities.HikingTrip.filter({ organizer_code: user.organizer_code }, "-start_date"),
    enabled: !!user?.organizer_code,
    initialData: [],
  });

  const { data: allBookings = [] } = useQuery({
    queryKey: ['all-bookings'],
    queryFn: () => base44.entities.Booking.list(),
    initialData: [],
  });

  const deleteTripMutation = useMutation({
    mutationFn: async (tripId) => {
      return await base44.entities.HikingTrip.delete(tripId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-trips'] });
    },
  });

  const updateTripStatusMutation = useMutation({
    mutationFn: async ({ tripId, status }) => {
      return await base44.entities.HikingTrip.update(tripId, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-trips'] });
    },
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
    navigate(createPageUrl("CreateTrip"), { state: { tripData } });
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
  const upcomingTrips = (trips || []).filter(t => t.status === 'upcoming' && new Date(t.start_date) > today);
  const happeningTrips = (trips || []).filter(t => (new Date(t.start_date) <= today && new Date(t.end_date) >= today) || t.status === 'happening now');
  const completedTrips = (trips || []).filter(t => new Date(t.end_date) < today || t.status === 'completed');
  const cancelledTrips = (trips || []).filter(t => t.status === 'cancelled');

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900">{t('organizer.my_trips')}</h1>
          <div className="flex gap-2">
            {user && (
              <Link to={`${createPageUrl("OrganizerProfile")}?code=${user.organizer_code}`}>
                <Button variant="outline">
                  <UserIcon className="w-4 h-4 mr-2" />
                  {t('organizer.view_profile')}
                </Button>
              </Link>
            )}
            <Link to={createPageUrl("CreateTrip")}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                {t('organizer.create_new_trip')}
              </Button>
            </Link>
          </div>
        </div>

        {trips.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-stone-300 mb-4" />
            <h3 className="text-lg font-semibold text-stone-700 mb-2">{t('organizer.no_trips')}</h3>
            <p className="text-stone-500 mb-4">{t('organizer.no_trips_message')}</p>
            <Link to={createPageUrl("CreateTrip")}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                {t('organizer.create_first_trip')}
              </Button>
            </Link>
          </Card>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="draft">{language === 'el' ? 'Πρόχειρα' : 'Drafts'}</TabsTrigger>
              <TabsTrigger value="upcoming">{t('organizer.tab_upcoming')}</TabsTrigger>
              <TabsTrigger value="happening">{t('organizer.tab_happening')}</TabsTrigger>
              <TabsTrigger value="completed">{t('organizer.tab_completed')}</TabsTrigger>
              <TabsTrigger value="cancelled">{t('organizer.tab_cancelled')}</TabsTrigger>
            </TabsList>
            <TabsContent value="draft">
              <div className="grid gap-6">
                {draftTrips.map((trip) => {
                  const bookings = getBookingsForTrip(trip.id);
                  const bookedSlots = bookings.reduce((sum, b) => sum + b.number_of_people, 0);
                  const pendingBookings = getPendingBookingsForTrip(trip.id);
                  const insights = getTripInsights(trip.id, allBookings);

                  return (
                    <Card key={trip.id} className="p-6 hover:shadow-lg transition-shadow border-dashed">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0">
                          <img 
                            src={getTripImage(trip.image_url, trip.id)} 
                            alt={trip.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => handleImageError(e, trip.id)}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row justify-between gap-2 mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-stone-900 mb-2">{trip.title}</h3>
                              <div className="flex flex-wrap gap-2">
                                <Badge className="bg-stone-400">{language === 'el' ? 'Πρόχειρο' : 'Draft'}</Badge>
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
                              <span>{bookedSlots} / {trip.total_slots} {t('organizer.confirmed_bookings')}</span>
                            </div>
                            {pendingBookings > 0 && (
                                <div className="flex items-center gap-2 text-yellow-600 font-semibold">
                                    <ListOrdered className="w-4 h-4"/>
                                    <span>{pendingBookings} {t('organizer.pending_requests')}</span>
                                </div>
                            )}
                          </div>

                          {insights.total > 0 && (
                            <div className="bg-stone-50 rounded-lg p-3 mb-4">
                              <p className="text-xs font-semibold text-stone-600 mb-2">{t('organizer.booking_insights')}</p>
                              <div className="flex gap-4 text-sm">
                                <span>{t('organizer.insights_pending')}: <strong>{insights.pending}</strong></span>
                                <span>{t('organizer.insights_confirmed')}: <strong className="text-emerald-600">{insights.confirmed}</strong></span>
                                <span>{t('organizer.insights_declined')}: <strong className="text-red-600">{insights.declined}</strong></span>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link to={`${createPageUrl("EditTrip")}?id=${trip.id}`}>
                                <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-2"/>{t('organizer.edit_trip')}</Button>
                              </Link>
                              <Select
                                value={trip.status}
                                onValueChange={(value) => handleStatusChange(trip.id, value)}
                                disabled={!isRequiredFieldsFilled(trip)}
                              >
                                <SelectTrigger className="w-[140px] h-9">
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">{language === 'el' ? 'Πρόχειρο' : 'Draft'}</SelectItem>
                                  <SelectItem value="upcoming">{language === 'el' ? 'Επερχόμενο' : 'Upcoming'}</SelectItem>
                                  <SelectItem value="happening now">{language === 'el' ? 'Σε εξέλιξη' : 'Happening Now'}</SelectItem>
                                  <SelectItem value="completed">{language === 'el' ? 'Ολοκληρωμένο' : 'Completed'}</SelectItem>
                                  <SelectItem value="cancelled">{language === 'el' ? 'Ακυρωμένο' : 'Cancelled'}</SelectItem>
                                  <SelectItem value="almost soldout">{language === 'el' ? 'Σχεδόν γεμάτο' : 'Almost Soldout'}</SelectItem>
                                </SelectContent>
                              </Select>
                              {new Date(trip.end_date) >= today && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteTrip(trip.id)}
                                  disabled={deleteTripMutation.isPending}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {language === 'el' ? 'Διαγραφή' : 'Delete'}
                                </Button>
                              )}
                            </div>
                            {!isRequiredFieldsFilled(trip) && (
                              <span className="text-xs text-red-600">
                                {language === 'el' ? 'Συμπληρώστε τα υποχρεωτικά πεδία για να δημοσιεύσετε' : 'Fill required fields to publish'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                {draftTrips.length === 0 && (
                  <div className="text-center py-10 text-stone-500">{t('organizer.no_trips_in_category')}</div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="upcoming">
              <div className="grid gap-6">
                {upcomingTrips.map((trip) => {
                      const bookings = getBookingsForTrip(trip.id);
                      const bookedSlots = bookings.reduce((sum, b) => sum + b.number_of_people, 0);
                      const pendingBookings = getPendingBookingsForTrip(trip.id);
                      const insights = getTripInsights(trip.id, allBookings);

                      return (
                        <Card key={trip.id} className="p-6 hover:shadow-lg transition-shadow">
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0">
                              <img 
                                src={getTripImage(trip.image_url, trip.id)} 
                                alt={trip.title} 
                                className="w-full h-full object-cover"
                                onError={(e) => handleImageError(e, trip.id)}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-col md:flex-row justify-between gap-2 mb-3">
                                <div>
                                  <h3 className="text-xl font-bold text-stone-900 mb-2">{trip.title}</h3>
                                  <div className="flex flex-wrap gap-2">
                                    <Badge className="bg-emerald-600">{language === 'el' ? 'Επερχόμενο' : 'Upcoming'}</Badge>
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
                                  <span>{bookedSlots} / {trip.total_slots} {t('organizer.confirmed_bookings')}</span>
                                </div>
                                {pendingBookings > 0 && (
                                    <div className="flex items-center gap-2 text-yellow-600 font-semibold">
                                        <ListOrdered className="w-4 h-4"/>
                                        <span>{pendingBookings} {t('organizer.pending_requests')}</span>
                                    </div>
                                )}
                              </div>

                              {insights.total > 0 && (
                                <div className="bg-stone-50 rounded-lg p-3 mb-4">
                                  <p className="text-xs font-semibold text-stone-600 mb-2">{t('organizer.booking_insights')}</p>
                                  <div className="flex gap-4 text-sm">
                                    <span>{t('organizer.insights_pending')}: <strong>{insights.pending}</strong></span>
                                    <span>{t('organizer.insights_confirmed')}: <strong className="text-emerald-600">{insights.confirmed}</strong></span>
                                    <span>{t('organizer.insights_declined')}: <strong className="text-red-600">{insights.declined}</strong></span>
                                  </div>
                                </div>
                              )}

                              <div className="flex flex-wrap items-center gap-2">
                                <Link to={`${createPageUrl("EditTrip")}?id=${trip.id}`}>
                                  <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-2"/>{t('organizer.edit_trip')}</Button>
                                </Link>
                                <Select
                                  value={trip.status}
                                  onValueChange={(value) => handleStatusChange(trip.id, value)}
                                >
                                  <SelectTrigger className="w-[140px] h-9">
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="draft">{language === 'el' ? 'Πρόχειρο' : 'Draft'}</SelectItem>
                                    <SelectItem value="upcoming">{language === 'el' ? 'Επερχόμενο' : 'Upcoming'}</SelectItem>
                                    <SelectItem value="happening now">{language === 'el' ? 'Σε εξέλιξη' : 'Happening Now'}</SelectItem>
                                    <SelectItem value="completed">{language === 'el' ? 'Ολοκληρωμένο' : 'Completed'}</SelectItem>
                                    <SelectItem value="cancelled">{language === 'el' ? 'Ακυρωμένο' : 'Cancelled'}</SelectItem>
                                    <SelectItem value="almost soldout">{language === 'el' ? 'Σχεδόν γεμάτο' : 'Almost Soldout'}</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleCancelTrip(trip)}
                                  disabled={cancelTripMutation.isPending && cancelTripMutation.variables?.trip.id === trip.id}
                                >
                                  {cancelTripMutation.isPending && cancelTripMutation.variables?.trip.id === trip.id ? (
                                    <span className="flex items-center gap-2">{t('organizer.cancelling')}</span>
                                  ) : (
                                    <>
                                      <XCircle className="w-4 h-4 mr-2" />
                                      {t('organizer.cancel_trip')}
                                    </>
                                  )}
                                </Button>
                                {new Date(trip.end_date) >= today && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteTrip(trip.id)}
                                    disabled={deleteTripMutation.isPending}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    {language === 'el' ? 'Διαγραφή' : 'Delete'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                {upcomingTrips.length === 0 && (
                  <div className="text-center py-10 text-stone-500">{t('organizer.no_trips_in_category')}</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="happening">
              <div className="grid gap-6">
                {happeningTrips.map((trip) => {
                  const bookings = getBookingsForTrip(trip.id);
                  const bookedSlots = bookings.reduce((sum, b) => sum + b.number_of_people, 0);
                  const pendingBookings = getPendingBookingsForTrip(trip.id);
                  const insights = getTripInsights(trip.id, allBookings);

                  return (
                    <Card key={trip.id} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0">
                          <img 
                            src={getTripImage(trip.image_url, trip.id)} 
                            alt={trip.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => handleImageError(e, trip.id)}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row justify-between gap-2 mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-stone-900 mb-2">{trip.title}</h3>
                              <div className="flex flex-wrap gap-2">
                                <Badge className="bg-blue-600">{language === 'el' ? 'Σε εξέλιξη' : 'Happening Now'}</Badge>
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
                              <span>{bookedSlots} / {trip.total_slots} {t('organizer.confirmed_bookings')}</span>
                            </div>
                            {pendingBookings > 0 && (
                                <div className="flex items-center gap-2 text-yellow-600 font-semibold">
                                    <ListOrdered className="w-4 h-4"/>
                                    <span>{pendingBookings} {t('organizer.pending_requests')}</span>
                                </div>
                            )}
                          </div>

                          {insights.total > 0 && (
                            <div className="bg-stone-50 rounded-lg p-3 mb-4">
                              <p className="text-xs font-semibold text-stone-600 mb-2">{t('organizer.booking_insights')}</p>
                              <div className="flex gap-4 text-sm">
                                <span>{t('organizer.insights_pending')}: <strong>{insights.pending}</strong></span>
                                <span>{t('organizer.insights_confirmed')}: <strong className="text-emerald-600">{insights.confirmed}</strong></span>
                                <span>{t('organizer.insights_declined')}: <strong className="text-red-600">{insights.declined}</strong></span>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2">
                            <Link to={`${createPageUrl("EditTrip")}?id=${trip.id}`}>
                              <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-2"/>{t('organizer.edit_trip')}</Button>
                            </Link>
                            <Select
                              value={trip.status}
                              onValueChange={(value) => handleStatusChange(trip.id, value)}
                            >
                              <SelectTrigger className="w-[140px] h-9">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">{language === 'el' ? 'Πρόχειρο' : 'Draft'}</SelectItem>
                                <SelectItem value="upcoming">{language === 'el' ? 'Επερχόμενο' : 'Upcoming'}</SelectItem>
                                <SelectItem value="happening now">{language === 'el' ? 'Σε εξέλιξη' : 'Happening Now'}</SelectItem>
                                <SelectItem value="completed">{language === 'el' ? 'Ολοκληρωμένο' : 'Completed'}</SelectItem>
                                <SelectItem value="cancelled">{language === 'el' ? 'Ακυρωμένο' : 'Cancelled'}</SelectItem>
                                <SelectItem value="almost soldout">{language === 'el' ? 'Σχεδόν γεμάτο' : 'Almost Soldout'}</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelTrip(trip)}
                              disabled={cancelTripMutation.isPending && cancelTripMutation.variables?.trip.id === trip.id}
                            >
                              {cancelTripMutation.isPending && cancelTripMutation.variables?.trip.id === trip.id ? (
                                <span className="flex items-center gap-2">{t('organizer.cancelling')}</span>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  {t('organizer.cancel_trip')}
                                </>
                              )}
                            </Button>
                            {new Date(trip.end_date) >= today && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteTrip(trip.id)}
                                disabled={deleteTripMutation.isPending}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {language === 'el' ? 'Διαγραφή' : 'Delete'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                {happeningTrips.length === 0 && (
                  <div className="text-center py-10 text-stone-500">{t('organizer.no_trips_in_category')}</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed">
              <div className="grid gap-6">
                {completedTrips.map((trip) => {
                  const bookings = getBookingsForTrip(trip.id);
                  const bookedSlots = bookings.reduce((sum, b) => sum + b.number_of_people, 0);
                  const pendingBookings = getPendingBookingsForTrip(trip.id);
                  const insights = getTripInsights(trip.id, allBookings);

                  return (
                    <Card key={trip.id} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0">
                          <img 
                            src={getTripImage(trip.image_url, trip.id)} 
                            alt={trip.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => handleImageError(e, trip.id)}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row justify-between gap-2 mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-stone-900 mb-2">{trip.title}</h3>
                              <div className="flex flex-wrap gap-2">
                                <Badge className="bg-stone-600">{language === 'el' ? 'Ολοκληρωμένο' : 'Completed'}</Badge>
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
                              <span>{bookedSlots} / {trip.total_slots} {t('organizer.confirmed_bookings')}</span>
                            </div>
                            {pendingBookings > 0 && (
                                <div className="flex items-center gap-2 text-yellow-600 font-semibold">
                                    <ListOrdered className="w-4 h-4"/>
                                    <span>{pendingBookings} {t('organizer.pending_requests')}</span>
                                </div>
                            )}
                          </div>

                          {insights.total > 0 && (
                            <div className="bg-stone-50 rounded-lg p-3 mb-4">
                              <p className="text-xs font-semibold text-stone-600 mb-2">{t('organizer.booking_insights')}</p>
                              <div className="flex gap-4 text-sm">
                                <span>{t('organizer.insights_pending')}: <strong>{insights.pending}</strong></span>
                                <span>{t('organizer.insights_confirmed')}: <strong className="text-emerald-600">{insights.confirmed}</strong></span>
                                <span>{t('organizer.insights_declined')}: <strong className="text-red-600">{insights.declined}</strong></span>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRecreateTrip(trip)}
                            >
                              <Plus className="w-4 h-4 mr-2"/>
                              {language === 'el' ? 'Αναδημιουργία' : 'Recreate'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                {completedTrips.length === 0 && (
                  <div className="text-center py-10 text-stone-500">{t('organizer.no_trips_in_category')}</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="cancelled">
              <div className="grid gap-6">
                {cancelledTrips.map((trip) => {
                  const bookings = getBookingsForTrip(trip.id);
                  const bookedSlots = bookings.reduce((sum, b) => sum + b.number_of_people, 0);
                  const pendingBookings = getPendingBookingsForTrip(trip.id);
                  const insights = getTripInsights(trip.id, allBookings);

                  return (
                    <Card key={trip.id} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0">
                          <img 
                            src={getTripImage(trip.image_url, trip.id)} 
                            alt={trip.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => handleImageError(e, trip.id)}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row justify-between gap-2 mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-stone-900 mb-2">{trip.title}</h3>
                              <div className="flex flex-wrap gap-2">
                                <Badge className="bg-red-600">{language === 'el' ? 'Ακυρωμένο' : 'Cancelled'}</Badge>
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
                              <span>{bookedSlots} / {trip.total_slots} {t('organizer.confirmed_bookings')}</span>
                            </div>
                            {pendingBookings > 0 && (
                                <div className="flex items-center gap-2 text-yellow-600 font-semibold">
                                    <ListOrdered className="w-4 h-4"/>
                                    <span>{pendingBookings} {t('organizer.pending_requests')}</span>
                                </div>
                            )}
                          </div>

                          {insights.total > 0 && (
                            <div className="bg-stone-50 rounded-lg p-3 mb-4">
                              <p className="text-xs font-semibold text-stone-600 mb-2">{t('organizer.booking_insights')}</p>
                              <div className="flex gap-4 text-sm">
                                <span>{t('organizer.insights_pending')}: <strong>{insights.pending}</strong></span>
                                <span>{t('organizer.insights_confirmed')}: <strong className="text-emerald-600">{insights.confirmed}</strong></span>
                                <span>{t('organizer.insights_declined')}: <strong className="text-red-600">{insights.declined}</strong></span>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2">
                            <Link to={`${createPageUrl("EditTrip")}?id=${trip.id}`}>
                              <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-2"/>{t('organizer.edit_trip')}</Button>
                            </Link>
                            <Select
                              value={trip.status}
                              onValueChange={(value) => handleStatusChange(trip.id, value)}
                            >
                              <SelectTrigger className="w-[140px] h-9">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">{language === 'el' ? 'Πρόχειρο' : 'Draft'}</SelectItem>
                                <SelectItem value="upcoming">{language === 'el' ? 'Επερχόμενο' : 'Upcoming'}</SelectItem>
                                <SelectItem value="happening now">{language === 'el' ? 'Σε εξέλιξη' : 'Happening Now'}</SelectItem>
                                <SelectItem value="completed">{language === 'el' ? 'Ολοκληρωμένο' : 'Completed'}</SelectItem>
                                <SelectItem value="cancelled">{language === 'el' ? 'Ακυρωμένο' : 'Cancelled'}</SelectItem>
                                <SelectItem value="almost soldout">{language === 'el' ? 'Σχεδόν γεμάτο' : 'Almost Soldout'}</SelectItem>
                              </SelectContent>
                            </Select>
                            {new Date(trip.end_date) >= today && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteTrip(trip.id)}
                                disabled={deleteTripMutation.isPending}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {language === 'el' ? 'Διαγραφή' : 'Delete'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                {cancelledTrips.length === 0 && (
                  <div className="text-center py-10 text-stone-500">{t('organizer.no_trips_in_category')}</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}