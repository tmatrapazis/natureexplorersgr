import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, UserCircle2, Mountain } from 'lucide-react';
import useSEO from '../components/seo/useSEO';
import { useLanguage } from '../components/contexts/LanguageContext';
import { useTranslation } from '../components/translations/useTranslations';

export default function RoleSelectionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { language } = useLanguage();
  const { t } = useTranslation(language);

  // Prevent indexing - this is an authenticated page
  useSEO({
    title: t('role_selection.title'),
    description: 'Select user role',
    noindex: true
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  // Check if user already has completed setup
  useEffect(() => {
    if (user && user.full_name && user.phone_number) {
      // User has already completed profile, redirect to calendar
      navigate(createPageUrl("Calendar"));
    }
  }, [user, navigate]);

  const assignRoleMutation = useMutation({
    mutationFn: async (intendedRole) => {
      console.log('[RoleSelection] 🚀 Starting role assignment for:', intendedRole);
      
      const updates = {
        full_name: user.full_name || user.email.split('@')[0],
        phone_number: user.phone_number || '',
      };

      // Store intent in localStorage - organizer access will be granted once organizer_code is assigned
      if (intendedRole === 'organizer') {
        updates.intended_role = 'organizer';
        console.log('[RoleSelection] 📝 Marking user intent as organizer');
      } else {
        updates.intended_role = 'hiker';
        console.log('[RoleSelection] 📝 Marking user intent as hiker');
      }

      console.log('[RoleSelection] 💾 Updating user with:', updates);
      const updatedUser = await base44.auth.updateMe(updates);
      console.log('[RoleSelection] ✅ User updated successfully');

      // Send email notification to admin if user selected organizer role
      if (intendedRole === 'organizer') {
        try {
          console.log('[RoleSelection] 📧 Sending admin notification email');
          await base44.integrations.Core.SendEmail({
            to: 'natureexplorersgr@gmail.com',
            subject: 'New Organizer Sign-Up Request',
            body: `
              <h2>New Organizer Registration</h2>
              <p>A new user has requested to join as an organizer on Nature Explorers.</p>
              <hr/>
              <h3>User Details:</h3>
              <ul>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Name:</strong> ${user.full_name || 'Not provided yet'}</li>
                <li><strong>User ID:</strong> ${user.id}</li>
                <li><strong>Registration Date:</strong> ${new Date().toLocaleString()}</li>
              </ul>
              <p>The user's <strong>intended_role</strong> has been set to <strong>organizer</strong>.</p>
              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>The user will complete their profile (name, phone, bio, etc.)</li>
                <li>To grant them organizer access, you need to assign them an <strong>organizer_code</strong> in the Base44 dashboard (Data → User entity → find user → set organizer_code field to a unique code like "ORG001")</li>
                <li>Once they have an organizer_code, they can create and manage trips</li>
                <li>They may also request verification (verified badge) later through the app</li>
              </ol>
              <p><em>Note: Until you assign them an organizer_code in the dashboard, they will not have organizer permissions.</em></p>
            `
          });
          console.log('[RoleSelection] ✅ Admin notification email sent');
        } catch (error) {
          console.warn('[RoleSelection] ⚠️ Failed to send admin notification email:', error.message);
          // Don't throw - email failure shouldn't block the user flow
        }
      }

      return updatedUser;
    },
    onSuccess: async (data, intendedRole) => {
      console.log('[RoleSelection] 🔄 Invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      
      // Navigate to edit profile to complete required fields
      console.log('[RoleSelection] ➡️ Redirecting to EditProfile');
      navigate(createPageUrl("EditProfile"));
    },
    onError: (error) => {
      console.error('[RoleSelection] ❌ Role assignment failed:', error);
      alert('Failed to complete registration. Please try again.');
    }
  });

  const handleRoleSelection = (role) => {
    console.log('[RoleSelection] 👤 User selected role:', role);
    assignRoleMutation.mutate(role);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png" alt="Nature Explorers" className="h-16 w-auto" />
          </div>
          <h1 className="text-4xl font-bold text-stone-900 mb-2">{t('role_selection.title')}</h1>
          <p className="text-stone-600">{t('role_selection.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Hiker Card */}
          <Card className="hover:shadow-xl transition-all cursor-pointer">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCircle2 className="w-12 h-12 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">{t('role_selection.hiker_title')}</CardTitle>
              <CardDescription>{t('role_selection.hiker_description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm text-stone-600">
                {['hiker_benefit_1','hiker_benefit_2','hiker_benefit_3','hiker_benefit_4','hiker_benefit_5'].map(key => (
                  <li key={key} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{t(`role_selection.${key}`)}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full mt-4" 
                onClick={() => handleRoleSelection('hiker')}
                disabled={assignRoleMutation.isPending}
              >
                {assignRoleMutation.isPending && assignRoleMutation.variables === 'hiker' ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('role_selection.processing')}</>
                ) : (
                  t('role_selection.continue_hiker')
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Organizer Card */}
          <Card className="hover:shadow-xl transition-all cursor-pointer border-2 border-emerald-200">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mountain className="w-12 h-12 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl">{t('role_selection.organizer_title')}</CardTitle>
              <CardDescription>{t('role_selection.organizer_description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm text-stone-600">
                {['organizer_benefit_1','organizer_benefit_2','organizer_benefit_3','organizer_benefit_4','organizer_benefit_5'].map(key => (
                  <li key={key} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{t(`role_selection.${key}`)}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700" 
                onClick={() => handleRoleSelection('organizer')}
                disabled={assignRoleMutation.isPending}
              >
                {assignRoleMutation.isPending && assignRoleMutation.variables === 'organizer' ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('role_selection.processing')}</>
                ) : (
                  t('role_selection.continue_organizer')
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-stone-500 mt-6">
          {t('role_selection.preferences_note')}
        </p>
      </div>
    </div>
  );
}