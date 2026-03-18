import React, { useRef } from "react";
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
  const saveDraftRef = useRef(false);

  useSEO({ title: t('create_trip.title'), description: 'Create hiking trip', noindex: true });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const recreateData = location.state?.tripData
    ? { ...location.state.tripData, start_date: "", end_date: "", status: "draft" }
    : null;

  const handleSubmit = async (data) => {
    const dataToSave = saveDraftRef.current ? { ...data, status: "draft" } : data;
    saveDraftRef.current = false;
    await base44.entities.HikingTrip.create({ ...dataToSave, organizer_code: user.organizer_code });
    queryClient.invalidateQueries({ queryKey: ['hiking-trips'] });
    navigate(createPageUrl("MyTrips"));
  };

  const createMutation = useMutation({ mutationFn: handleSubmit });
  const hasOrganizerCode = user?.organizer_code;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 p-4 md:p-8 w-full overflow-x-hidden">
      <div className="max-w-3xl mx-auto w-full min-w-0">
        <Button variant="outline" className="mb-6" onClick={() => window.history.length > 2 ? navigate(-1) : navigate(createPageUrl("MyTrips"))}>
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