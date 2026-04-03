import React, { useState, useEffect, useRef } from "react";

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { HikingTrip, OrganizerFollow, Organizer, Notification } from "@/api/db";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { createOptimisticTripCreate, createOptimisticTripUpdate } from '../lib/optimistic-mutations';
import { useBackNavigation } from '../lib/useBackNavigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import useSEO from '../components/seo/useSEO';
import { useLanguage } from '../components/contexts/LanguageContext';
import { useTranslation } from '../components/translations/useTranslations';
import TripFormFields from '../components/trips/TripForm';

export default function TripFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { goBack: navigateBack } = useBackNavigation(createPageUrl("MyTrips"));
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get("id");
  const isEditing = !!tripId;

  const saveDraftRef = useRef(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [lastSubmittedData, setLastSubmittedData] = useState(null);

  useSEO({
    title: isEditing ? t('create_trip.edit_title') : t('create_trip.title'),
    description: isEditing ? 'Edit hiking trip' : 'Create hiking trip',
    noindex: true
  });

  const { user } = useAuth();

  const { data: trip, isLoading: tripLoading } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const results = await HikingTrip.filter({ id: tripId });
      return results[0];
    },
    enabled: !!tripId,
  });

  // For recreating a trip from navigation state (only relevant in create mode)
  const recreateData = !isEditing && location.state?.tripData
    ? { ...location.state.tripData, start_date: "", end_date: "", status: "draft" }
    : null;

  // Unsaved changes guard (edit mode only)
  useEffect(() => {
    if (!isEditing) return;
    const handleBeforeUnload = (e) => {
      if (isFormDirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormDirty, isEditing]);

  // Notify all followers when a trip is published for the first time.
  // Single source of truth — CreateTrip.jsx intentionally has no notification logic.
  const notifyFollowersOnPublish = async (publishedTrip) => {
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

      const organizerName = organizers?.[0]?.full_name || user.full_name || user.username || user.organizer_code;
      await Notification.bulkCreate(
        eligibleFollows.map(f => ({
          user_id: f.user_id,
          title: language === 'el'
            ? `Νέα εκδρομή από ${organizerName}`
            : `New trip from ${organizerName}`,
          message: `"${publishedTrip.title}"`,
          link: `/tripdetails?id=${publishedTrip.id}`,
          is_read: false,
        }))
      );
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    } catch {
      // Non-critical — never block navigation on notification failure
    }
  };

  const createMutation = useMutation({
    mutationFn: async (/** @type {any} */ data) => {
      if (!user?.organizer_code) throw new Error('Your account is not linked to an organizer profile.');
      const dataToSave = saveDraftRef.current ? { ...data, status: "draft" } : data;
      saveDraftRef.current = false;
      return await HikingTrip.create({ ...dataToSave, organizer_code: user.organizer_code });
    },
    // Optimistic: show trip in My Trips immediately while API call completes
    ...createOptimisticTripCreate(queryClient, user?.organizer_code),
    onError: (err) => toast.error(err.message || 'Failed to create trip.'),
    onSuccess: async (newTrip) => {
      // Notify followers when organizer publishes a new trip (not a draft)
      if (newTrip.status && newTrip.status !== 'draft') {
        await notifyFollowersOnPublish(newTrip);
      }
      queryClient.invalidateQueries({ queryKey: ['hiking-trips'] });
      queryClient.invalidateQueries({ queryKey: ['my-trips', user?.organizer_code] });
      navigate(createPageUrl("MyTrips"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (/** @type {any} */ data) => {
      const { created_date, updated_date, id, created_by, view_count, organizer_name, organizer_is_verified, organizer_email, computedStatus, ...clean } = data;
      if (!clean.end_date) clean.end_date = clean.start_date;
      return await HikingTrip.update(tripId, clean);
    },
    // Optimistic: reflect changes in the list immediately
    ...createOptimisticTripUpdate(queryClient, tripId, user?.organizer_code),
    onSuccess: async (result, variables) => {
      // Notify followers when a draft is promoted to upcoming via the edit form
      if (trip?.status === 'draft' && variables.status === 'upcoming') {
        await notifyFollowersOnPublish({ id: tripId, title: result?.title || variables.title });
      }
      queryClient.invalidateQueries({ queryKey: ['hiking-trips'] });
      queryClient.invalidateQueries({ queryKey: ['my-trips', user?.organizer_code] });
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      setIsFormDirty(false);
      navigate(createPageUrl("MyTrips"));
    },
  });

  const handleSubmit = (data) => {
    setLastSubmittedData(data);
    if (isEditing) {
      setIsFormDirty(false);
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleNavigateAway = (destination) => {
    if (isEditing && isFormDirty) {
      setPendingNavigation(destination);
      setShowExitDialog(true);
    } else {
      if (destination) navigate(destination);
      else navigateBack();
    }
  };

  const handleDiscardAndExit = () => {
    setIsFormDirty(false);
    setShowExitDialog(false);
    if (pendingNavigation) navigate(pendingNavigation);
    else navigateBack();
  };

  const handleSaveAndExit = async () => {
    setShowExitDialog(false);
    if (lastSubmittedData) await updateMutation.mutateAsync(lastSubmittedData);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEditing && (tripLoading || !trip)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  const initialData = isEditing ? trip : recreateData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 p-4 md:p-8 w-full overflow-x-hidden">
      <div className="max-w-3xl mx-auto w-full min-w-0">
        <Button 
          variant="outline" 
          className="mb-6 min-h-[44px]" 
          onClick={() => handleNavigateAway(null)}
          aria-label={t('create_trip.back_to_trips')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          {t('create_trip.back_to_trips')}
        </Button>

        <Card className="p-4 md:p-8 w-full overflow-x-hidden">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6 break-words">
            {isEditing ? t('create_trip.edit_title') : t('create_trip.title')}
          </h1>

          {!isEditing && !user?.organizer_code && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-amber-800 font-medium">
                {language === 'el'
                  ? 'Πρέπει να συνδεθείτε με ένα προφίλ Διοργανωτή για να δημιουργήσετε εκδρομές. Παρακαλώ επικοινωνήστε με έναν διαχειριστή.'
                  : 'You need to be linked to an Organizer profile to create trips. Please contact an admin.'}
              </p>
            </div>
          )}

          <TripFormFields
            key={isEditing ? trip?.id : 'new'}
            initialData={initialData}
            isEditing={isEditing}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={() => handleNavigateAway(null)}
            onSaveDraft={!isEditing ? () => { saveDraftRef.current = true; } : undefined}
            onDirtyChange={isEditing ? setIsFormDirty : undefined}
          />
        </Card>

        {isEditing && (
          <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{language === 'el' ? 'Μη αποθηκευμένες αλλαγές' : 'Unsaved Changes'}</AlertDialogTitle>
                <AlertDialogDescription>
                  {language === 'el' ? 'Έχετε μη αποθηκευμένες αλλαγές. Θέλετε να τις αποθηκεύσετε πριν φύγετε;' : 'You have unsaved changes. Would you like to save them before leaving?'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={handleDiscardAndExit}>{language === 'el' ? 'Απόρριψη Αλλαγών' : 'Discard Changes'}</AlertDialogCancel>
                <AlertDialogAction onClick={() => setShowExitDialog(false)}>{language === 'el' ? 'Ακύρωση' : 'Cancel'}</AlertDialogAction>
                <AlertDialogAction onClick={handleSaveAndExit} className="bg-emerald-600 hover:bg-emerald-700">{language === 'el' ? 'Αποθήκευση & Έξοδος' : 'Save & Exit'}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}