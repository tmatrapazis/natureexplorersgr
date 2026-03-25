import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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

export default function RequestVerificationPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { language } = useLanguage();
  const { t } = useTranslation(language);

  // Prevent indexing - this is an authenticated page
  useSEO({
    title: t('profile.request_verification'),
    description: 'Request organizer verification',
    noindex: true
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

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
      return await base44.auth.updateMe({
        ...data,
        verification_status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
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
          <p className="text-muted-foreground mb-4">Only organizers can request verification.</p>
          <Link to={createPageUrl("Calendar")} aria-label="Back to Calendar">
            <Button className="min-h-[44px]" tabIndex={-1}>Back to Calendar</Button>
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
          <h2 className="text-2xl font-bold mb-2">Verification Pending</h2>
          <p className="text-muted-foreground mb-4">Your verification request is under review. We'll notify you once it's processed.</p>
          <Link to={createPageUrl("Calendar")} aria-label="Back to Calendar">
            <Button className="min-h-[44px]" tabIndex={-1}>Back to Calendar</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (user.is_verified_organizer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">You're Verified!</h2>
          <p className="text-muted-foreground mb-4">Your organizer profile is verified and trusted by our community.</p>
          <Link to={createPageUrl("Calendar")} aria-label="Back to Calendar">
            <Button className="min-h-[44px]" tabIndex={-1}>Back to Calendar</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link to={createPageUrl("EditProfile")} aria-label="Back to profile">
          <Button variant="outline" className="mb-6 min-h-[44px]" tabIndex={-1}>
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Back to Profile
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-emerald-600" />
              <CardTitle className="text-2xl">Request Organizer Verification</CardTitle>
            </div>
            <CardDescription>
              Become a verified organizer to build trust with hikers and gain more visibility on the platform.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {submitSuccess ? (
              <Alert className="bg-emerald-50 border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-800">
                  Your verification request has been submitted successfully! We'll review it and notify you soon.
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="experience">Years of Hiking/Guiding Experience *</Label>
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
                  <Label htmlFor="certifications">Certifications & Qualifications</Label>
                  <Textarea
                    id="certifications"
                    placeholder="e.g., Wilderness First Aid, Mountain Guide License, First Responder..."
                    value={formData.certifications}
                    onChange={(e) => setFormData({...formData, certifications: e.target.value})}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">List any relevant certifications or training</p>
                </div>

                <div className="space-y-3">
                  <Label>Social Media Profiles (Optional)</Label>
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
                  <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Our team will review your application within 2-3 business days</li>
                    <li>We may contact you for additional information</li>
                    <li>Once approved, you'll receive a verified badge on your profile</li>
                    <li>Verified organizers get priority visibility in search results</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
                  disabled={requestVerificationMutation.isPending}
                  aria-label={requestVerificationMutation.isPending ? 'Submitting verification request…' : 'Submit verification request'}
                >
                  {requestVerificationMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    'Submit Verification Request'
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