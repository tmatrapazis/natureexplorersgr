import React, { useState } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MountainGuide, Organizer } from "@/api/db";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/api/supabaseClient";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useBackNavigation } from '../lib/useBackNavigation';
import { createOptimisticUpdate } from '../lib/optimistic-mutations';
import { useLanguage } from "../components/contexts/LanguageContext";
import { useTranslation } from "../components/translations/useTranslations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, X, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import LazyQuillEditor from '../components/lazy/LazyQuillEditor';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function EditGuideProfilePage() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { goBack } = useBackNavigation(createPageUrl("Guides"));

  const [searchParams] = useSearchParams();
  // Freeze at mount time — prevents stale reads during AnimatePresence exit animation
  const guideId = React.useRef(searchParams.get("id")).current;

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
    status: "active",
  });

  const [currentCertification, setCurrentCertification] = useState("");
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const { user: currentUser } = useAuth();

  const { data: guide, isLoading: guideLoading } = useQuery({
    queryKey: ['guide', guideId],
    queryFn: async () => {
      const guides = await MountainGuide.filter({ id: guideId });
      return guides[0];
    },
    enabled: !!guideId,
  });

  const { data: organizers = [] } = useQuery({
    queryKey: ['all-organizers'],
    queryFn: () => Organizer.list(),
  });

  React.useEffect(() => {
    if (guide) {
      // Check if user is the owner
      if (currentUser && guide.user_id !== currentUser.id) {
        toast.error(language === 'el' ? 'Δεν έχετε δικαίωμα επεξεργασίας' : 'You do not have permission to edit');
        navigate(createPageUrl('GuideProfile') + `?id=${guideId}`);
        return;
      }

      setFormData({
        full_name: guide.full_name || "",
        bio: guide.bio || "",
        years_of_experience: guide.years_of_experience || "",
        certifications: guide.certifications || [],
        profile_photo_url: guide.profile_photo_url || "",
        cover_photo_url: guide.cover_photo_url || "",
        social_media: guide.social_media || { instagram: "", facebook: "" },
        organizer_codes: guide.organizer_codes || [],
        status: guide.status || "active",
      });
    }
  }, [guide, currentUser, navigate, guideId, language]);

  const updateGuideMutation = useMutation({
    mutationFn: (/** @type {any} */ data) => MountainGuide.update(guideId, data),
    ...createOptimisticUpdate(queryClient, ['guide', guideId], (old, updated) =>
      old ? { ...old, ...updated } : old
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guide', guideId] });
      queryClient.invalidateQueries({ queryKey: ['mountain-guides'] });
      setShowSuccessDialog(true);
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error(language === 'el' ? 'Σφάλμα ενημέρωσης' : 'Error updating profile');
    }
  });

  const deleteGuideMutation = useMutation({
    mutationFn: async () => {
      if (!guide || guide.user_id !== currentUser?.id) {
        throw new Error('Permission denied');
      }
      return await MountainGuide.delete(guideId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mountain-guides'] });
      queryClient.invalidateQueries({ queryKey: ['user-guide-profile'] });
      queryClient.invalidateQueries({ queryKey: ['guide', guideId] });
      toast.success(language === 'el' ? 'Το προφίλ διαγράφηκε' : 'Profile deleted successfully');
      navigate(createPageUrl('Guides'));
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error(language === 'el' ? 'Σφάλμα διαγραφής' : 'Error deleting profile');
    }
  });

  const handleImageUpload = async (file, type) => {
    const uploader = type === 'profile' ? setUploadingProfile : setUploadingCover;
    uploader(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `guide-${type}-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('profile-images').getPublicUrl(data.path);
      setFormData(prev => ({
        ...prev,
        [type === 'profile' ? 'profile_photo_url' : 'cover_photo_url']: publicUrl
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

    updateGuideMutation.mutate({
      full_name: formData.full_name,
      bio: formData.bio,
      years_of_experience: formData.years_of_experience ? Number(formData.years_of_experience) : 0,
      certifications: formData.certifications,
      profile_photo_url: formData.profile_photo_url,
      cover_photo_url: formData.cover_photo_url,
      social_media: formData.social_media,
      organizer_codes: formData.organizer_codes,
      status: formData.status,
    });
  };

  if (guideLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            {language === 'el' ? 'Το προφίλ δεν βρέθηκε' : 'Profile not found'}
          </h2>
          <Button onClick={() => navigate(createPageUrl('Guides'))} className="min-h-[44px]" aria-label={language === 'el' ? 'Επιστροφή στους Οδηγούς' : 'Back to Guides'}>
            {language === 'el' ? 'Επιστροφή στους Οδηγούς' : 'Back to Guides'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={goBack}
            className="hidden md:inline-flex min-h-[44px]"
            aria-label={language === 'el' ? 'Πίσω στο Προφίλ' : 'Back to Profile'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            {language === 'el' ? 'Πίσω στο Προφίλ' : 'Back to Profile'}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="min-h-[44px]" aria-label={language === 'el' ? 'Διαγραφή προφίλ οδηγού' : 'Delete guide profile'}>
                <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                {language === 'el' ? 'Διαγραφή Προφίλ' : 'Delete Profile'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {language === 'el' ? 'Διαγραφή Προφίλ Οδηγού;' : 'Delete Guide Profile?'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {language === 'el'
                    ? 'Αυτή η ενέργεια δεν μπορεί να αναιρεθεί. Το προφίλ σας ως οδηγός θα διαγραφεί οριστικά.'
                    : 'This action cannot be undone. Your guide profile will be permanently deleted.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteGuideMutation.mutate()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleteGuideMutation.isPending ? t('common.loading') : t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {language === 'el' ? 'Επεξεργασία Προφίλ Οδηγού' : 'Edit Guide Profile'}
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
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                <div className="mt-2">
                  <LazyQuillEditor
                    value={formData.bio}
                    onChange={(value) => setFormData(prev => ({ ...prev, bio: value }))}
                    placeholder={language === 'el'
                      ? 'Πείτε μας για την εμπειρία σας, τις ειδικότητές σας...'
                      : 'Tell us about your experience, specializations...'}
                  />
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
                        className="hover:text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
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
                  onClick={goBack}
                  className="min-h-[44px]"
                  aria-label={t('common.cancel')}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={updateGuideMutation.isPending}
                  className="bg-[#0c281c] hover:bg-[#0c281c]/90 min-h-[44px]"
                  aria-label={updateGuideMutation.isPending ? (language === 'el' ? 'Αποθήκευση…' : 'Saving…') : (language === 'el' ? 'Αποθήκευση αλλαγών' : 'Save changes')}
                >
                  {updateGuideMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    t('common.save')
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Success Dialog */}
        <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {language === 'el' ? '✓ Επιτυχής Ενημέρωση' : '✓ Successfully Updated'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {language === 'el'
                  ? 'Το προφίλ σας ως οδηγός βουνού ενημερώθηκε με επιτυχία!'
                  : 'Your mountain guide profile has been updated successfully!'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => navigate(createPageUrl('GuideProfile') + `?id=${guideId}`)}
                className="bg-[#0c281c] hover:bg-[#0c281c]/90"
              >
                {language === 'el' ? 'Προβολή Προφίλ' : 'View Profile'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}