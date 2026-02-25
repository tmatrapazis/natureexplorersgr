import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PullToRefresh from "../components/ui/PullToRefresh";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ReactMarkdown from "react-markdown";

import useSEO from '../components/seo/useSEO';
import PageWrapper from '../components/layout/PageWrapper';
import { useLanguage } from '../components/contexts/LanguageContext';
import { useTranslation } from '../components/translations/useTranslations';

// Status badge configuration (exact mapping)
const STATUS_CONFIG = {
  paid: { color: "bg-green-100 text-green-800 border-green-300", label: "Paid" },
  confirmed: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "Confirmed - Awaiting Payment" },
  pending: { color: "bg-blue-100 text-blue-800 border-blue-300", label: "Pending Review" },
  declined: { color: "bg-red-100 text-red-800 border-red-300", label: "Declined" },
  cancelled: { color: "bg-gray-100 text-gray-800 border-gray-300", label: "Cancelled" }
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return <Badge className={`${config.color} border`}>{config.label}</Badge>;
};

const PaymentInstructionsPanel = ({ instructions }) => {
  if (!instructions) return null;
  
  return (
    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
      <h4 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
        💳 Payment Instructions
      </h4>
      <div className="prose prose-sm max-w-none text-stone-700">
        <ReactMarkdown>{instructions}</ReactMarkdown>
      </div>
    </div>
  );
};

