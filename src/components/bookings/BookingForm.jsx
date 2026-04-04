import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Booking, Notification, Organizer } from '@/api/db';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Loader2, CheckCircle2, Users, Euro, Info } from 'lucide-react';
import { toast } from 'sonner';
import { getPricingOptions, getLowestPrice } from '@/components/helpers/pricingHelpers';

/**
 * Modal booking form shown on TripDetails for Premium-organizer trips.
 *
 * Props:
 *   trip       — the full trip object
 *   organizer  — the organizer object (needs organizer_code, full_name)
 *   open       — boolean
 *   onClose    — callback
 */
export default function BookingForm({ trip, organizer, open, onClose }) {
  const { user, navigateToLogin } = useAuth();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  if (open && !user) {
    navigateToLogin();
    onClose();
    return null;
  }

  const [people, setPeople] = useState(1);
  const [selectedPricingOption, setSelectedPricingOption] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const pricingOptions = getPricingOptions(trip);
  const hasPricingOptions = pricingOptions && pricingOptions.length > 0;

  const selectedPrice = hasPricingOptions
    ? (selectedPricingOption ?? pricingOptions[0])
    : null;

  const pricePerPerson = selectedPrice?.price ?? trip?.price ?? 0;

  // Read remaining slots directly from trip.pricing_options[tier].remaining.
  // This field is maintained by the organizer's confirm/decline actions in BookingCard.
  // No cross-table query needed — no RLS issues.
  const getAvailability = (label) => {
    const tier = (trip?.pricing_options || []).find(t => t.label === label);
    if (!tier || !tier.slots) return null; // no per-tier limit set
    return tier.remaining ?? tier.slots;   // fallback to slots if remaining not yet initialized
  };

  const currentTierAvailability = getAvailability(selectedPrice?.label);
  const maxPeople = Math.min(
    trip?.total_attendees || 99,
    currentTierAvailability ?? (trip?.total_attendees || 99)
  );

  const totalPrice = pricePerPerson * people;

  const bookingMutation = useMutation({
    mutationFn: async () => {
      const booking = await Booking.create({
        trip_id: trip.id,
        user_id: user.id,
        number_of_people: people,
        status: 'pending',
        notes: notes.trim() || null,
        pricing_option_label: selectedPrice?.label || null,
        price_per_person: pricePerPerson,
        total_price: totalPrice,
      });

      // Notify the organizer in-app
      if (organizer?.organizer_code) {
        try {
          // Prefer organizer.user_id; fall back to looking up the profile row
          let organizerUserId = organizer.user_id ?? null;
          if (!organizerUserId) {
            const { data: orgProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('organizer_code', organizer.organizer_code)
              .single();
            organizerUserId = orgProfile?.id ?? null;
          }

          if (organizerUserId) {
            const hikerName = user.full_name || user.username || user.email;
            await Notification.create({
              user_id: organizerUserId,
              title: `New booking request for "${trip.title}"`,
              message: `${hikerName} requested ${people} spot${people > 1 ? 's' : ''}.`,
              link: `/managebookings`,
              is_read: false,
            });
            queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
          }
        } catch {
          // Non-critical
        }
      }

      return booking;
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['my-bookings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['trip', trip?.id] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to submit booking. Please try again.');
    },
  });

  const handleClose = () => {
    setSubmitted(false);
    setPeople(1);
    setNotes('');
    setSelectedPricingOption(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-center">Request Sent!</DialogTitle>
              <DialogDescription className="text-center">
                Your booking request has been sent to the organizer. You'll be notified once they review it.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={handleClose} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Book this trip</DialogTitle>
              <DialogDescription className="line-clamp-2">{trip?.title}</DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Pricing option selector */}
              {hasPricingOptions && (
                <div className="space-y-2">
                  <Label>Pricing option</Label>
                  <div className="flex flex-col gap-2">
                    {pricingOptions.map((opt) => {
                      const isSelected = (selectedPricingOption ?? pricingOptions[0]).label === opt.label;
                      const availability = getAvailability(opt.label);
                      const isFull = availability === 0;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => {
                            if (!isFull) {
                              setSelectedPricingOption(opt);
                              setPeople(p => {
                                if (availability !== null && p > availability) {
                                  toast.info(`Participant count reduced to ${availability} to fit available spots in "${opt.label}".`);
                                  return availability;
                                }
                                return p;
                              });
                            }
                          }}
                          disabled={isFull || bookingMutation.isPending}
                          className={`flex items-center justify-between p-3 rounded-lg border text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-border hover:border-emerald-300'
                          }`}
                        >
                          <span className="text-sm font-medium">{opt.label}</span>
                          <div className="flex items-center gap-2">
                            {availability !== null && (
                              <span className={`text-xs ${isFull ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                                {isFull ? 'Full' : `${availability} left`}
                              </span>
                            )}
                            <span className="text-sm font-bold text-emerald-700">€{opt.price}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Number of people */}
              <div className="space-y-2">
                <Label>Number of participants</Label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setPeople(p => Math.max(1, p - 1))}
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-40"
                    disabled={people <= 1 || bookingMutation.isPending}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 min-w-[3rem] justify-center">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-lg font-semibold">{people}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPeople(p => Math.min(maxPeople, p + 1))}
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-40"
                    disabled={people >= maxPeople || bookingMutation.isPending}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="booking-notes">Notes for the organizer <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  id="booking-notes"
                  placeholder="Any questions, dietary needs, or information the organizer should know..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  disabled={bookingMutation.isPending}
                />
              </div>

              {/* Price summary */}
              {pricePerPerson > 0 && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">
                    €{pricePerPerson} × {people} {people === 1 ? 'person' : 'people'}
                  </span>
                  <div className="flex items-center gap-1 font-bold text-emerald-700">
                    <Euro className="w-4 h-4" />
                    <span>{totalPrice}</span>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                This is a booking <strong>request</strong>. The organizer will review and confirm it. Payment instructions will be shared upon confirmation.
              </p>
            </div>

            <Button
              onClick={() => bookingMutation.mutate()}
              disabled={bookingMutation.isPending || currentTierAvailability === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {bookingMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending request...</>
                : 'Send booking request'
              }
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
