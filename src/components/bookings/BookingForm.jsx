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
import { Minus, Plus, Loader2, CheckCircle2, Users, Euro } from 'lucide-react';
import { toast } from 'sonner';
import { getPricingOptions, getLowestPrice } from '@/components/helpers/pricingHelpers';
import { useLanguage } from '@/components/contexts/LanguageContext';
import { useTranslation } from '@/components/translations/useTranslations';

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
  const { language } = useLanguage();
  const { t } = useTranslation(language);

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

  const getAvailability = (label) => {
    const tier = (trip?.pricing_options || []).find(t => t.label === label);
    if (!tier || !tier.slots) return null;
    return tier.remaining ?? tier.slots;
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
      toast.error(err.message || t('errors.generic'));
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
              <DialogTitle className="text-center">{t('booking.request_sent_title')}</DialogTitle>
              <DialogDescription className="text-center">
                {t('booking.request_sent_message')}
              </DialogDescription>
            </DialogHeader>
            <Button onClick={handleClose} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {t('booking.done')}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('booking.form_title')}</DialogTitle>
              <DialogDescription className="line-clamp-2">{trip?.title}</DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Pricing option selector */}
              {hasPricingOptions && (
                <div className="space-y-2">
                  <Label>{t('booking.pricing_option')}</Label>
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
                                  toast.info(`${t('booking.participants')} ${availability}`);
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
                                {isFull ? t('booking.tier_full') : `${availability} ${t('booking.left')}`}
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
                <Label>{t('booking.participants')}</Label>
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
                <Label htmlFor="booking-notes">
                  {t('booking.notes_label')}{' '}
                  <span className="text-muted-foreground font-normal">{t('booking.notes_optional')}</span>
                </Label>
                <Textarea
                  id="booking-notes"
                  placeholder={t('booking.notes_placeholder')}
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
                    €{pricePerPerson} × {people} {people === 1 ? t('booking.person') : t('booking.people')}
                  </span>
                  <div className="flex items-center gap-1 font-bold text-emerald-700">
                    <Euro className="w-4 h-4" />
                    <span>{totalPrice}</span>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {t('booking.request_notice')}
              </p>
            </div>

            <Button
              onClick={() => bookingMutation.mutate()}
              disabled={bookingMutation.isPending || currentTierAvailability === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {bookingMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('booking.sending_request')}</>
                : t('booking.send_request')
              }
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
