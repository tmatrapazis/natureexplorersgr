import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';

import { toast } from 'sonner';
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

  const { user, isLoadingAuth: isLoading, refreshUser } = useAuth();

  // Check if user already has completed setup
  useEffect(() => {
    if (user && user.full_name && user.phone_number) {
      // User has already completed profile, redirect to calendar
      navigate(createPageUrl("Calendar"));
    }
  }, [user, navigate]);

  const assignRoleMutation = useMutation({
    mutationFn: async (/** @type {any} */ intendedRole) => {
      
      const updates = {
        full_name: user.full_name || user.email.split('@')[0],
        phone_number: user.phone_number || '',
      };

      // Store intent in localStorage - organizer access will be granted once organizer_code is assigned
      if (intendedRole === 'organizer') {
        updates.intended_role = 'organizer';
      } else {
        updates.intended_role = 'hiker';
      }

      
      try {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);
        if (error) throw error;
        await refreshUser();

        // Send email notification to admin if user selected organizer role
        if (intendedRole === 'organizer') {
          console.warn('Email sending not yet implemented — will use Supabase Edge Function');
        }

        return updates;
      } catch (updateError) {
        console.error('[RoleSelection] ❌ User update failed:', updateError);
        throw new Error('Failed to update user role. Please try again.');
      }
    },
    onSuccess: async (data, intendedRole) => {
      toast.success(t('role_selection.success_toast'));
      queryClient.invalidateQueries({ queryKey: ['current-user'] });

      // Navigate to edit profile to complete required fields
      navigate(createPageUrl("EditProfile"));
    },
    onError: (error) => {
      console.error('[RoleSelection] ❌ Role assignment failed:', error);
      toast.error(t('role_selection.error_toast'));
    }
  });

  const handleRoleSelection = (role) => {
    assignRoleMutation.mutate(role);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#0c281c]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-[#f0e3c7]/30 to-stone-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png" alt="Nature Explorers" className="h-16 w-auto" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">{t('role_selection.title')}</h1>
          <p className="text-muted-foreground">{t('role_selection.subtitle')}</p>
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
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[1, 2, 3, 4, 5].map((n) => (
                  <li key={n} className="flex items-start gap-2">
                    <span className="text-[#0c281c] font-bold">✓</span>
                    <span>{t(`role_selection.hiker_benefit_${n}`)}</span>
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
          <Card className="hover:shadow-xl transition-all cursor-pointer border-2 border-[#0c281c]/20">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-[#f0e3c7]/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mountain className="w-12 h-12 text-[#0c281c]" />
              </div>
              <CardTitle className="text-2xl">{t('role_selection.organizer_title')}</CardTitle>
              <CardDescription>{t('role_selection.organizer_description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[1, 2, 3, 4, 5].map((n) => (
                  <li key={n} className="flex items-start gap-2">
                    <span className="text-[#0c281c] font-bold">✓</span>
                    <span>{t(`role_selection.organizer_benefit_${n}`)}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full mt-4 bg-[#0c281c] hover:bg-[#0c281c]/90"
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

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t('role_selection.preferences_note')}
        </p>
      </div>
    </div>
  );
}