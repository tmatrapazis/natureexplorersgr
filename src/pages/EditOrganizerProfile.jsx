import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useTabNavigation } from '../components/contexts/TabNavigationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, CheckCircle, Upload, Link as LinkIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '../components/contexts/LanguageContext';
import { useTranslation } from '../components/translations/useTranslations';

export default function EditOrganizerProfilePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { goBackInTab, canGoBack } = useTabNavigation();
  const goBack = () => canGoBack() ? goBackInTab() : navigate(createPageUrl("OrganizersList"));
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: organizer, isLoading } = useQuery({
    queryKey: ['organizer', user?.organizer_code],
    queryFn: async () => {
      const organizers = await base44.entities.Organizer.filter({ organizer_code: user.organizer_code });
      return organizers[0];
    },
    enabled: !!user?.organizer_code,
  });

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    bio: '',
    website: '',
    phone: '',
    years_of_experience: '',
    certifications: '',
    profile_picture_url: '',
    social_profiles: {
      facebook: '',
      instagram: '',
      twitter: ''
    }
  });

  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [photoInputMode, setPhotoInputMode] = useState('url'); // 'url' or 'upload'
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  useEffect(() => {
    if (organizer) {
      setFormData({
        full_name: organizer.full_name || '',
        username: organizer.username || '',
        email: organizer.email || '',
        bio: organizer.bio || '',
        website: organizer.website || '',
        phone: organizer.phone || '',
        years_of_experience: organizer.years_of_experience || '',
        certifications: organizer.certifications || '',
        profile_picture_url: organizer.profile_picture_url || '',
        social_profiles: organizer.social_profiles || {
          facebook: '',
          instagram: '',
          twitter: ''
        }
      });
    }
  }, [organizer]);

  const updateOrganizerMutation = useMutation({
    mutationFn: async (/** @type {any} */ updatedData) => {
      // Remove is_verified and organizer_code - only admins can modify these
      const { is_verified, organizer_code, ...dataToUpdate } = updatedData;
      console.log('Updating organizer with data:', dataToUpdate);
      const result = await base44.entities.Organizer.update(organizer.id, dataToUpdate);
      console.log('Update successful:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer'] });
      setShowSuccessDialog(true);
      setTimeout(() => {
        navigate(`${createPageUrl("OrganizerProfile")}?code=${user.organizer_code}`);
      }, 2000);
    },
    onError: (error) => {
      console.error('Failed to update organizer profile:', error);
      alert(`Failed to update profile: ${error.message || 'Unknown error'}`);
    },
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSocialProfileChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      social_profiles: {
        ...prev.social_profiles,
        [platform]: value
      }
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, profile_picture_url: file_url }));
    setUploadingImage(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert years_of_experience to number or null
    const dataToSubmit = {
      ...formData,
      years_of_experience: formData.years_of_experience ? parseFloat(formData.years_of_experience) : null
    };
    updateOrganizerMutation.mutate(dataToSubmit);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4">
            {language === 'el' ? 'Δεν βρέθηκε προφίλ διοργανωτή' : 'Organizer Profile Not Found'}
          </h2>
          <Link to={createPageUrl("MyTrips")}>
            <Button>{t('common.back')}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="outline" 
          className="mb-6 min-h-[44px]" 
          onClick={goBack}
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          {t('common.back')}
        </Button>

        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.public_organizer_profile')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>{language === 'el' ? 'Φωτογραφία Προφίλ' : 'Profile Picture'}</Label>
                  
                  {formData.profile_picture_url && (
                    <div className="mt-2 mb-4">
                      <img 
                        src={formData.profile_picture_url} 
                        alt="Profile" 
                        className="w-32 h-32 rounded-full object-cover border-4 border-emerald-100"
                      />
                    </div>
                  )}

                  <div className="flex gap-2 mb-3">
                    <Button
                      type="button"
                      variant={photoInputMode === 'url' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPhotoInputMode('url')}
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      {language === 'el' ? 'Σύνδεσμος' : 'URL'}
                    </Button>
                    <Button
                      type="button"
                      variant={photoInputMode === 'upload' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPhotoInputMode('upload')}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {language === 'el' ? 'Μεταφόρτωση' : 'Upload'}
                    </Button>
                  </div>

                  {photoInputMode === 'url' ? (
                    <Input
                      type="url"
                      placeholder={language === 'el' ? 'https://example.com/photo.jpg' : 'https://example.com/photo.jpg'}
                      value={formData.profile_picture_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, profile_picture_url: e.target.value }))}
                    />
                  ) : (
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        disabled={uploadingImage}
                      />
                      {uploadingImage && (
                        <p className="text-sm text-stone-500 mt-2 flex items-center">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {language === 'el' ? 'Μεταφόρτωση...' : 'Uploading...'}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="full_name">{t('profile.full_name')} *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="username">{t('profile.username')}</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t('profile.email')} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bio">{t('profile.bio')}</Label>
                  <Textarea
                    id="bio"
                    placeholder={t('profile.bio_placeholder')}
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="website">{t('profile.website')}</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder={t('profile.website_placeholder')}
                    value={formData.website}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">{t('profile.public_phone')} *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t('profile.public_phone_placeholder')}
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label>{t('profile.social_media')}</Label>
                  <div className="space-y-3 mt-2">
                    <div>
                      <Label htmlFor="facebook" className="text-sm text-stone-600">{t('profile.facebook')}</Label>
                      <Input
                        id="facebook"
                        type="url"
                        placeholder={t('profile.facebook_placeholder')}
                        value={formData.social_profiles.facebook}
                        onChange={(e) => handleSocialProfileChange('facebook', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="instagram" className="text-sm text-stone-600">{t('profile.instagram')}</Label>
                      <Input
                        id="instagram"
                        type="url"
                        placeholder={t('profile.instagram_placeholder')}
                        value={formData.social_profiles.instagram}
                        onChange={(e) => handleSocialProfileChange('instagram', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="twitter" className="text-sm text-stone-600">{t('profile.twitter')}</Label>
                      <Input
                        id="twitter"
                        type="url"
                        placeholder={t('profile.twitter_placeholder')}
                        value={formData.social_profiles.twitter}
                        onChange={(e) => handleSocialProfileChange('twitter', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="years_of_experience">{t('profile.years_experience')}</Label>
                  <Input
                    id="years_of_experience"
                    type="number"
                    min="0"
                    placeholder={t('profile.years_experience_placeholder')}
                    value={formData.years_of_experience}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="certifications">{t('profile.certifications')}</Label>
                  <Textarea
                    id="certifications"
                    placeholder={t('profile.certifications_placeholder')}
                    value={formData.certifications}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Button type="submit" disabled={updateOrganizerMutation.isPending} className="w-full">
                  {updateOrganizerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('profile.save_changes')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>

        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="bg-emerald-100 rounded-full p-3">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
              <DialogTitle className="text-center">
                {language === 'el' ? 'Επιτυχής Ενημέρωση!' : 'Successfully Updated!'}
              </DialogTitle>
              <DialogDescription className="text-center">
                {language === 'el' 
                  ? 'Το προφίλ σας ενημερώθηκε με επιτυχία. Θα ανακατευθυνθείτε στη σελίδα του προφίλ σας.'
                  : 'Your profile has been updated successfully. You will be redirected to your profile page.'}
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}