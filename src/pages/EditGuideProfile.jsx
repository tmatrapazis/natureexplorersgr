import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "../components/contexts/LanguageContext";
import { useTranslation } from "../components/translations/useTranslations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, X, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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

  const urlParams = new URLSearchParams(window.location.search);
  const guideId = urlParams.get("id");

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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: guide, isLoading: guideLoading } = useQuery({
    queryKey: ['guide', guideId],
    queryFn: async () => {
      const guides = await base44.entities.MountainGuide.filter({ id: guideId });
      return guides[0];
    },
    enabled: !!guideId,
  });

  const { data: organizers = [] } = useQuery({
    queryKey: ['all-organizers'],
    queryFn: () => base44.entities.Organizer.list(),
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
      });
    }
  }, [guide, currentUser, navigate, guideId, language]);

  const updateGuideMutation = useMutation({
    mutationFn: (data) => base44.entities.MountainGuide.update(guideId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['guide', guideId]);
      queryClient.invalidateQueries(['mountain-guides']);
      setShowSuccessDialog(true);
    },
    onError: () => {
      toast.error(language === 'el' ? 'Σφάλμα ενημέρωσης' : 'Error updating profile');
    }
  });

  const deleteGuideMutation = useMutation({
    mutationFn: () => base44.entities.MountainGuide.delete(guideId),
    onSuccess: async () => {
      // Update user's mountain_guide_id to null
      if (currentUser) {
        await base44.auth.updateMe({ mountain_guide_id: null });
      }
      queryClient.invalidateQueries(['mountain-guides']);
      queryClient.invalidateQueries(['user-guide-profile']);
      toast.success(language === 'el' ? 'Το προφίλ διαγράφηκε' : 'Profile deleted successfully');
      navigate(createPageUrl('Guides'));
    },
    onError: () => {
      toast.error(language === 'el' ? 'Σφάλμα διαγραφής' : 'Error deleting profile');
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

    updateGuideMutation.mutate({
      ...formData,
      years_of_experience: formData.years_of_experience ? Number(formData.years_of_experience) : 0,
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
          <Button onClick={() => navigate(createPageUrl('Guides'))}>
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
            onClick={() => navigate(createPageUrl('GuideProfile') + `?id=${guideId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'el' ? 'Πίσω στο Προφίλ' : 'Back to Profile'}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
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
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
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
                    {uploadingProfile && <p className="text-sm text-stone-500 mt-1">{t('common.loading')}</p>}
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
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
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
                    {uploadingCover && <p className="text-sm text-stone-500 mt-1">{t('common.loading')}</p>}
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
                <ReactQuill
                  value={formData.bio}
                  onChange={(value) => setFormData(prev => ({ ...prev, bio: value }))}
                  className="mt-2 bg-white"
                  placeholder={language === 'el' 
                    ? 'Πείτε μας για την εμπειρία σας, τις ειδικότητές σας...'
                    : 'Tell us about your experience, specializations...'}
                />
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
                  <Button type="button" onClick={handleAddCertification}>
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
                        className="hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
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
                <p className="text-sm text-stone-600 mb-3">
                  {language === 'el' 
                    ? 'Επιλέξτε τους διοργανωτές με τους οποίους συνεργάζεστε'
                    : 'Select the organizers you work with'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border rounded-lg p-3">
                  {organizers.map(org => (
                    <label 
                      key={org.organizer_code}
                      className="flex items-center gap-2 p-2 hover:bg-stone-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.organizer_codes.includes(org.organizer_code)}
                        onChange={() => handleOrganizerToggle(org.organizer_code)}
                        className="rounded"
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
                  onClick={() => navigate(createPageUrl('GuideProfile') + `?id=${guideId}`)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={updateGuideMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
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
                className="bg-emerald-600 hover:bg-emerald-700"
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