import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
    full_name: '',
    email: '',
    username: '', // Added username field
    profile_picture_url: '',
    bio: '',
    website: '',
    phone: '',
    phone_number: '',
    training_status: '',
    health_status: '',
    medical_needs: '',
    emergency_contact_number: '',
    years_of_experience: '',
    certifications: '',
    certification_files: [],
    gemi_number: '',
    bank_accounts: [],
    social_profiles: {
      facebook: '',
      instagram: '',
      twitter: ''
    }
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
      // Check if this is a new user (missing required fields)
      // A user is considered "new" or incomplete if essential profile fields are missing.
      // In this context, full_name and phone_number are considered essential for initial setup.
      const newUser = !user.full_name;
      setIsNewUser(newUser);

      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        username: user.username || '', // Set username from user data
        profile_picture_url: user.profile_picture_url || '',
        bio: user.bio || '',
        website: user.website || '',
        phone: user.phone || '',
        phone_number: user.phone_number || '',
        training_status: user.training_status || '',
        health_status: user.health_status || '',
        medical_needs: user.medical_needs || '',
        emergency_contact_number: user.emergency_contact_number || '',
        years_of_experience: user.years_of_experience || '',
        certifications: user.certifications || '',
        certification_files: user.certification_files || [],
        gemi_number: user.gemi_number || '',
        bank_accounts: user.bank_accounts || [],
        social_profiles: user.social_profiles || {
          facebook: '',
          instagram: '',
          twitter: ''
        }
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (updatedData) => base44.auth.updateMe(updatedData),
    onMutate: async (updatedData) => {
      await queryClient.cancelQueries({ queryKey: ['current-user'] });
      const previousUser = queryClient.getQueryData(['current-user']);
      queryClient.setQueryData(['current-user'], (old) => ({ ...old, ...updatedData }));
      return { previousUser };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['current-user'], context.previousUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
        if (isNewUser) {
          navigate(createPageUrl("Calendar"));
        }
      }, 2000);
    },
  });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, profile_picture_url: file_url }));
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCertificationUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({
        ...prev,
        certification_files: [...prev.certification_files, file_url]
      }));
    } catch (error) {
      console.error("Certification upload failed", error);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate required fields
    if (!formData.full_name) {
      alert(language === 'el' ? "Το ονοματεπώνυμο είναι υποχρεωτικό πεδίο." : "Full name is a required field.");
      return;
    }
    
    // Remove is_verified if present - only admins can set this
    const { is_verified, ...dataToSubmit } = formData;
    
    // Send all form fields except is_verified
    updateProfileMutation.mutate(dataToSubmit);
  };

  const isOrganizer = user?.organizer_code && user.organizer_code.trim().length > 0;
  const showVerificationSection = isOrganizer && !user?.is_verified_organizer && user?.verification_status !== 'pending';

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
            <h2 className="text-lg font-bold text-blue-900 mb-1">{t('profile.welcome_new_user')}</h2>
            <p className="text-sm text-blue-700">{t('profile.complete_profile_message')}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.basic_information')}</CardTitle>
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
                    <Label htmlFor="profile-picture-upload">{t('profile.profile_picture')}</Label>
                    <Input id="profile-picture-upload" type="file" onChange={handleFileChange} disabled={isUploading} accept="image/*" />
                    {isUploading && <p className="text-sm text-muted-foreground mt-1">Uploading...</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">{t('profile.email')} *</Label>
                  <Input id="email" value={formData.email} disabled required />
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
                  <Label htmlFor="username">{t('profile.username')}</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder={t('profile.username_placeholder')}
                  />
                  <p className="text-xs text-stone-500 mt-1">{t('profile.username_note')}</p>
                </div>
                <div>
                  <Label htmlFor="phone_number">{t('profile.mobile_number')}</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    placeholder={t('profile.mobile_number_placeholder')}
                    value={formData.phone_number}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-stone-500 mt-1">{t('profile.mobile_number_note')}</p>
                </div>
              </CardContent>
            </Card>

            {!isOrganizer && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <CardTitle>{t('profile.safety_health')}</CardTitle>
                  </div>
                  <CardDescription>
                    {t('profile.safety_health_description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="training_status">{t('profile.fitness_level')}</Label>
                    <Select id="training_status" value={formData.training_status} onValueChange={(value) => handleSelectChange('training_status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('profile.fitness_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">{t('profile.fitness_beginner')}</SelectItem>
                        <SelectItem value="Intermediate">{t('profile.fitness_intermediate')}</SelectItem>
                        <SelectItem value="Advanced">{t('profile.fitness_advanced')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="health_status">{t('profile.general_health')}</Label>
                    <Textarea id="health_status" placeholder={t('profile.general_health_placeholder')} value={formData.health_status} onChange={handleInputChange} />
                  </div>
                  <div>
                    <Label htmlFor="medical_needs">{t('profile.allergies_medical')}</Label>
                    <Textarea id="medical_needs" placeholder={t('profile.allergies_placeholder')} value={formData.medical_needs} onChange={handleInputChange} />
                  </div>
                  <div>
                    <Label htmlFor="emergency_contact_number">{t('profile.emergency_contact')}</Label>
                    <Input
                      id="emergency_contact_number"
                      type="tel"
                      placeholder={t('profile.emergency_contact_placeholder')}
                      value={formData.emergency_contact_number}
                      onChange={handleInputChange}
                    />
                    <p className="text-xs text-stone-500 mt-1">{t('profile.mobile_number_note')}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {isOrganizer && (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <UserCog className="w-5 h-5 text-blue-600" />
                      <CardTitle>{t('profile.public_organizer_profile')}</CardTitle>
                    </div>
                    <CardDescription>
                      {t('profile.public_profile_description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="bio">{t('profile.bio')}</Label>
                      <Textarea id="bio" placeholder={t('profile.bio_placeholder')} value={formData.bio} onChange={handleInputChange} rows={4} />
                    </div>
                    <div>
                      <Label htmlFor="website">{t('profile.website')}</Label>
                      <Input id="website" type="url" placeholder={t('profile.website_placeholder')} value={formData.website} onChange={handleInputChange} />
                    </div>
                    <div>
                      <Label htmlFor="phone">{t('profile.public_phone')}</Label>
                      <Input id="phone" type="tel" placeholder={t('profile.public_phone_placeholder')} value={formData.phone} onChange={handleInputChange} />
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-600" />
                      <CardTitle>{t('profile.advanced_information')}</CardTitle>
                    </div>
                    <CardDescription>
                      {t('profile.advanced_information_description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
                      <Label htmlFor="gemi_number">{t('profile.gemi_number')}</Label>
                      <Input
                        id="gemi_number"
                        placeholder={t('profile.gemi_placeholder')}
                        value={formData.gemi_number}
                        onChange={handleInputChange}
                      />
                      <p className="text-xs text-stone-500 mt-1">{t('profile.gemi_note')}</p>
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

                    <div>
                      <Label>{t('profile.upload_certifications')}</Label>
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={handleCertificationUpload}
                        disabled={isUploading}
                      />
                      {formData.certification_files.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {formData.certification_files.map((url, index) => (
                            <div key={index} className="flex items-center justify-between bg-stone-50 p-3 rounded-lg">
                              <span className="text-sm text-stone-700">{t('profile.certification_file')} {index + 1}.pdf</span>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <a href={url} target="_blank" rel="noopener noreferrer">View</a>
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeCertification(index)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>{t('profile.bank_accounts')}</Label>
                      <p className="text-xs text-stone-500 mb-3">{t('profile.bank_accounts_description')}</p>

                      {formData.bank_accounts.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {formData.bank_accounts.map((account, index) => (
                            <div key={index} className="bg-stone-50 p-3 rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <p className="font-medium text-stone-900">{account.bank_name}</p>
                                  <p className="text-sm text-stone-600">IBAN: {account.iban}</p>
                                  {account.account_holder && <p className="text-sm text-stone-600">Holder: {account.account_holder}</p>}
                                  {account.swift_bic && <p className="text-sm text-stone-600">SWIFT/BIC: {account.swift_bic}</p>}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeBankAccount(index)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-3 border rounded-lg p-4 bg-white">
                        <Input
                          placeholder={t('profile.bank_name_placeholder')}
                          value={newBankAccount.bank_name}
                          onChange={(e) => setNewBankAccount({ ...newBankAccount, bank_name: e.target.value })}
                        />
                        <Input
                          placeholder={t('profile.account_holder')}
                          value={newBankAccount.account_holder}
                          onChange={(e) => setNewBankAccount({ ...newBankAccount, account_holder: e.target.value })}
                        />
                        <Input
                          placeholder={t('profile.iban_placeholder')}
                          value={newBankAccount.iban}
                          onChange={(e) => setNewBankAccount({ ...newBankAccount, iban: e.target.value })}
                        />
                        <Input
                          placeholder={t('profile.swift_bic')}
                          value={newBankAccount.swift_bic}
                          onChange={(e) => setNewBankAccount({ ...newBankAccount, swift_bic: e.target.value })}
                        />
                        <Button
                          type="button"
                          onClick={addBankAccount}
                          variant="outline"
                          className="w-full"
                          disabled={!newBankAccount.bank_name || !newBankAccount.iban}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {t('profile.add_bank_account')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {showVerificationSection && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-6">
                      <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      {t('profile.become_verified')}
                      </h4>
                      <p className="text-sm text-amber-800 mb-3">
                      {t('profile.become_verified_description')}
                      </p>
                      <Link to={createPageUrl("RequestVerification")}>
                      <Button variant="outline" className="border-amber-300 hover:bg-amber-100">
                        {t('profile.request_verification')}
                      </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}

                {user?.verification_status === 'pending' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      ⏳ Your verification request is pending review. We'll notify you once it's processed.
                    </p>
                  </div>
                )}

                {user?.is_verified_organizer && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <p className="text-sm text-emerald-800 font-medium">
                      Your organizer profile is verified!
                    </p>
                  </div>
                )}
              </>
            )}

            {updateSuccess && (
              <Alert variant="default" className="bg-emerald-50 border-emerald-200 text-emerald-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {isNewUser ? t('profile.profile_created') : t('profile.profile_updated')}
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardFooter className="p-6 flex-col gap-3">
                <Button type="submit" disabled={updateProfileMutation.isPending} className="w-full">
                  {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isNewUser ? t('profile.complete_profile') : t('profile.save_changes')}
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