import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Mail, Phone, HeartPulse, ShieldAlert, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import useSEO from '../components/seo/useSEO';
import { useLanguage } from '../components/contexts/LanguageContext';
import { useTranslation } from '../components/translations/useTranslations';

const InfoField = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-8 text-center">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-stone-600">{label}</p>
        <p className="text-stone-800 whitespace-pre-wrap">{value}</p>
      </div>
    </div>
  );
};

export default function HikerProfilePage() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  // Prevent indexing - this is an authenticated page
  useSEO({
    title: 'Hiker Profile',
    description: 'View hiker profile and details',
    noindex: true
  });

  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("id");
  const tripId = urlParams.get("tripId");

  const { data: hiker, isLoading } = useQuery({
    queryKey: ['hiker-profile', userId],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ id: userId });
      return users[0];
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!hiker) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">{t('hikerNotFound')}</h2>
          <Link to={tripId ? `${createPageUrl("ManageBookings")}?tripId=${tripId}` : createPageUrl("MyTrips")}>
            <Button>{t('backToBookings')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        <Button variant="outline" className="mb-6" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('backToBookings')}
        </Button>
        <div className="space-y-6">
          <Card>
            <CardHeader className="items-center text-center p-8 bg-stone-50">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg mb-4">
                  {hiker.profile_picture_url ? (
                    <img src={hiker.profile_picture_url} alt={hiker.username || hiker.full_name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
              </div>
              <h1 className="text-2xl font-bold text-stone-900">{hiker.username || hiker.full_name}</h1>
              {hiker.training_status && <Badge variant="secondary" className="mt-2">{hiker.training_status} {t('hiker')}</Badge>}
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <InfoField icon={<Mail className="w-5 h-5 text-stone-500" />} label={t('email')} value={<a href={`mailto:${hiker.email}`} className="text-emerald-600 hover:underline">{hiker.email}</a>} />
              <InfoField icon={<Phone className="w-5 h-5 text-stone-500" />} label={t('mobileNumber')} value={hiker.phone_number} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-red-600"/> {t('healthAndEmergency')}</CardTitle>
              <CardDescription>{t('confidentialInfo')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <InfoField icon={<HeartPulse className="w-5 h-5 text-stone-500" />} label={t('generalHealth')} value={hiker.health_status || t('notProvided')} />
              <InfoField icon={<AlertTriangle className="w-5 h-5 text-stone-500" />} label={t('allergiesAndMedicalNeeds')} value={hiker.medical_needs || t('noneSpecified')} />
              <InfoField icon={<Phone className="w-5 h-5 text-stone-500" />} label={t('emergencyContact')} value={hiker.emergency_contact_number || t('notProvided')} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}