import React, { useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { createOptimisticTripCreate } from '../lib/optimistic-mutations';
import { useBackNavigation } from '../lib/useBackNavigation';

import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import useSEO from '../components/seo/useSEO';
import { useLanguage } from '../components/contexts/LanguageContext';
import { useTranslation } from '../components/translations/useTranslations';
import TripForm from '../components/trips/TripForm';

export default function CreateTripPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { goBack } = useBackNavigation(createPageUrl("MyTrips"));
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const saveDraftRef = useRef(false);

  useSEO({ title: t('create_trip.title'), description: 'Create hiking trip', noindex: true });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const recreateData = location.state?.tripData
    ? { ...location.state.tripData, start_date: "", end_date: "", status: "draft" }
    : null;

  // Notify all followers of this organizer about the new trip.
  // Fire-and-forget: errors are logged but never block navigation.
  const notifyFollowers = async (newTrip) => {
    
    // Guard: without an organizer_code the filter would return all follows
    if (!user?.organizer_code) {
      console.warn('[CreateTrip] No organizer_code found, skipping notifications');
      return;
    }

    try {
      const followers = await base44.entities.OrganizerFollow.filter({
        organizer_code: user.organizer_code,
      });

      if (!followers || followers.length === 0) {
        return;
      }

      // Use a relative path so React Router's navigate() works correctly when
      // the user clicks the notification in NotificationsBell.
      const tripPath = `/TripDetails?id=${newTrip.id}`;
      // Absolute URL kept only for the email CTA button href
      const tripUrl = `https://www.natureexplorers.gr${tripPath}`;
      const organizerName = user.full_name || user.username || '';

      // In-app notifications — bulk create, same pattern as trip cancellation in MyTrips.jsx
      const notificationsPayload = followers.map(follow => ({
        user_id: follow.user_id,
        title: language === 'el'
          ? `Νέα δραστηριότητα από ${organizerName}`
          : `New trip from ${organizerName}`,
        message: `"${newTrip.title}"`,
        is_read: false,
        link: tripPath,   // relative — navigable by React Router
      }));
      await base44.entities.Notification.bulkCreate(notificationsPayload);

      // Emails — best-effort with Promise.allSettled so one failure doesn't block others
      const emailPromises = followers.map(follow =>
        base44.integrations.Core.SendEmail({
          to: follow.user_email,
          subject: language === 'el'
            ? `Νέα δραστηριότητα από ${organizerName} | Nature Explorers`
            : `New Trip from ${organizerName} | Nature Explorers`,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #16a34a; padding: 20px; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 20px;">🏔️ Nature Explorers</h1>
              </div>
              <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
                <p style="color: #374151; font-size: 16px;">
                  ${language === 'el' ? `Γεια σου ${follow.user_name || ''},` : `Hello ${follow.user_name || ''},`}
                </p>
                <p style="color: #374151;">
                  ${language === 'el'
                    ? `Ο/Η <strong>${organizerName}</strong>, που ακολουθείς, ανέβασε νέα δραστηριότητα!`
                    : `<strong>${organizerName}</strong>, an organizer you follow, just published a new trip!`}
                </p>
                <div style="background: white; border: 1px solid #d1fae5; border-left: 4px solid #16a34a; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <p style="margin: 0 0 8px 0; font-weight: bold; color: #111827; font-size: 18px;">${newTrip.title}</p>
                  ${newTrip.start_date ? `<p style="color: #374151; margin: 4px 0;">📅 ${newTrip.start_date}</p>` : ''}
                  ${newTrip.location ? `<p style="color: #374151; margin: 4px 0;">📍 ${newTrip.location}</p>` : ''}
                </div>
                <a href="${tripUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                  ${language === 'el' ? 'Δες τη δραστηριότητα →' : 'View Trip Details →'}
                </a>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                <p style="color: #9ca3af; font-size: 12px;">
                  ${language === 'el'
                    ? `Λαμβάνεις αυτό το email επειδή ακολουθείς τον/την ${organizerName} στο Nature Explorers.`
                    : `You received this email because you follow ${organizerName} on Nature Explorers.`}
                </p>
              </div>
            </div>
          `,
        })
      );

      const emailResults = await Promise.allSettled(emailPromises);
      emailResults.forEach((result, i) => {
        if (result.status === 'rejected') {
          console.error(`[CreateTrip] Failed to send notification email to follower ${followers[i]?.user_email}:`, result.reason);
        }
      });
    } catch (err) {
      console.error('[CreateTrip] notifyFollowers error:', err);
      console.error('[CreateTrip] Error stack:', err.stack);
    }
  };

  const handleSubmit = async (data) => {
    const isDraft = saveDraftRef.current;
    const dataToSave = isDraft ? { ...data, status: "draft" } : data;
    saveDraftRef.current = false;

    const newTrip = await base44.entities.HikingTrip.create({ ...dataToSave, organizer_code: user.organizer_code });

    // Notify followers only when publishing — drafts are silent
    if (!isDraft && newTrip?.id) {
      await notifyFollowers(newTrip); // Wait for notifications to be created
      // Invalidate notification queries so the bell updates immediately
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    }

    navigate(createPageUrl("MyTrips"));
    return newTrip;
  };

  const createMutation = useMutation({
    mutationFn: handleSubmit,
    ...createOptimisticTripCreate(queryClient, user?.organizer_code),
  });
  const hasOrganizerCode = user?.organizer_code;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 p-4 md:p-8 w-full overflow-x-hidden">
      <div className="max-w-3xl mx-auto w-full min-w-0">
        <Button
          variant="outline"
          className="mb-6 min-h-[44px]"
          onClick={goBack}
          aria-label={t('create_trip.back_to_trips')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          {t('create_trip.back_to_trips')}
        </Button>

        <Card className="p-4 md:p-8 w-full overflow-x-hidden">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6 break-words">{t('create_trip.title')}</h1>

          {!hasOrganizerCode && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-amber-800 font-medium">
                {language === 'el'
                  ? 'Πρέπει να συνδεθείτε με ένα προφίλ Διοργανωτή για να δημιουργήσετε εκδρομές. Παρακαλώ επικοινωνήστε με έναν διαχειριστή.'
                  : 'You need to be linked to an Organizer profile to create trips. Please contact an admin.'}
              </p>
            </div>
          )}

          <TripForm
            initialData={recreateData}
            isEditing={false}
            isSubmitting={createMutation.isPending}
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => navigate(createPageUrl("MyTrips"))}
            onSaveDraft={() => { saveDraftRef.current = true; }}
          />
        </Card>
      </div>
    </div>
  );
}