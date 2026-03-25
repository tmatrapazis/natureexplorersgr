import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { createOptimisticTripUpdate } from '../lib/optimistic-mutations';
import { useBackNavigation } from '../lib/useBackNavigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import useSEO from '../components/seo/useSEO';
import { useLanguage } from '../components/contexts/LanguageContext';
import { useTranslation } from '../components/translations/useTranslations';
import TripForm from '../components/trips/TripForm';

export default function EditTripPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { goBack } = useBackNavigation(createPageUrl("MyTrips"));
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get("id");

  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [pendingData, setPendingData] = useState(null);

  useSEO({ title: t('create_trip.edit_title'), description: 'Edit hiking trip', noindex: true });

  const { data: trip, isLoading } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const results = await base44.entities.HikingTrip.filter({ id: tripId });
      return results[0];
    },
    enabled: !!tripId,
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const updateTripMutation = useMutation({
    mutationFn: async (/** @type {any} */ data) => {
      const { created_date, updated_date, id, created_by, view_count, organizer_name, organizer_is_verified, organizer_email, computedStatus, ...clean } = data;
      if (!clean.end_date) clean.end_date = clean.start_date;
      return await base44.entities.HikingTrip.update(tripId, clean);
    },
    ...createOptimisticTripUpdate(queryClient, tripId, user?.organizer_code),
    onSuccess: () => {
      setIsFormDirty(false);
      navigate(createPageUrl("MyTrips"));
    },
  });

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isFormDirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormDirty]);

  const handleNavigateAway = (destination) => {
    if (isFormDirty) {
      setPendingNavigation(destination);
      setShowExitDialog(true);
    } else {
      if (destination) navigate(destination);
      else goBack();
    }
  };

  const handleDiscardAndExit = () => {
    setIsFormDirty(false);
    setShowExitDialog(false);
    if (pendingNavigation) navigate(pendingNavigation);
    else goBack();
  };

  const handleSaveAndExit = async () => {
    setShowExitDialog(false);
    if (pendingData) await updateTripMutation.mutateAsync(pendingData);
  };

  const handleSubmit = (data) => {
    setPendingData(data);
    setIsFormDirty(false);
    updateTripMutation.mutate(data);
  };

  if (isLoading || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

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
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 mb-6 break-words">{t('create_trip.edit_title')}</h1>

          <TripForm
            key={trip.id}
            initialData={trip}
            isEditing={true}
            isSubmitting={updateTripMutation.isPending}
            onSubmit={handleSubmit}
            onCancel={() => handleNavigateAway(null)}
          />
        </Card>

        <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{language === 'el' ? 'Μη αποθηκευμένες αλλαγές' : 'Unsaved Changes'}</AlertDialogTitle>
              <AlertDialogDescription>
                {language === 'el' ? 'Έχετε μη αποθηκευμένες αλλαγές. Θέλετε να τις αποθηκεύσετε πριν φύγετε;' : 'You have unsaved changes. Would you like to save them before leaving?'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={handleDiscardAndExit}
                className="min-h-[44px]"
              >
                {language === 'el' ? 'Απόρριψη Αλλαγών' : 'Discard Changes'}
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => setShowExitDialog(false)}
                className="min-h-[44px]"
              >
                {language === 'el' ? 'Ακύρωση' : 'Cancel'}
              </AlertDialogAction>
              <AlertDialogAction 
                onClick={handleSaveAndExit} 
                className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
              >
                {language === 'el' ? 'Αποθήκευση & Έξοδος' : 'Save & Exit'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}