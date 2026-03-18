import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "../components/contexts/LanguageContext";
import { useTranslation } from "../components/translations/useTranslations";
import PageWrapper from "../components/layout/PageWrapper";
import { Compass, Shield, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import GuideCard from "../components/guides/GuideCard";
import useSEO from "../components/seo/useSEO";

export default function GuidesPage() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const navigate = useNavigate();

  useSEO({
    title: language === 'el'
      ? 'Οδηγοί Βουνού | Mountain Guides Directory | Nature Explorers'
      : 'Mountain Guides | Professional Hiking Guides Greece | Nature Explorers',
    description: language === 'el'
      ? 'Βρείτε πιστοποιημένους οδηγούς βουνού και trekking για εκδρομές σε όλη την Ελλάδα. Επαγγελματίες ορειβατικοί οδηγοί για ασφαλείς και αξέχαστες πεζοπορικές περιπέτειες.'
      : 'Find certified mountain and trekking guides for hiking trips across Greece. Professional hiking guides for safe and unforgettable outdoor adventures.',
    url: 'https://natureexplorers.gr/Guides',
    type: 'website',
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: guides = [], isLoading: guidesLoading } = useQuery({
    queryKey: ['mountain-guides'],
    queryFn: () => base44.entities.MountainGuide.filter({ status: 'active' }),
  });

  const { data: organizers = [] } = useQuery({
    queryKey: ['all-organizers'],
    queryFn: () => base44.entities.Organizer.list(),
  });

  // Check if logged-in user has a guide profile
  const { data: userGuideProfile } = useQuery({
    queryKey: ['user-guide-profile', user?.id],
    queryFn: () => base44.entities.MountainGuide.filter({ user_id: user.id }),
    enabled: !!user,
  });

  const hasGuideProfile = userGuideProfile && userGuideProfile.length > 0;

  if (guidesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-emerald-700 to-emerald-900 text-white py-12 md:py-16 px-4 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1547233528-b4d311a5be41?w=1400&q=80)' }}>
        <div className="absolute inset-0 bg-emerald-900/70 z-0"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4">
            <Compass className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0" />
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold break-words min-w-0">
              {language === 'el' ? 'Συνοδοί Βουνού' : 'Mountain Guides'}
            </h1>
          </div>
          <p className="text-base md:text-lg text-emerald-100 max-w-2xl mx-auto text-center px-2 break-words">
            {language === 'el' 
              ? 'Γνωρίστε τους πιστοποιημένους επαγγελματίες συνοδούς που κάνουν κάθε εκδρομή ασφαλή και αξέχαστη'
              : 'Meet the certified professionals who make every adventure safe and unforgettable'
            }
          </p>
        </div>
      </div>

      {/* Guides Grid */}
      <PageWrapper>
        
        {/* Create Profile CTA - shown to all users */}
        {(!user || !hasGuideProfile) && (
          <Card className="mb-8 border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-emerald-900 mb-2">
                    {language === 'el' 
                        ? 'Είστε Συνοδός Βουνού;' 
                        : 'Are You a Mountain Guide?'}
                  </h3>
                  <p className="text-stone-700">
                    {language === 'el'
                      ? 'Δημιουργήστε το προφίλ σας και μοιραστείτε την εμπειρία σας με την κοινότητα'
                      : 'Create your profile and share your expertise with the community'}
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    if (!user) {
                      base44.auth.redirectToLogin(createPageUrl('CreateGuideProfile'));
                    } else {
                      navigate(createPageUrl('CreateGuideProfile'));
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  {language === 'el' ? 'Δημιουργία Προφίλ' : 'Create Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {guides.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-stone-900 mb-2">
              {language === 'el' ? 'Δεν υπάρχουν οδηγοί ακόμα' : 'No guides yet'}
            </h3>
            <p className="text-stone-600">
              {language === 'el' 
                ? 'Ελέγξτε ξανά σύντομα για νέους πιστοποιημένους οδηγούς'
                : 'Check back soon for certified guides'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map(guide => (
              <GuideCard 
                key={guide.id} 
                guide={guide} 
                organizers={organizers}
                language={language}
              />
            ))}
          </div>
        )}
      </PageWrapper>
    </>
  );
}