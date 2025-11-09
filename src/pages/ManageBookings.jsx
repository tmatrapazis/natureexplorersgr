
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Phone, MessageSquare, ArrowLeft, Check, X, Loader2, Info, DollarSign } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import DeclineBookingDialog from '../components/bookings/DeclineBookingDialog';
import BookingStatusBadge from '../components/bookings/BookingStatusBadge';
import { useToast } from '@/components/ui/use-toast';
import useSEO from '../components/seo/useSEO'; // New import
import { useLanguage } from '../components/language/LanguageProvider'; // New import
import { useTranslation } from 'react-i18next'; // New import

const BookingCard = ({ booking, tripId, trip, onConfirm, onDecline, onMarkPaid, onUpdatePayment, isProcessing }) => {
  const [paymentInstructions, setPaymentInstructions] = useState(booking.payment_instructions || '');
  const [showPaymentEdit, setShowPaymentEdit] = useState(false);

  const handleSavePayment = () => {
    onUpdatePayment(booking, paymentInstructions);
    setShowPaymentEdit(false);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="bg-stone-50">
        <div className="flex justify-between items-start">
          <Link 
            to={`${createPageUrl("HikerProfile")}?id=${booking.user_id}&tripId=${tripId}`} 
            className="flex items-center gap-2 group"
          >
            <User className="w-5 h-5 text-stone-500 group-hover:text-emerald-600" />
            <span className="font-bold text-stone-800 group-hover:text-emerald-700">
              {booking.username}
            </span>
          </Link>
          <BookingStatusBadge status={booking.status} />
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="text-sm text-stone-600 space-y-2">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-stone-400" />
            <span>{booking.user_email}</span>
          </div>
          {booking.phone_number && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-stone-400" />
              <span>{booking.phone_number}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-stone-400" />
            <span>{booking.number_of_people} person(s)</span>
          </div>
          {trip?.price && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-stone-400" />
              <span className="font-semibold">
                Total: ${(trip.price * booking.number_of_people).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {booking.special_requirements && (
          <div className="p-3 bg-stone-50 rounded-md text-sm">
            <p className="font-medium text-stone-700 flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4"/> Special Requirements:
            </p>
            <p className="text-stone-600">{booking.special_requirements}</p>
          </div>
        )}

        {booking.status === 'declined' && booking.decline_reason && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm">
            <p className="font-medium text-red-700 flex items-center gap-2 mb-1">
              <Info className="w-4 h-4"/> Decline Reason:
            </p>
            <p className="text-red-600">{booking.decline_reason}</p>
          </div>
        )}

        {booking.status === 'cancelled' && booking.cancellation_reason && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm">
            <p className="font-medium text-gray-700 flex items-center gap-2 mb-1">
              <Info className="w-4 h-4"/> Cancellation Reason:
            </p>
            <p className="text-gray-600">{booking.cancellation_reason}</p>
          </div>
        )}

        {(booking.status === 'confirmed' || booking.status === 'paid') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Payment Instructions</Label>
              {booking.status === 'confirmed' && !showPaymentEdit && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowPaymentEdit(true)}
                >
                  {booking.payment_instructions ? 'Edit' : 'Add'}
                </Button>
              )}
            </div>
            {showPaymentEdit ? (
              <div className="space-y-2">
                <Textarea
                  value={paymentInstructions}
                  onChange={(e) => setPaymentInstructions(e.target.value)}
                  placeholder="e.g., Bank: IBAN: GR123..., Reference: Trip Name"
                  rows={4}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleSavePayment}
                    disabled={isProcessing}
                  >
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setShowPaymentEdit(false);
                      setPaymentInstructions(booking.payment_instructions || '');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : booking.payment_instructions ? (
              <div className="p-3 bg-emerald-50 rounded-md text-sm">
                <pre className="whitespace-pre-wrap font-sans text-stone-700">
                  {booking.payment_instructions}
                </pre>
              </div>
            ) : (
              <p className="text-sm text-stone-500 italic">No payment instructions set</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {booking.status === 'pending' && (
            <>
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700" 
                onClick={() => onConfirm(booking)} 
                disabled={isProcessing}
              >
                <Check className="w-4 h-4 mr-2" /> Confirm
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => onDecline(booking)} 
                disabled={isProcessing}
              >
                <X className="w-4 h-4 mr-2" /> Decline
              </Button>
            </>
          )}
          {booking.status === 'confirmed' && (
            <Button 
              size="sm" 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onMarkPaid(booking)} 
              disabled={isProcessing}
            >
              <Check className="w-4 h-4 mr-2" /> Mark as Paid
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function ManageBookingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get("tripId");
  
  const [declineDialog, setDeclineDialog] = useState({ open: false, booking: null });

  const { language } = useLanguage();
  const { t } = useTranslation(language);

  // Prevent indexing - this is an authenticated page
  useSEO({
    title: t('manage_bookings.title'),
    description: 'Manage trip bookings',
    noindex: true
  });

  const { data: trip, isLoading: tripLoading } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => (await base44.entities.HikingTrip.filter({ id: tripId }))[0],
    enabled: !!tripId,
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['trip-bookings', tripId],
    queryFn: () => base44.entities.Booking.filter({ trip_id: tripId }, "-created_date"),
    enabled: !!tripId,
  });
  
  const manageBookingMutation = useMutation({
    mutationFn: async ({ booking, newStatus, decline_reason, payment_instructions }) => {
      const updateData = { status: newStatus };
      if (decline_reason) updateData.decline_reason = decline_reason;
      if (payment_instructions !== undefined) updateData.payment_instructions = payment_instructions;
      
      const updatedBooking = await base44.entities.Booking.update(booking.id, updateData);

      // Handle notifications and emails based on status
      if (newStatus === 'confirmed') {
        const totalPrice = (trip.price || 0) * (booking.number_of_people || 1);
        
        // Create notification (always works)
        try {
          await base44.entities.Notification.create({
            user_id: booking.user_id,
            title: "Your booking is confirmed — payment details inside",
            message: `Your booking for "${trip.title}" is confirmed. Check your email for payment instructions.`,
            link: createPageUrl('MyBookings'),
          });
        } catch (error) {
          console.warn('Failed to create notification:', error);
        }
        
        // Send email (optional)
        try {
          await base44.integrations.Core.SendEmail({
            to: booking.user_email,
            subject: "Your booking is confirmed — payment details inside",
            body: `
              <h2>Booking Confirmed!</h2>
              <p>Hi ${booking.username},</p>
              <p>Your booking for <strong>${trip.title}</strong> is confirmed.</p>
              <hr/>
              <h3>Payment Details:</h3>
              ${payment_instructions ? `<pre style="background: #f3f4f6; padding: 15px; border-radius: 6px; white-space: pre-wrap;">${payment_instructions}</pre>` : '<p>Payment instructions will be sent separately.</p>'}
              <p><strong>Total Amount:</strong> $${totalPrice.toFixed(2)} (${booking.number_of_people} person${booking.number_of_people > 1 ? 's' : ''})</p>
              <p>After payment, we'll mark your booking as Paid.</p>
              <hr/>
              <p><strong>Trip Date:</strong> ${format(new Date(trip.start_date), 'MMMM d, yyyy')}</p>
              <p><a href="${window.location.origin}${createPageUrl('MyBookings')}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">View My Bookings</a></p>
            `
          });
        } catch (error) {
          console.warn('Failed to send email for confirmed booking:', error);
        }
      } else if (newStatus === 'paid') {
        try {
          await base44.entities.Notification.create({
            user_id: booking.user_id,
            title: "Payment received — booking marked as Paid",
            message: `Payment received for "${trip.title}". Status: Paid. See you on the trail!`,
            link: createPageUrl('MyBookings'),
          });
        } catch (error) {
          console.warn('Failed to create notification:', error);
        }
        
        try {
          await base44.integrations.Core.SendEmail({
            to: booking.user_email,
            subject: "Payment received — booking marked as Paid",
            body: `
              <h2>Payment Received!</h2>
              <p>Hi ${booking.username},</p>
              <p>We've received your payment for <strong>${trip.title}</strong>.</p>
              <p><strong>Status:</strong> Paid ✓</p>
              <p>See you on the trail!</p>
              <hr/>
              <p><strong>Trip Date:</strong> ${format(new Date(trip.start_date), 'MMMM d, yyyy')}</p>
              <p><a href="${window.location.origin}${createPageUrl('MyBookings')}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">View My Bookings</a></p>
            `
          });
        } catch (error) {
          console.warn('Failed to send email for paid booking:', error);
        }
      } else if (newStatus === 'declined') {
        try {
          await base44.entities.Notification.create({
            user_id: booking.user_id,
            title: "Your booking was declined",
            message: `Your booking for "${trip.title}" was declined. ${decline_reason ? `Reason: ${decline_reason}` : ''}`,
            link: createPageUrl('MyBookings'),
          });
        } catch (error) {
          console.warn('Failed to create notification:', error);
        }
        
        try {
          await base44.integrations.Core.SendEmail({
            to: booking.user_email,
            subject: "Your booking was declined",
            body: `
              <h2>Booking Declined</h2>
              <p>Hi ${booking.username},</p>
              <p>Your booking for <strong>${trip.title}</strong> was declined.</p>
              ${decline_reason ? `<p><strong>Reason:</strong> ${decline_reason}</p>` : ''}
              <p>If you have questions, please reply to this email.</p>
              <hr/>
              <p><a href="${window.location.origin}${createPageUrl('Calendar')}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">Browse Other Trips</a></p>
            `
          });
        } catch (error) {
          console.warn('Failed to send email for declined booking:', error);
        }
      }

      return updatedBooking;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trip-bookings', tripId] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      const actionLabels = {
        confirmed: 'confirmed',
        paid: 'marked as paid',
        declined: 'declined'
      };
      
      toast({
        title: "Success",
        description: `Booking ${actionLabels[variables.newStatus] || 'updated'} successfully.`,
      });
    }
  });
  
  const handleConfirm = (booking) => {
    manageBookingMutation.mutate({ 
      booking, 
      newStatus: 'confirmed',
      payment_instructions: booking.payment_instructions || ''
    });
  };

  const handleDeclineConfirm = (reason) => {
    manageBookingMutation.mutate({ 
      booking: declineDialog.booking, 
      newStatus: 'declined', 
      decline_reason: reason 
    });
    setDeclineDialog({ open: false, booking: null });
  };

  const handleMarkPaid = (booking) => {
    if (window.confirm('Mark this booking as paid? This confirms payment has been received.')) {
      manageBookingMutation.mutate({ booking, newStatus: 'paid' });
    }
  };

  const handleUpdatePayment = (booking, instructions) => {
    manageBookingMutation.mutate({ 
      booking, 
      newStatus: booking.status,
      payment_instructions: instructions
    });
  };

  const isLoading = tripLoading || bookingsLoading;
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600"/>
      </div>
    );
  }
  
  const filterBookings = (status) => bookings.filter(b => b.status === status);
  const tabs = ['pending', 'confirmed', 'paid', 'declined', 'cancelled'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl("MyTrips")}>
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Trips
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900">{trip?.title}</h1>
          <p className="text-stone-600">Manage Bookings</p>
        </div>
        
        <Tabs defaultValue="pending">
          <TabsList className="grid w-full grid-cols-5">
            {tabs.map(tab => (
              <TabsTrigger key={tab} value={tab} className="capitalize">
                {tab} ({filterBookings(tab).length})
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map(tab => (
            <TabsContent key={tab} value={tab}>
              <div className="space-y-4 pt-4">
                {filterBookings(tab).length > 0 ? (
                  filterBookings(tab).map(booking => (
                    <BookingCard 
                      key={booking.id}
                      booking={booking}
                      tripId={tripId}
                      trip={trip}
                      onConfirm={handleConfirm}
                      onDecline={(b) => setDeclineDialog({ open: true, booking: b })}
                      onMarkPaid={handleMarkPaid}
                      onUpdatePayment={handleUpdatePayment}
                      isProcessing={manageBookingMutation.isPending}
                    />
                  ))
                ) : (
                  <div className="text-center py-10 text-stone-500">No {tab} bookings.</div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        <DeclineBookingDialog
          open={declineDialog.open}
          onOpenChange={(open) => setDeclineDialog({ open, booking: open ? declineDialog.booking : null })}
          onConfirm={handleDeclineConfirm}
          isPending={manageBookingMutation.isPending}
        />
      </div>
    </div>
  );
}
