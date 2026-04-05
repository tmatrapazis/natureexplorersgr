import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Booking, Notification, HikingTrip } from '@/api/db';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Euro, Users, Clock, ChevronDown, ChevronUp, MessageSquare, CreditCard, Phone, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useLanguage } from '@/components/contexts/LanguageContext';
import { useTranslation } from '@/components/translations/useTranslations';
import {
  sendBookingConfirmedEmail,
  sendBookingDeclinedEmail,
  sendBookingPaidEmail,
} from '@/api/emailNotifications';

const STATUS_STYLES = {
  pending:   'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  paid:      'bg-emerald-100 text-emerald-800 border-emerald-200',
  declined:  'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

/**
 * Single booking row shown in organizer's booking list.
 *
 * Props:
 *   booking             — booking object
 *   hikerProfile        — profile of the hiker (may be null)
 *   paymentInstructions — string organizer can set for payment
 *   tripTitle           — title of the trip (passed from parent to avoid re-fetching)
 */
export default function BookingCard({ booking, hikerProfile, paymentInstructions, tripTitle }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const [expanded, setExpanded] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const hikerName = hikerProfile?.full_name || hikerProfile?.username || hikerProfile?.email || 'Unknown hiker';
  const hikerEmail = hikerProfile?.email || '';

  const statusLabel = t(`booking.status_label_${booking.status}`) || booking.status;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['organizer-bookings-trip', booking.trip_id] });
    queryClient.invalidateQueries({ queryKey: ['all-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['trip', booking.trip_id] });
    queryClient.invalidateQueries({ queryKey: ['my-trips'] });
  };

  // Update `remaining` on the trip's pricing_options tier to reflect a slot change.
  const updateTierRemaining = async (delta) => {
    if (!booking.pricing_option_label) return;
    const trips = await HikingTrip.filter({ id: booking.trip_id });
    const trip = trips?.[0];
    if (!trip?.pricing_options?.length) return;
    const updated = trip.pricing_options.map(tier =>
      tier.label === booking.pricing_option_label
        ? { ...tier, remaining: Math.max(0, Math.min(tier.slots ?? 999999, (tier.remaining ?? tier.slots ?? 0) + delta)) }
        : tier
    );
    await HikingTrip.update(booking.trip_id, { pricing_options: updated });
  };

  const updateMutation = useMutation({
    mutationFn: async ({ status, extra = {} }) => {
      const result = await Booking.update(booking.id, { status, ...extra });
      if (status === 'confirmed') {
        await updateTierRemaining(-(booking.number_of_people || 0));
      } else if ((status === 'declined' || status === 'cancelled') && booking.status === 'confirmed') {
        await updateTierRemaining(booking.number_of_people || 0);
      }
      return result;
    },
    onSuccess: (_, { status }) => {
      const toastMsg =
        status === 'confirmed' ? t('booking.action_confirmed_toast') :
        status === 'paid'      ? t('booking.action_paid_toast') :
                                 t('booking.action_declined_toast');
      toast.success(toastMsg);
      invalidate();

      // Notify hiker — use tripTitle prop (passed from parent) to avoid stale field
      const resolvedTitle = tripTitle || '';
      const notificationTitles = {
        confirmed: `Your booking${resolvedTitle ? ` for "${resolvedTitle}"` : ''} was confirmed!`,
        declined:  `Your booking${resolvedTitle ? ` for "${resolvedTitle}"` : ''} was declined.`,
        paid:      `Your booking${resolvedTitle ? ` for "${resolvedTitle}"` : ''} is fully confirmed — payment received.`,
      };
      if (notificationTitles[status]) {
        Notification.create({
          user_id: booking.user_id,
          title: notificationTitles[status],
          message: status === 'confirmed' && paymentInstructions
            ? `Payment instructions: ${paymentInstructions}`
            : rejectNote || null,
          link: `/mybookings`,
          is_read: false,
        }).catch(() => {});
      }

      // Send email to hiker (fire-and-forget)
      const hikerEmail = hikerProfile?.email;
      const hikerDisplayName = hikerProfile?.full_name || hikerProfile?.username || '';
      if (hikerEmail) {
        if (status === 'confirmed') {
          sendBookingConfirmedEmail({
            hikerEmail,
            hikerName: hikerDisplayName,
            tripTitle: resolvedTitle,
            paymentInstructions: paymentInstructions || null,
          });
        } else if (status === 'declined') {
          sendBookingDeclinedEmail({
            hikerEmail,
            hikerName: hikerDisplayName,
            tripTitle: resolvedTitle,
            reason: rejectNote || null,
          });
        } else if (status === 'paid') {
          sendBookingPaidEmail({
            hikerEmail,
            hikerName: hikerDisplayName,
            tripTitle: resolvedTitle,
          });
        }
      }
    },
    onError: () => toast.error(t('booking.action_failed_toast')),
  });

  const handleConfirm = () => updateMutation.mutate({ status: 'confirmed' });
  const handleMarkPaid = () => updateMutation.mutate({ status: 'paid' });
  const handleDecline = () => {
    updateMutation.mutate({ status: 'declined' });
    setShowRejectInput(false);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header row */}
        <button
          type="button"
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{hikerName}</span>
              {hikerEmail && <span className="text-xs text-muted-foreground">{hikerEmail}</span>}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {booking.number_of_people} {booking.number_of_people === 1 ? t('booking.person') : t('booking.people')}
              </span>
              {booking.total_price > 0 && (
                <span className="flex items-center gap-1">
                  <Euro className="w-3 h-3" />
                  {booking.total_price}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
          <Badge className={`${STATUS_STYLES[booking.status]} border text-xs flex-shrink-0`}>
            {statusLabel}
          </Badge>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          }
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
            {booking.pricing_option_label && (
              <p className="text-sm">
                <span className="text-muted-foreground">{t('booking.pricing_option_label')} </span>
                {booking.pricing_option_label}
              </p>
            )}
            {booking.notes && (
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground italic">"{booking.notes}"</p>
              </div>
            )}

            {/* Hiker health & safety info */}
            {hikerProfile && (
              hikerProfile.date_of_birth ||
              hikerProfile.training_status ||
              hikerProfile.health_status ||
              hikerProfile.blood_type ||
              hikerProfile.medical_needs ||
              hikerProfile.dietary_requirements ||
              hikerProfile.emergency_contact_name ||
              hikerProfile.emergency_contact_number
            ) && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Shield className="w-3 h-3" /> {t('booking.safety_health')}
                </p>
                {hikerProfile.date_of_birth && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">{t('booking.age')}: </span>
                    {Math.floor((new Date() - new Date(hikerProfile.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))} {t('booking.years_old')}
                  </p>
                )}
                {hikerProfile.training_status && (
                  <p className="text-sm"><span className="text-muted-foreground">{t('booking.fitness_level')}: </span>{hikerProfile.training_status}</p>
                )}
                {hikerProfile.blood_type && (
                  <p className="text-sm"><span className="text-muted-foreground">{t('booking.blood_type')}: </span><strong>{hikerProfile.blood_type}</strong></p>
                )}
                {hikerProfile.health_status && (
                  <p className="text-sm"><span className="text-muted-foreground">{t('booking.general_health')}: </span>{hikerProfile.health_status}</p>
                )}
                {hikerProfile.medical_needs && (
                  <p className="text-sm"><span className="text-muted-foreground">{t('booking.allergies_medical')}: </span>{hikerProfile.medical_needs}</p>
                )}
                {hikerProfile.dietary_requirements && (
                  <p className="text-sm"><span className="text-muted-foreground">{t('booking.dietary_requirements')}: </span>{hikerProfile.dietary_requirements}</p>
                )}
                {(hikerProfile.emergency_contact_name || hikerProfile.emergency_contact_number) && (
                  <p className="text-sm flex items-center gap-1">
                    <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">{t('booking.emergency_contact')}: </span>
                    {hikerProfile.emergency_contact_name && <span>{hikerProfile.emergency_contact_name}</span>}
                    {hikerProfile.emergency_contact_name && hikerProfile.emergency_contact_number && <span> · </span>}
                    {hikerProfile.emergency_contact_number && <span>{hikerProfile.emergency_contact_number}</span>}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            {booking.status === 'pending' && (
              <div className="space-y-2">
                {showRejectInput ? (
                  <div className="space-y-2">
                    <Textarea
                      placeholder={t('booking.decline_reason_placeholder')}
                      value={rejectNote}
                      onChange={e => setRejectNote(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={handleDecline} disabled={updateMutation.isPending}>
                        {t('booking.confirm_decline')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowRejectInput(false)}>
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 flex-1" onClick={handleConfirm} disabled={updateMutation.isPending}>
                      <Check className="w-3 h-3 mr-1" /> {t('booking.approve')}
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 flex-1" onClick={() => setShowRejectInput(true)}>
                      <X className="w-3 h-3 mr-1" /> {t('common.decline')}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {booking.status === 'confirmed' && (
              <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleMarkPaid} disabled={updateMutation.isPending}>
                <CreditCard className="w-3 h-3 mr-1" /> {t('booking.mark_paid')}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
