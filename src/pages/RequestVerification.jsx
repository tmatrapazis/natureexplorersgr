import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';

import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, Shield, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import useSEO from '../components/seo/useSEO';
import { useLanguage } from '../components/contexts/LanguageContext';
import { useTranslation } from '../components/translations/useTranslations';
import { useBackNavigation } from '../lib/useBackNavigation';

export default function RequestVerificationPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const { goBack, backLabel } = useBackNavigation(createPageUrl('EditProfile'));

  // Prevent indexing - this is an authenticated page
  useSEO({
    title: t('profile.request_verification'),
    description: 'Request organizer verification',
    noindex: true
  });

  const { user, refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    years_of_experience: '',
    certifications: '',
    social_profiles: {
      facebook: '',
      instagram: '',
      twitter: ''
    }
  });

  const [submitSuccess, setSubmitSuccess] = useState(false);

  const requestVerificationMutation = useMutation({
    mutationFn: async (/** @type {any} */ data) => {
      const { error } = await supabase
        .from('profiles')
        .update({ ...data, verification_status: 'pending' })
        .eq('id', user.id);
      if (error) throw error;
      await refreshUser();
    },
    onSuccess: () => {
      setSubmitSuccess(true);
      setTimeout(() => navigate(createPageUrl("Calendar")), 3000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    requestVerificationMutation.mutate(formData);
  };

  // Check if user is an organizer (has organizer_code)
  const isOrganizer = user?.organizer_code && user.organizer_code.trim().length > 0;
  
  if (!user || !isOrganizer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">{t('request_verification.only_organizers')}</p>
          <Link to={createPageUrl("Calendar")} aria-label={t('request_verification.back_to_calendar')}>
            <Button className="min-h-[44px]" tabIndex={-1}>{t('request_verification.back_to_calendar')}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (user.verification_status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md p-8 text-center">
          <Shield className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('request_verification.pending_title')}</h2>
          <p className="text-muted-foreground mb-4">{t('request_verification.pending_message')}</p>
          <Link to={createPageUrl("Calendar")} aria-label={t('request_verification.back_to_calendar')}>
            <Button className="min-h-[44px]" tabIndex={-1}>{t('request_verification.back_to_calendar')}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (user.is_verified_organizer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-brand-dark/60 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('request_verification.verified_title')}</h2>
          <p className="text-muted-foreground mb-4">{t('request_verification.verified_message')}</p>
          <Link to={createPageUrl("Calendar")} aria-label={t('request_verification.back_to_calendar')}>
            <Button className="min-h-[44px]" tabIndex={-1}>{t('request_verification.back_to_calendar')}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-brand-gold/30 to-stone-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Button variant="outline" className="mb-6 min-h-[44px]" onClick={goBack} aria-label={`Go back to ${backLabel}`}>
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          {backLabel}
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-brand-dark" />
              <CardTitle className="text-2xl">{t('request_verification.card_title')}</CardTitle>
            </div>
            <CardDescription>
              {t('request_verification.card_description')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {submitSuccess ? (
              <Alert className="bg-brand-gold/40 border-brand-dark/20">
                <CheckCircle2 className="h-4 w-4 text-brand-dark" />
                <AlertDescription className="text-brand-dark">
                  {t('request_verification.success_message')}
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="experience">{t('request_verification.experience_label')}</Label>
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    value={formData.years_of_experience}
                    onChange={(e) => setFormData({...formData, years_of_experience: String(parseInt(e.target.value))})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="certifications">{t('request_verification.certifications_label')}</Label>
                  <Textarea
                    id="certifications"
                    placeholder={t('request_verification.certifications_placeholder')}
                    value={formData.certifications}
                    onChange={(e) => setFormData({...formData, certifications: e.target.value})}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t('request_verification.certifications_help')}</p>
                </div>

                <div className="space-y-3">
                  <Label>{t('request_verification.social_media_label')}</Label>
                  <div>
                    <Label htmlFor="facebook" className="text-sm text-muted-foreground">Facebook</Label>
                    <Input
                      id="facebook"
                      type="url"
                      placeholder="https://facebook.com/yourprofile"
                      value={formData.social_profiles.facebook}
                      onChange={(e) => setFormData({
                        ...formData,
                        social_profiles: {...formData.social_profiles, facebook: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram" className="text-sm text-muted-foreground">Instagram</Label>
                    <Input
                      id="instagram"
                      type="url"
                      placeholder="https://instagram.com/yourprofile"
                      value={formData.social_profiles.instagram}
                      onChange={(e) => setFormData({
                        ...formData,
                        social_profiles: {...formData.social_profiles, instagram: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="twitter" className="text-sm text-muted-foreground">Twitter/X</Label>
                    <Input
                      id="twitter"
                      type="url"
                      placeholder="https://twitter.com/yourprofile"
                      value={formData.social_profiles.twitter}
                      onChange={(e) => setFormData({
                        ...formData,
                        social_profiles: {...formData.social_profiles, twitter: e.target.value}
                      })}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">{t('request_verification.what_happens_title')}</h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    {[1, 2, 3, 4].map((n) => (
                      <li key={n}>{t(`request_verification.what_happens_${n}`)}</li>
                    ))}
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-brand-dark hover:bg-brand-dark/90 min-h-[44px]"
                  disabled={requestVerificationMutation.isPending}
                  aria-label={requestVerificationMutation.isPending ? t('request_verification.submitting') : t('request_verification.submit')}
                >
                  {requestVerificationMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('request_verification.submitting')}</>
                  ) : (
                    t('request_verification.submit')
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}