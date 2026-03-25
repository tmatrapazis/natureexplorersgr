import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useBackNavigation } from '../lib/useBackNavigation';
import { createOptimisticCreate } from '../lib/optimistic-mutations';
import { useLanguage } from "../components/contexts/LanguageContext";
import { useTranslation } from "../components/translations/useTranslations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
const ReactQuill = React.lazy(() => import('react-quill'));
import 'react-quill/dist/quill.snow.css';

export default function CreateGuideProfilePage() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { goBack } = useBackNavigation(createPageUrl('Guides'));

  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    years_of_experience: "",
    certifications: [],
    profile_photo_url: "",
    cover_photo_url: "",
    social_media: {
      instagram: "",
      facebook: ""
    },
    organizer_codes: [],
  });

  const [currentCertification, setCurrentCertification] = useState("");
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: organizers = [] } = useQuery({
    queryKey: ['all-organizers'],
    queryFn: () => base44.entities.Organizer.list(),
  });

  const { data: existingGuide } = useQuery({
    queryKey: ['existing-guide', user?.id],
    queryFn: () => base44.entities.MountainGuide.filter({ user_id: user.id }),
    enabled: !!user,
  });

  React.useEffect(() => {
    if (existingGuide && existingGuide.length > 0) {
      navigate(createPageUrl('GuideProfile') + `?id=${existingGuide[0].id}`);
    }
  }, [existingGuide, navigate]);

  const createGuideMutation = useMutation({
    mutationFn: (/** @type {any} */ data) => base44.entities.MountainGuide.create(data),
    ...createOptimisticCreate(queryClient, ['mountain-guides'], (data) => ({ ...data, id: 'temp-' + Date.now(), created_date: new Date().toISOString() })),
    onSuccess: async (newGuide) => {
      // Update user's mountain_guide_id
      await base44.auth.updateMe({ mountain_guide_id: newGuide.id });

      queryClient.invalidateQueries({ queryKey: ['mountain-guides'] });
      queryClient.invalidateQueries({ queryKey: ['user-guide-profile'] });
      toast.success(language === 'el' ? 'Το προφίλ δημιουργήθηκε με επιτυχία!' : 'Profile created successfully!');
      navigate(createPageUrl('GuideProfile') + `?id=${newGuide.id}`);
    },
    onError: () => {
      toast.error(language === 'el' ? 'Σφάλμα κατά τη δημιουργία του προφίλ' : 'Error creating profile');
    }
  });

  const handleImageUpload = async (file, type) => {
    const uploader = type === 'profile' ? setUploadingProfile : setUploadingCover;
    uploader(true);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({
        ...prev,
        [type === 'profile' ? 'profile_photo_url' : 'cover_photo_url']: file_url
      }));
    } catch (error) {
      toast.error(language === 'el' ? 'Σφάλμα μεταφόρτωσης εικόνας' : 'Error uploading image');
    } finally {
      uploader(false);
    }
  };

  const handleAddCertification = () => {
    if (currentCertification.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, currentCertification.trim()]
      }));
      setCurrentCertification("");
    }
  };

  const handleRemoveCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const handleOrganizerToggle = (organizerCode) => {
    setFormData(prev => ({
      ...prev,
      organizer_codes: prev.organizer_codes.includes(organizerCode)
        ? prev.organizer_codes.filter(code => code !== organizerCode)
        : [...prev.organizer_codes, organizerCode]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.full_name.trim()) {
      toast.error(language === 'el' ? 'Το όνομα είναι υποχρεωτικό' : 'Full name is required');
      return;
    }

    createGuideMutation.mutate({
      ...formData,
      user_id: user.id,
      years_of_experience: formData.years_of_experience ? Number(formData.years_of_experience) : 0,
      status: 'active',
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <Button
          variant="ghost"
          onClick={goBack}
          className="mb-6 min-h-[44px]"
          aria-label={language === 'el' ? 'Πίσω στους Οδηγούς' : 'Back to Guides'}
        >
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          {language === 'el' ? 'Πίσω στους Οδηγούς' : 'Back to Guides'}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {language === 'el' ? 'Δημιουργία Προφίλ Οδηγού Βουνού' : 'Create Mountain Guide Profile'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Profile Photo */}
              <div>
                <Label>{language === 'el' ? 'Φωτογραφία Προφίλ' : 'Profile Photo'}</Label>
                {formData.profile_photo_url ? (
                  <div className="mt-2 relative w-32 h-32">
                    <img 
                      src={formData.profile_photo_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover rounded-full"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, profile_photo_url: "" }))}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 min-h-[32px] min-w-[32px]"
                      aria-label={language === 'el' ? 'Αφαίρεση φωτογραφίας προφίλ' : 'Remove profile photo'}
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], 'profile')}
                      disabled={uploadingProfile}
                    />
                    {uploadingProfile && <p className="text-sm text-muted-foreground mt-1">{t('common.loading')}</p>}
                  </div>
                )}
              </div>

              {/* Cover Photo */}
              <div>
                <Label>{language === 'el' ? 'Εικόνα Εξωφύλλου' : 'Cover Photo'}</Label>
                {formData.cover_photo_url ? (
                  <div className="mt-2 relative w-full h-48">
                    <img 
                      src={formData.cover_photo_url} 
                      alt="Cover" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, cover_photo_url: "" }))}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 min-h-[32px] min-w-[32px]"
                      aria-label={language === 'el' ? 'Αφαίρεση εικόνας εξωφύλλου' : 'Remove cover photo'}
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], 'cover')}
                      disabled={uploadingCover}
                    />
                    {uploadingCover && <p className="text-sm text-muted-foreground mt-1">{t('common.loading')}</p>}
                  </div>
                )}
              </div>

              {/* Full Name */}
              <div>
                <Label htmlFor="full_name">
                  {language === 'el' ? 'Ονοματεπώνυμο' : 'Full Name'} *
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder={language === 'el' ? 'π.χ. Γιάννης Παπαδόπουλος' : 'e.g. John Smith'}
                  required
                />
              </div>

              {/* Bio */}
              <div>
                <Label>{language === 'el' ? 'Βιογραφικό' : 'Bio'}</Label>
                <div className="mt-2" style={{ minHeight: '200px' }}>
                  <React.Suspense fallback={
                    <div className="flex items-center justify-center h-[150px] bg-muted/30 rounded-md border border-border">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  }>
                    <ReactQuill
                      value={formData.bio}
                      onChange={(value) => setFormData(prev => ({ ...prev, bio: value }))}
                      theme="snow"
                      style={{ height: '150px', marginBottom: '42px' }}
                    />
                  </React.Suspense>
                </div>
              </div>

              {/* Years of Experience */}
              <div>
                <Label htmlFor="years">
                  {language === 'el' ? 'Χρόνια Εμπειρίας' : 'Years of Experience'}
                </Label>
                <Input
                  id="years"
                  type="number"
                  min="0"
                  value={formData.years_of_experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, years_of_experience: e.target.value }))}
                  placeholder="5"
                />
              </div>

              {/* Certifications */}
              <div>
                <Label>{language === 'el' ? 'Πιστοποιήσεις' : 'Certifications'}</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={currentCertification}
                    onChange={(e) => setCurrentCertification(e.target.value)}
                    placeholder={language === 'el' ? 'π.χ. Πρώτες Βοήθειες' : 'e.g. First Aid'}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCertification())}
                  />
                  <Button type="button" onClick={handleAddCertification} className="min-h-[44px]" aria-label={language === 'el' ? 'Προσθήκη πιστοποίησης' : 'Add certification'}>
                    {t('common.add')}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.certifications.map((cert, index) => (
                    <div key={index} className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full flex items-center gap-2">
                      <span>{cert}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCertification(index)}
                        className="hover:text-red-600 min-h-[24px] min-w-[24px] flex items-center justify-center"
                        aria-label={`${language === 'el' ? 'Αφαίρεση πιστοποίησης' : 'Remove certification'}: ${cert}`}
                      >
                        <X className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Media */}
              <div className="space-y-3">
                <Label>{language === 'el' ? 'Κοινωνικά Δίκτυα' : 'Social Media'}</Label>
                <div>
                  <Label htmlFor="instagram" className="text-sm">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.social_media.instagram}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      social_media: { ...prev.social_media, instagram: e.target.value }
                    }))}
                    placeholder="https://instagram.com/yourprofile"
                  />
                </div>
                <div>
                  <Label htmlFor="facebook" className="text-sm">Facebook</Label>
                  <Input
                    id="facebook"
                    value={formData.social_media.facebook}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      social_media: { ...prev.social_media, facebook: e.target.value }
                    }))}
                    placeholder="https://facebook.com/yourprofile"
                  />
                </div>
              </div>

              {/* Associated Organizers */}
              <div>
                <Label>
                  {language === 'el' ? 'Συνεργασίες με Διοργανωτές' : 'Collaborates With Organizers'}
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  {language === 'el'
                    ? 'Επιλέξτε τους διοργανωτές με τους οποίους συνεργάζεστε'
                    : 'Select the organizers you work with'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border rounded-lg p-3">
                  {organizers.map(org => (
                    <label
                      key={org.organizer_code}
                      className="flex items-center gap-3 px-2 min-h-[44px] hover:bg-accent rounded cursor-pointer"
                    >
                      <Checkbox
                        checked={formData.organizer_codes.includes(org.organizer_code)}
                        onCheckedChange={() => handleOrganizerToggle(org.organizer_code)}
                      />
                      <span className="text-sm">{org.full_name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl('Guides'))}
                  className="min-h-[44px]"
                  aria-label={t('common.cancel')}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={createGuideMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
                  aria-label={createGuideMutation.isPending ? (language === 'el' ? 'Αποθήκευση…' : 'Saving…') : (language === 'el' ? 'Δημιουργία προφίλ οδηγού' : 'Create guide profile')}
                >
                  {createGuideMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    language === 'el' ? 'Δημιουργία Προφίλ' : 'Create Profile'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}