import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';

import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { User, Upload, ArrowLeft, CheckCircle, Loader2, ShieldCheck, UserCog, Shield, Plus, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import useSEO from '../components/seo/useSEO';
import { useLanguage } from '../components/contexts/LanguageContext';
import { useTranslation } from '../components/translations/useTranslations';
import DeleteAccountDialog from '../components/profile/DeleteAccountDialog';
import MobileSelect from '../components/ui/MobileSelect';
import { createOptimisticUpdate } from '../lib/optimistic-mutations';
import { useBackNavigation } from '../lib/useBackNavigation';

export default function EditProfilePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { goBack } = useBackNavigation(null);
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  // Prevent indexing - this is an authenticated page
  useSEO({
    title: t('profile.edit_profile'),
    description: 'Edit user profile',
    noindex: true
  });

  const { user, isLoadingAuth: userLoading, refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    profile_picture_url: '',
    phone_number: '',
    date_of_birth: '',
    training_status: '',
    blood_type: '',
    health_status: '',
    medical_needs: '',
    dietary_requirements: '',
    emergency_contact_name: '',
    emergency_contact_number: '',
    certification_files: [],
    bank_accounts: [],
    social_profiles: {},
  });

  const [isUploading, setIsUploading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isNewUser, setIsNewUser] = useState(false);
  const [newBankAccount, setNewBankAccount] = useState({
    bank_name: '',
    account_holder: '',
    iban: '',
    swift_bic: ''
  });

  useEffect(() => {
    if (user) {
      // Check if this is a new user (missing required fields)
      const newUser = !user.full_name || !user.username;
      setIsNewUser(newUser);

      setFormData({
        full_name: user.full_name || '',
        username: user.username || '',
        profile_picture_url: user.profile_picture_url || '',
        phone_number: user.phone_number || '',
        date_of_birth: user.date_of_birth || '',
        training_status: user.training_status || '',
        blood_type: user.blood_type || '',
        health_status: user.health_status || '',
        medical_needs: user.medical_needs || '',
        dietary_requirements: user.dietary_requirements || '',
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_number: user.emergency_contact_number || '',
        certification_files: user.certification_files || [],
        bank_accounts: user.bank_accounts || [],
        social_profiles: user.social_profiles || {},
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (/** @type {any} */ updatedData) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
      await refreshUser();
      return data;
    },
    onError: (/** @type {any} */ err) => {
      const errorMessage = err.message || 'Failed to update profile';
      if (err.status === 400) {
        toast.error(language === 'el'
          ? `Μη έγκυρα δεδομένα: ${errorMessage}`
          : `Invalid data: ${errorMessage}`);
      } else if (err.status === 500) {
        toast.error(language === 'el'
          ? 'Σφάλμα διακομιστή. Προσπαθήστε ξανά αργότερα.'
          : 'Server error. Please try again later.');
      } else {
        toast.error(language === 'el'
          ? `Αποτυχία ενημέρωσης προφίλ: ${errorMessage}`
          : `Failed to update profile: ${errorMessage}`);
      }
    },
    onSuccess: () => {
      setUpdateSuccess(true);
      toast.success(language === 'el'
        ? 'Το προφίλ ενημερώθηκε με επιτυχία!'
        : 'Profile updated successfully!');

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['current-user'] });
        navigate(createPageUrl("Calendar"));
      }, 1500);
    },
  });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('profile-images').getPublicUrl(data.path);
      setFormData(prev => ({ ...prev, profile_picture_url: publicUrl }));
      toast.success(language === 'el' ? 'Η εικόνα ανέβηκε με επιτυχία' : 'Image uploaded successfully');
    } catch (error) {
      toast.error(language === 'el'
        ? `Αποτυχία ανεβάσματος εικόνας: ${error.message}`
        : `Failed to upload image: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCertificationUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-cert-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('guide-documents')
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('guide-documents').getPublicUrl(data.path);
      setFormData(prev => ({
        ...prev,
        certification_files: [...prev.certification_files, publicUrl]
      }));
      toast.success(language === 'el' ? 'Το αρχείο ανέβηκε με επιτυχία' : 'File uploaded successfully');
    } catch (error) {
      toast.error(language === 'el'
        ? `Αποτυχία ανεβάσματος αρχείου: ${error.message}`
        : `Failed to upload file: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const removeCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      certification_files: prev.certification_files.filter((_, i) => i !== index)
    }));
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;

    // Clear error for this field on change
    if (fieldErrors[id]) {
      setFieldErrors(prev => { const next = { ...prev }; delete next[id]; return next; });
    }

    // Only allow numbers for phone_number and emergency_contact_number
    if (id === 'phone_number' || id === 'emergency_contact_number') {
      const numbersOnly = value.replace(/[^0-9+\-\s()]/g, '');
      setFormData(prev => ({ ...prev, [id]: numbersOnly }));
    } else {
      setFormData(prev => ({ ...prev, [id]: value }));
    }
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

  const handleSelectChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const addBankAccount = () => {
    if (newBankAccount.bank_name && newBankAccount.iban) {
      setFormData(prev => ({
        ...prev,
        bank_accounts: [...prev.bank_accounts, newBankAccount]
      }));
      setNewBankAccount({
        bank_name: '',
        account_holder: '',
        iban: '',
        swift_bic: ''
      });
    }
  };

  const removeBankAccount = (index) => {
    setFormData(prev => ({
      ...prev,
      bank_accounts: prev.bank_accounts.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    const errors = {};
    if (!formData.username?.trim()) {
      errors.username = language === 'el' ? 'Το όνομα χρήστη είναι υποχρεωτικό.' : 'Username is required.';
    }
    if (!formData.full_name?.trim()) {
      errors.full_name = language === 'el' ? 'Το ονοματεπώνυμο είναι υποχρεωτικό.' : 'Full name is required.';
    }
    if (!formData.date_of_birth) {
      errors.date_of_birth = language === 'el' ? 'Η ημερομηνία γέννησης είναι υποχρεωτική.' : 'Date of birth is required.';
    }
    if (!formData.emergency_contact_name?.trim()) {
      errors.emergency_contact_name = language === 'el' ? 'Το όνομα επαφής έκτακτης ανάγκης είναι υποχρεωτικό.' : 'Emergency contact name is required.';
    }
    if (!formData.emergency_contact_number?.trim()) {
      errors.emergency_contact_number = language === 'el' ? 'Ο αριθμός επαφής έκτακτης ανάγκης είναι υποχρεωτικός.' : 'Emergency contact number is required.';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error(language === 'el'
        ? `Παρακαλώ συμπληρώστε ${Object.keys(errors).length} υποχρεωτικά πεδία.`
        : `Please fill in ${Object.keys(errors).length} required field${Object.keys(errors).length > 1 ? 's' : ''}.`);
      // Scroll to first error
      const firstErrorField = document.getElementById(Object.keys(errors)[0]);
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Remove is_verified — only admins can set this field
    const { is_verified, ...raw } = /** @type {any} */ (formData);

    // Convert empty strings to null so PostgreSQL non-text columns
    // (date, jsonb, etc.) don't reject them with 400.
    const dataToSubmit = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, v === '' ? null : v])
    );
    updateProfileMutation.mutate(dataToSubmit);
  };

  const isOrganizer = false;
  const showVerificationSection = false;

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-brand-dark" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-brand-gold/30 dark:via-brand-dark/10 to-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {!isNewUser && (
          <Button
            variant="outline"
            className="hidden md:inline-flex mb-6 min-h-[44px]"
            onClick={goBack}
            aria-label={language === 'el' ? 'Πίσω' : 'Back'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'el' ? 'Πίσω' : 'Back'}
          </Button>
        )}

        {isNewUser && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-lg font-bold text-blue-900 mb-1">Welcome to Nature Explorers!</h2>
            <p className="text-sm text-blue-700">Please complete your profile to get started. Fields marked with * are required.</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {formData.profile_picture_url ? (
                      <img src={formData.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="profile-picture-upload">Profile Picture</Label>
                    <Input id="profile-picture-upload" type="file" onChange={handleFileChange} disabled={isUploading} accept="image/*" />
                    {isUploading && <p className="text-sm text-muted-foreground mt-1">Uploading...</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" value={user?.email || ''} disabled required />
                </div>
                <div>
                  <Label htmlFor="full_name">Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    className={fieldErrors.full_name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {fieldErrors.full_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.full_name}</p>}
                </div>
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Choose a unique username"
                    className={fieldErrors.username ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {fieldErrors.username
                    ? <p className="text-xs text-red-500 mt-1">{fieldErrors.username}</p>
                    : <p className="text-xs text-muted-foreground mt-1">This can be used for your profile URL</p>}
                </div>
                <div>
                  <Label htmlFor="phone_number">Mobile Number</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    placeholder="Your primary contact number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Numbers only</p>
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth <span className="text-red-500">*</span></Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={fieldErrors.date_of_birth ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {fieldErrors.date_of_birth && <p className="text-xs text-red-500 mt-1">{fieldErrors.date_of_birth}</p>}
                </div>
              </CardContent>
            </Card>

            {!isOrganizer && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand-dark" />
                    <CardTitle>Safety & Health Information</CardTitle>
                  </div>
                  <CardDescription>
                    This information is confidential and will only be shared with the trip organizer after you book a trip.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="training_status">Fitness Level</Label>
                    <MobileSelect
                      value={formData.training_status}
                      onValueChange={(value) => handleSelectChange('training_status', value)}
                      options={[
                        { value: 'Beginner', label: 'Beginner (new to hiking)' },
                        { value: 'Intermediate', label: 'Intermediate (hike regularly)' },
                        { value: 'Advanced', label: 'Advanced (very experienced)' },
                      ]}
                      placeholder="Select your fitness level"
                      label="Fitness Level"
                    />
                  </div>
                  <div>
                    <Label htmlFor="blood_type">Blood Type</Label>
                    <MobileSelect
                      value={formData.blood_type}
                      onValueChange={(value) => handleSelectChange('blood_type', value)}
                      options={[
                        { value: 'A+',  label: 'A+' },
                        { value: 'A-',  label: 'A-' },
                        { value: 'B+',  label: 'B+' },
                        { value: 'B-',  label: 'B-' },
                        { value: 'AB+', label: 'AB+' },
                        { value: 'AB-', label: 'AB-' },
                        { value: 'O+',  label: 'O+' },
                        { value: 'O-',  label: 'O-' },
                      ]}
                      placeholder="Select your blood type"
                      label="Blood Type"
                    />
                  </div>
                  <div>
                    <Label htmlFor="health_status">General Health</Label>
                    <Textarea id="health_status" placeholder="Any general conditions an organizer should know about? (e.g., 'Good overall health, no issues.')" value={formData.health_status} onChange={handleInputChange} />
                  </div>
                  <div>
                    <Label htmlFor="medical_needs">Allergies & Medical Needs</Label>
                    <Textarea id="medical_needs" placeholder="List any allergies (e.g., bees, nuts), medical conditions, or important medications." value={formData.medical_needs} onChange={handleInputChange} />
                  </div>
                  <div>
                    <Label htmlFor="dietary_requirements">Dietary Requirements</Label>
                    <Textarea id="dietary_requirements" placeholder="e.g., vegetarian, vegan, gluten-free, halal — relevant for multi-day trips with meals." value={formData.dietary_requirements} onChange={handleInputChange} rows={2} />
                  </div>
                  <div>
                    <Label htmlFor="emergency_contact_name">Emergency Contact Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="emergency_contact_name"
                      placeholder="Name of a trusted contact (e.g., spouse, parent)"
                      value={formData.emergency_contact_name}
                      onChange={handleInputChange}
                      className={fieldErrors.emergency_contact_name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    />
                    {fieldErrors.emergency_contact_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.emergency_contact_name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="emergency_contact_number">Emergency Contact Number <span className="text-red-500">*</span></Label>
                    <Input
                      id="emergency_contact_number"
                      type="tel"
                      placeholder="Phone number of a trusted contact"
                      value={formData.emergency_contact_number}
                      onChange={handleInputChange}
                      className={fieldErrors.emergency_contact_number ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    />
                    {fieldErrors.emergency_contact_number
                      ? <p className="text-xs text-red-500 mt-1">{fieldErrors.emergency_contact_number}</p>
                      : <p className="text-xs text-muted-foreground mt-1">Numbers only</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {updateSuccess && (
              <Alert variant="default" className="bg-brand-gold/40 border-brand-dark/20 text-brand-dark">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {isNewUser ? "Profile created successfully! Redirecting..." : "Your profile has been updated successfully!"}
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardFooter className="p-6 flex-col gap-3">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="w-full min-h-[44px]"
                  aria-label={isNewUser
                    ? (language === 'el' ? 'Ολοκλήρωση Προφίλ' : 'Complete Profile')
                    : (language === 'el' ? 'Αποθήκευση Αλλαγών' : 'Save Changes')}
                >
                  {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isNewUser
                    ? (language === 'el' ? 'Ολοκλήρωση Προφίλ' : 'Complete Profile')
                    : (language === 'el' ? 'Αποθήκευση Αλλαγών' : 'Save Changes')}
                </Button>

                {!isNewUser && <DeleteAccountDialog user={user} language={language} />}
              </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