const CancelBookingDialog = ({ open, onOpenChange, onConfirm, isPending }) => {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Booking?</DialogTitle>
          <DialogDescription>This action cannot be undone</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="cancel-reason" className="mb-2 block">
            Reason for cancellation (optional)
          </Label>
          <Textarea
            id="cancel-reason"
            placeholder="Let us know why you're cancelling..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Keep Booking
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Cancelling..." : "Cancel Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function MyBookingsPage() {
  const queryClient = useQueryClient();
  const [cancelDialog, setCancelDialog] = useState({ open: false, booking: null });
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const { language } = useLanguage();
  const { t } = useTranslation(language);

  // Prevent indexing - this is an authenticated page
  useSEO({
    title: t('booking.my_bookings'),
    description: 'My hiking trip bookings',
    noindex: true
  });

  // Auth check
  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      try {
        const currentUser = await base44.auth.me();
        console.log("[MyBookings] ✅ Current User fetched:", {
          id: currentUser.id,
          email: currentUser.email,
          role: currentUser.role,
          full_name: currentUser.full_name
        });
        return currentUser;
      } catch (error) {
        console.error('[MyBookings] ❌ Error fetching user:', error);
        base44.auth.redirectToLogin(window.location.pathname);
        return null;
      }
    },
  });

  // DIAGNOSTIC: Fetch ALL bookings (admin view) to see if any exist
  const { data: allBookings = [] } = useQuery({
    queryKey: ['all-bookings-diagnostic'],
    queryFn: async () => {
      try {
        const result = await base44.entities.Booking.list("-created_date", 100);
        console.log('[MyBookings] 📊 DIAGNOSTIC: Total bookings in database:', result.length);
        if (result.length > 0) {
          console.log('[MyBookings] 📊 DIAGNOSTIC: Sample booking user_ids:', 
            result.slice(0, 5).map(b => ({ id: b.id, user_id: b.user_id, status: b.status }))
          );
        }
        return result || [];
      } catch (error) {
        console.warn('[MyBookings] ⚠️ Could not fetch all bookings (might be restricted):', error.message);
        return [];
      }
    },
    enabled: !!user,
  });

  // Fetch bookings for current user (ds_my_bookings)
  const { data: bookings = [], isLoading: bookingsLoading, error: bookingsError, refetch } = useQuery({
    queryKey: ['my-bookings', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log("[MyBookings] ⏸️ Query skipped: user.id is not available yet");
        return [];
      }
      
      console.log('[MyBookings] 🔍 Fetching bookings for user_id:', user.id);
      
      try {
        const result = await base44.entities.Booking.filter({ user_id: user.id }, "-created_date");
        console.log('[MyBookings] ✅ Successfully fetched', result.length, 'bookings');
        
        if (result.length > 0) {
          console.log('[MyBookings] 📋 Bookings details:', result.map(b => ({
            id: b.id,
            trip_title: b.trip_title,
            status: b.status,
            user_id: b.user_id,
            created_date: b.created_date
          })));
        } else {
          console.log('[MyBookings] ⚠️ No bookings found for user_id:', user.id);
        }
        
        return result || [];
      } catch (error) {
        console.error('[MyBookings] ❌ Error fetching bookings:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
  });

  // Cancel booking mutation with optimistic updates
  const cancelBookingMutation = useMutation({
    mutationFn: async ({ booking, reason }) => {
      console.log('[MyBookings] 🚫 Cancelling booking:', booking.id);
      
      // Guard: validate ownership and status
      if (booking.user_id !== user.id) {
        console.error('[MyBookings] ❌ Unauthorized: user_id mismatch', {
          booking_user_id: booking.user_id,
          current_user_id: user.id
        });
        throw new Error('Unauthorized: You can only cancel your own bookings');
      }
      
      if (!['pending', 'confirmed'].includes(booking.status)) {
        console.error('[MyBookings] ❌ Invalid status for cancellation:', booking.status);
        throw new Error('Cannot cancel: Booking status must be pending or confirmed');
      }

      // Update booking status
      const updatedBooking = await base44.entities.Booking.update(booking.id, { 
        status: 'cancelled',
        cancellation_reason: reason || "Cancelled by user"
      });

      // Create notification for user
      await base44.entities.Notification.create({
        user_id: booking.user_id,
        title: "You cancelled your booking",
        message: `You cancelled your booking for "${booking.trip_title}"`,
        link: createPageUrl("MyBookings"),
      });

      // Send email to user
      await base44.integrations.Core.SendEmail({
        to: booking.user_email,
        subject: "You cancelled your booking",
        body: `
          <h2>Booking Cancelled</h2>
          <p>Hi ${booking.user_name},</p>
          <p>You cancelled your booking for <strong>${booking.trip_title}</strong>.</p>
          <p><strong>Status:</strong> Cancelled</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <hr/>
          <p><strong>Trip Date:</strong> ${format(new Date(booking.trip_start_date), "MMMM d, yyyy")}</p>
          <p>If this was a mistake, please contact the organizer directly.</p>
        `
      });

      console.log('[MyBookings] ✅ Booking cancelled successfully');
      return updatedBooking;
    },
    onMutate: async ({ booking, reason }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['my-bookings', user?.id] });
      
      // Snapshot previous value
      const previousBookings = queryClient.getQueryData(['my-bookings', user?.id]);
      
      // Optimistically update
      queryClient.setQueryData(['my-bookings', user?.id], (old) =>
        old?.map((b) =>
          b.id === booking.id
            ? { ...b, status: 'cancelled', cancellation_reason: reason || 'Cancelled by user' }
            : b
        )
      );
      
      return { previousBookings };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['my-bookings', user?.id], context.previousBookings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setCancelDialog({ open: false, booking: null });
    },
  });

  const handleCancelClick = (booking) => {
    setCancelDialog({ open: true, booking });
  };

  const handleCancelConfirm = (reason) => {
    cancelBookingMutation.mutate({ booking: cancelDialog.booking, reason });
  };

  // Show loading state
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Auth guard
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <p className="text-center text-stone-600 mb-4">Please log in to view your bookings</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="w-full">
            Log In
          </Button>
        </Card>
      </div>
    );
  }

  // Role guard (only show to hikers - users without organizer_code)
  const isOrganizer = user.organizer_code && user.organizer_code.trim().length > 0;
  if (isOrganizer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <p className="text-center text-stone-600">This page is only available to hikers.</p>
          <Link to={createPageUrl("Calendar")} className="mt-4 block">
            <Button className="w-full">Go to Calendar</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Count bookings for this user in the diagnostic query
  const myBookingsInDiagnostic = allBookings.filter(b => b.user_id === user.id);

  const handleRefresh = async () => {
    await queryClient.refetchQueries({ queryKey: ['my-bookings', user?.id] });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <PageWrapper className="py-4 md:py-8">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">My Bookings</h1>
          <p className="text-muted-foreground">Track your trip reservations and their status</p>
        </div>

        {/* Diagnostics Panel - Visible to ALL users for debugging */}
        {showDiagnostics && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm text-blue-900 flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Diagnostic Information
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowDiagnostics(false)}
                  className="text-blue-700 hover:text-blue-900"
                >
                  Hide
                </Button>
              </div>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-blue-900">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="font-semibold">User ID:</p>
                  <p className="font-mono bg-white p-1 rounded">{user.id || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-semibold">User Role:</p>
                  <p className="font-mono bg-white p-1 rounded">{user.role || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-semibold">User Email:</p>
                  <p className="font-mono bg-white p-1 rounded text-[10px]">{user.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-semibold">Bookings Count:</p>
                  <p className="font-mono bg-white p-1 rounded">{bookings.length}</p>
                </div>
                <div>
                  <p className="font-semibold">Loading State:</p>
                  <p className="font-mono bg-white p-1 rounded">{bookingsLoading ? 'Loading...' : 'Loaded'}</p>
                </div>
                <div>
                  <p className="font-semibold">Error:</p>
                  <p className="font-mono bg-white p-1 rounded">{bookingsError ? 'Yes' : 'None'}</p>
                </div>
              </div>
              {bookingsError && (
                <div className="mt-2">
                  <p className="font-semibold text-red-700">Error Details:</p>
                  <p className="font-mono bg-white p-2 rounded text-red-600 text-[10px]">
                    {bookingsError.message}
                  </p>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-blue-300">
                <p className="font-semibold mb-2">Database Diagnostic:</p>
                <p className="text-[10px]">
                  <strong>Total bookings in DB:</strong> {allBookings.length}
                </p>
                <p className="text-[10px]">
                  <strong>Bookings for my user_id in DB:</strong> {myBookingsInDiagnostic.length}
                </p>
                {myBookingsInDiagnostic.length > 0 && (
                  <div className="mt-2 p-2 bg-green-100 rounded">
                    <p className="font-semibold text-green-900">✅ Found {myBookingsInDiagnostic.length} booking(s) in database!</p>
                    <p className="text-[10px] text-green-800">This means bookings exist but RLS might be blocking access.</p>
                  </div>
                )}
                {allBookings.length > 0 && myBookingsInDiagnostic.length === 0 && (
                  <div className="mt-2 p-2 bg-yellow-100 rounded">
                    <p className="font-semibold text-yellow-900">⚠️ Bookings exist in DB but none match your user_id</p>
                    <p className="text-[10px] text-yellow-800">Sample user_ids in DB: {allBookings.slice(0, 3).map(b => b.user_id.substring(0, 8)).join(', ')}...</p>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-blue-300">
                <p className="font-semibold mb-2">Query Information:</p>
                <p className="text-[10px]">
                  <strong>Query Key:</strong> ['my-bookings', {user.id}]
                </p>
                <p className="text-[10px]">
                  <strong>Filter:</strong> user_id = {user.id}
                </p>
                <p className="text-[10px]">
                  <strong>Enabled:</strong> {user?.id ? 'Yes' : 'No'}
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  console.log('[MyBookings] 🔄 Manual refetch triggered');
                  refetch();
                }}
                className="mt-2 w-full"
              >
                Refresh Bookings
              </Button>
            </CardContent>
          </Card>
        )}

        {!showDiagnostics && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowDiagnostics(true)}
            className="mb-4"
          >
            <Bug className="w-4 h-4 mr-2" />
            Show Diagnostics
          </Button>
        )}

        {/* Loading State */}
        {bookingsLoading && (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="bg-stone-50 h-20" />
                <CardContent className="h-32" />
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {bookingsError && (
          <Card className="p-8 text-center border-red-200 bg-red-50">
            <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to load bookings</h3>
            <p className="text-red-700 mb-4">{bookingsError.message}</p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </Card>
        )}

        {/* Empty State */}
        {!bookingsLoading && !bookingsError && bookings.length === 0 && (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-stone-300 mb-4" />
            <h3 className="text-xl font-semibold text-stone-700 mb-2">No bookings yet</h3>
            <p className="text-stone-500 mb-6">Find a trip you like and book your spot</p>
            <Link to={createPageUrl("Calendar")}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Browse Trips
              </Button>
            </Link>
          </Card>
        )}

        {/* Bookings List */}
        {!bookingsLoading && !bookingsError && bookings.length > 0 && (
          <div className="grid gap-4">
            {bookings.map((booking) => {
              const canCancel = ['pending', 'confirmed'].includes(booking.status);
              const showPaymentInfo = ['confirmed', 'paid'].includes(booking.status) && booking.payment_instructions;

              return (
                <Card key={booking.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-stone-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Link to={`${createPageUrl("TripDetails")}?id=${booking.trip_id}`}>
                          <CardTitle className="text-lg mb-2 hover:text-emerald-600 transition-colors">
                            {booking.trip_title}
                          </CardTitle>
                        </Link>
                        <div className="flex items-center gap-2 mb-2">
                          <StatusBadge status={booking.status} />
                          <span className="text-xs text-stone-500">
                            {formatDistanceToNow(new Date(booking.created_date), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      {canCancel && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelClick(booking)}
                          disabled={cancelBookingMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {/* Trip Details */}
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-stone-700">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          <span>{format(new Date(booking.trip_start_date), "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-stone-700">
                          <Users className="w-4 h-4 text-emerald-600" />
                          <span>{booking.number_of_people} {booking.number_of_people === 1 ? 'person' : 'people'}</span>
                        </div>
                      </div>

                      {/* Special Requirements */}
                      {booking.special_requirements && (
                        <div className="p-3 bg-stone-50 rounded-lg text-sm">
                          <p className="font-medium text-stone-700 mb-1">Special requirements:</p>
                          <p className="text-stone-600">{booking.special_requirements}</p>
                        </div>
                      )}

                      {/* Decline Reason */}
                      {booking.status === 'declined' && booking.decline_reason && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="font-medium text-red-900 flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4" />
                            Decline Reason:
                          </p>
                          <p className="text-sm text-red-700">{booking.decline_reason}</p>
                        </div>
                      )}

                      {/* Cancellation Reason */}
                      {booking.status === 'cancelled' && booking.cancellation_reason && (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <p className="font-medium text-gray-900 flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4" />
                            Cancellation Reason:
                          </p>
                          <p className="text-sm text-gray-700">{booking.cancellation_reason}</p>
                        </div>
                      )}

                      {/* Payment Instructions */}
                      {showPaymentInfo && <PaymentInstructionsPanel instructions={booking.payment_instructions} />}

                      {/* View Trip Button */}
                      <Link to={`${createPageUrl("TripDetails")}?id=${booking.trip_id}`}>
                        <Button variant="outline" className="w-full">
                          View Trip Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Cancel Booking Dialog */}
        <CancelBookingDialog
          open={cancelDialog.open}
          onOpenChange={(open) => setCancelDialog({ open, booking: open ? cancelDialog.booking : null })}
          onConfirm={handleCancelConfirm}
          isPending={cancelBookingMutation.isPending}
        />
        </div>
      </PageWrapper>
    </PullToRefresh>
  );
}