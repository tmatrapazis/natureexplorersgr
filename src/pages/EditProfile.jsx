import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import useSEO from '../components/seo/useSEO';
import { useLanguage } from '../components/contexts/LanguageContext';
import { useTranslation } from '../components/translations/useTranslations';

export default function EditProfilePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  console.log('🟢 [EditProfile] Component mounted/rendered');

  // Prevent indexing - this is an authenticated page
  useSEO({
    title: t('profile.edit_profile'),
    description: 'Edit user profile',
    noindex: true
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    staleTime: Infinity,
  });

  const [formData, setFormData] = useState({
    username: '',
    profile_picture_url: '',
    phone_number: '',
    training_status: '',
    health_status: '',
    medical_needs: '',
    emergency_contact_number: '',
    certification_files: [],
    bank_accounts: [],
    social_profiles: {},
  });

  const [isUploading, setIsUploading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [newBankAccount, setNewBankAccount] = useState({
    bank_name: '',
    account_holder: '',
    iban: '',
    swift_bic: ''
  });

  useEffect(() => {
    if (user) {
      console.log('🔵 [EditProfile] useEffect: User data loaded:', user);
      
      // Check if this is a new user (missing required fields)
      const newUser = !user.full_name || !user.username;
      console.log('🆕 [EditProfile] Is new user:', newUser, '(full_name:', user.full_name, ', username:', user.username, ')');
      setIsNewUser(newUser);

      const initialFormData = {
        username: user.username || '',
        profile_picture_url: user.profile_picture_url || '',
        phone_number: user.phone_number || '',
        training_status: user.training_status || '',
        health_status: user.health_status || '',
        medical_needs: user.medical_needs || '',
        emergency_contact_number: user.emergency_contact_number || '',
        certification_files: user.certification_files || [],
        bank_accounts: user.bank_accounts || [],
        social_profiles: user.social_profiles || {},
      };
      
      console.log('📋 [EditProfile] Setting initial form data:', initialFormData);
      setFormData(initialFormData);
    } else {
      console.log('⚠️  [EditProfile] useEffect: No user data available yet');
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData) => {
      console.log('🔵 [EditProfile] Starting profile update mutation');
      console.log('📤 [EditProfile] Payload being sent:', JSON.stringify(updatedData, null, 2));
      
      try {
        const response = await base44.auth.updateMe(updatedData);
        console.log('✅ [EditProfile] API Response SUCCESS:', response);
        console.log('📊 [EditProfile] Response status: 200 OK');
        return response;
      } catch (error) {
        console.error('❌ [EditProfile] API call failed:', error);
        console.error('📊 [EditProfile] Error details:', {
          message: error.message,
          status: error.status,
          response: error.response,
          stack: error.stack
        });
        throw error;
      }
    },
    onMutate: async (updatedData) => {
      console.log('🟡 [EditProfile] onMutate: Canceling queries and optimistic update');
      await queryClient.cancelQueries({ queryKey: ['current-user'] });
      const previousUser = queryClient.getQueryData(['current-user']);
      queryClient.setQueryData(['current-user'], (old) => ({ ...old, ...updatedData }));
      return { previousUser };
    },
    onError: (err, variables, context) => {
      console.error('🔴 [EditProfile] onError triggered:', err);
      console.error('📋 [EditProfile] Error context:', { variables, context });
      
      queryClient.setQueryData(['current-user'], context.previousUser);
      
      // User-facing error messages
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
    onSuccess: (data) => {
      console.log('🟢 [EditProfile] onSuccess triggered');
      console.log('📦 [EditProfile] Updated user data:', data);
      
      setUpdateSuccess(true);
      toast.success(language === 'el' 
        ? 'Το προφίλ ενημερώθηκε με επιτυχία!' 
        : 'Profile updated successfully!');
      
      console.log('⏱️  [EditProfile] Scheduling redirect to Calendar in 1.5 seconds...');
      setTimeout(() => {
        console.log('🔄 [EditProfile] Invalidating queries...');
        queryClient.invalidateQueries({ queryKey: ['current-user'] });
        
        console.log('🚀 [EditProfile] Navigating to Calendar page...');
        const calendarUrl = createPageUrl("Calendar");
        console.log('🔗 [EditProfile] Target URL:', calendarUrl);
        navigate(calendarUrl);
        console.log('✅ [EditProfile] Navigation command issued');
      }, 1500);
    },
  });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.log('ℹ️  [EditProfile] handleFileChange: No file selected');
      return;
    }

    console.log('🔵 [EditProfile] Starting profile picture upload:', file.name);
    setIsUploading(true);
    
    try {
      console.log('📤 [EditProfile] Uploading file to server...');
      const response = await base44.integrations.Core.UploadFile({ file });
      console.log('✅ [EditProfile] Upload response:', response);
      
      if (!response || !response.file_url) {
        throw new Error('Upload response missing file_url');
      }
      
      console.log('🖼️  [EditProfile] Setting profile picture URL:', response.file_url);
      setFormData(prev => ({ ...prev, profile_picture_url: response.file_url }));
      toast.success(language === 'el' ? 'Η εικόνα ανέβηκε με επιτυχία' : 'Image uploaded successfully');
    } catch (error) {
      console.error('❌ [EditProfile] Profile picture upload failed:', error);
      toast.error(language === 'el' 
        ? `Αποτυχία ανεβάσματος εικόνας: ${error.message}` 
        : `Failed to upload image: ${error.message}`);
    } finally {
      setIsUploading(false);
      console.log('✓ [EditProfile] Upload process completed');
    }
  };

  const handleCertificationUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.log('ℹ️  [EditProfile] handleCertificationUpload: No file selected');
      return;
    }

    console.log('🔵 [EditProfile] Starting certification upload:', file.name);
    setIsUploading(true);
    
    try {
      console.log('📤 [EditProfile] Uploading certification file...');
      const response = await base44.integrations.Core.UploadFile({ file });
      console.log('✅ [EditProfile] Certification upload response:', response);
      
      if (!response || !response.file_url) {
        throw new Error('Upload response missing file_url');
      }
      
      console.log('📎 [EditProfile] Adding certification to list:', response.file_url);
      setFormData(prev => ({
        ...prev,
        certification_files: [...prev.certification_files, response.file_url]
      }));
      toast.success(language === 'el' ? 'Το αρχείο ανέβηκε με επιτυχία' : 'File uploaded successfully');
    } catch (error) {
      console.error('❌ [EditProfile] Certification upload failed:', error);
      toast.error(language === 'el' 
        ? `Αποτυχία ανεβάσματος αρχείου: ${error.message}` 
        : `Failed to upload file: ${error.message}`);
    } finally {
      setIsUploading(false);
      console.log('✓ [EditProfile] Certification upload process completed');
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
    
    console.log('🔵 [EditProfile] handleSubmit triggered');
    console.log('📋 [EditProfile] Current form data:', JSON.stringify(formData, null, 2));
    console.log('👤 [EditProfile] Is new user:', isNewUser);
    console.log('🌐 [EditProfile] Current language:', language);
    
    try {
      // Validate required fields
      console.log('🔍 [EditProfile] Validating username...');
      if (!formData.username || formData.username.trim() === '') {
        console.warn('⚠️  [EditProfile] Validation failed: Username is empty');
        const errorMsg = language === 'el' ? "Το όνομα χρήστη είναι υποχρεωτικό πεδίο." : "Username is a required field.";
        toast.error(errorMsg);
        return;
      }
      
      console.log('✅ [EditProfile] Validation passed');
      
      // Remove is_verified if present - only admins can set this
      const { is_verified, ...dataToSubmit } = formData;
      
      console.log('📤 [EditProfile] Data to submit (after filtering):', JSON.stringify(dataToSubmit, null, 2));
      console.log('🚀 [EditProfile] Calling mutation.mutate()...');
      
      // Send all form fields except is_verified
      updateProfileMutation.mutate(dataToSubmit);
      
      console.log('⏳ [EditProfile] Mutation triggered, waiting for response...');
      
    } catch (error) {
      console.error('❌ [EditProfile] Unexpected error in handleSubmit:', error);
      console.error('📊 [EditProfile] Error stack:', error.stack);
      toast.error(language === 'el' 
        ? `Απρόσμενο σφάλμα: ${error.message}` 
        : `Unexpected error: ${error.message}`);
    }
  };

  const isOrganizer = false;
  const showVerificationSection = false;

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-emerald-50/30 dark:via-emerald-950/10 to-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {!isNewUser && (
          <Button variant="outline" className="mb-6" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
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
                  <div className="w-20 h-20 rounded-full bg-stone-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {formData.profile_picture_url ? (
                      <img src={formData.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-stone-400" />
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
                 <div>{/*
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                  />
                */} </div>
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Choose a unique username"
                    required
                  />
                  <p className="text-xs text-stone-500 mt-1">This can be used for your profile URL</p>
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
                  <p className="text-xs text-stone-500 mt-1">Numbers only</p>
                </div>
              </CardContent>
            </Card>

            {!isOrganizer && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <CardTitle>Safety & Health Information</CardTitle>
                  </div>
                  <CardDescription>
                    This information is confidential and will only be shared with the trip organizer after you book a trip.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="training_status">Fitness Level</Label>
                    <Select id="training_status" value={formData.training_status} onValueChange={(value) => handleSelectChange('training_status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your fitness level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner (new to hiking)</SelectItem>
                        <SelectItem value="Intermediate">Intermediate (hike regularly)</SelectItem>
                        <SelectItem value="Advanced">Advanced (very experienced)</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Label htmlFor="emergency_contact_number">Emergency Contact Number</Label>
                    <Input
                      id="emergency_contact_number"
                      type="tel"
                      placeholder="Phone number of a trusted contact"
                      value={formData.emergency_contact_number}
                      onChange={handleInputChange}
                    />
                    <p className="text-xs text-stone-500 mt-1">Numbers only</p>
                  </div>
                </CardContent>
              </Card>
            )}



            {updateSuccess && (
              <Alert variant="default" className="bg-emerald-50 border-emerald-200 text-emerald-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {isNewUser ? "Profile created successfully! Redirecting..." : "Your profile has been updated successfully!"}
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardFooter className="p-6 flex-col gap-3">
                <Button type="submit" disabled={updateProfileMutation.isPending} className="w-full">
                  {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isNewUser ? "Complete Profile" : "Save Changes"}
                </Button>
                
                {!isNewUser && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full" type="button">
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove all your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            await base44.entities.User.delete(user.id);
                            await base44.auth.logout();
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}