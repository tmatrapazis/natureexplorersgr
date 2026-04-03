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
      toast.success('Role selection completed successfully!');
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      
      // Navigate to edit profile to complete required fields
      navigate(createPageUrl("EditProfile"));
    },
    onError: (error) => {
      console.error('[RoleSelection] ❌ Role assignment failed:', error);
      toast.error(error.message || 'Failed to complete registration. Please try again.');
    }
  });

  const handleRoleSelection = (role) => {
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
          <h1 className="text-4xl font-bold text-foreground mb-2">Welcome to Nature Explorers!</h1>
          <p className="text-muted-foreground">Choose how you'd like to join our community</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Hiker Card */}
          <Card className="hover:shadow-xl transition-all cursor-pointer">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCircle2 className="w-12 h-12 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Join as a Hiker</CardTitle>
              <CardDescription>Discover and book amazing hiking adventures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Browse and search hiking events</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Book spots in upcoming expeditions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Rate and review events</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Follow your favorite organizers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Get personalized notifications</span>
                </li>
              </ul>
              <Button 
                className="w-full mt-4" 
                onClick={() => handleRoleSelection('hiker')}
                disabled={assignRoleMutation.isPending}
              >
                {assignRoleMutation.isPending && assignRoleMutation.variables === 'hiker' ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  'Continue as Hiker'
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
              <CardTitle className="text-2xl">Join as an Organizer</CardTitle>
              <CardDescription>Create and manage hiking expeditions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Create, edit, and manage events</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Accept/decline booking requests</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Build your public organizer profile</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>View feedback and ratings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Apply for verified organizer badge</span>
                </li>
              </ul>
              <Button 
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700" 
                onClick={() => handleRoleSelection('organizer')}
                disabled={assignRoleMutation.isPending}
              >
                {assignRoleMutation.isPending && assignRoleMutation.variables === 'organizer' ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  'Continue as Organizer'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          You can always update your preferences later in your profile settings
        </p>
      </div>
    </div>
  );
}