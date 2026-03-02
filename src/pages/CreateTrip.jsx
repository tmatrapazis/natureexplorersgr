import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
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
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  useSEO({ title: t('create_trip.title'), description: 'Create hiking trip', noindex: true });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  // Support recreating a trip from navigation state
  const recreateData = location.state?.tripData
    ? { ...location.state.tripData, start_date: "", end_date: "", status: "draft" }
    : null;

  const createTripMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.HikingTrip.create({ ...data, organizer_code: user.organizer_code });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hiking-trips'] });
      navigate(createPageUrl("MyTrips"));
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.HikingTrip.create({ ...data, organizer_code: user.organizer_code, status: "draft" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hiking-trips'] });
      navigate(createPageUrl("MyTrips"));
    },
  });

  const hasOrganizerCode = user?.organizer_code;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 p-4 md:p-8 w-full overflow-x-hidden">
      <div className="max-w-3xl mx-auto w-full min-w-0">
        <Button variant="outline" className="mb-6" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('create_trip.back_to_trips')}
        </Button>

        <Card className="p-4 md:p-8 w-full overflow-x-hidden">
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 mb-6 break-words">{t('create_trip.title')}</h1>

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
            isSubmitting={createTripMutation.isPending || saveDraftMutation.isPending}
            onSubmit={(data) => createTripMutation.mutate(data)}
            onCancel={() => navigate(createPageUrl("MyTrips"))}
            extraActions={
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const form = document.querySelector('form');
                  if (form) {
                    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                    // We trigger save-as-draft by temporarily overriding — instead use a ref approach below
                  }
                }}
                disabled={saveDraftMutation.isPending || createTripMutation.isPending}
                className="w-full sm:w-auto whitespace-normal"
              >
                {saveDraftMutation.isPending ? t('create_trip.saving') : (language === 'el' ? 'Αποθήκευση Πρόχειρου' : 'Save as Draft')}
              </Button>
            }
          />
        </Card>
      </div>
    </div>
  );
}