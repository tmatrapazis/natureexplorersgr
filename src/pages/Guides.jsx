import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "../components/contexts/LanguageContext";
import { useTranslation } from "../components/translations/useTranslations";
import { Compass, Shield, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import GuideCard from "../components/guides/GuideCard";

export default function GuidesPage() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = language === 'el' 
      ? 'Οδηγοί Βουνού | Mountain Guides Directory | Nature Explorers'
      : 'Mountain Guides | Professional Hiking Guides Greece | Nature Explorers';
  }, [language]);

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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-emerald-700 to-emerald-900 text-white py-16 px-4 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1547233528-b4d311a5be41?w=1400&q=80)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-3 mb-4">
            <Compass className="w-10 h-10" />
            <h1 className="text-4xl md:text-5xl font-bold">
              {language === 'el' ? 'Συνοδοί Βουνού' : 'Mountain Guides'}
            </h1>
          </div>
          <p className="text-lg text-emerald-100 max-w-2xl">
            {language === 'el' 
              ? 'Γνωρίστε τους πιστοποιημένους επαγγελματίες συνοδούς που κάνουν κάθε εκδρομή ασφαλή και αξέχαστη'
              : 'Meet the certified professionals who make every adventure safe and unforgettable'
            }
          </p>
        </div>
      </div>

      {/* Guides Grid */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
        
        {/* Create Profile CTA for logged-in users without a guide profile */}
        {user && !hasGuideProfile && (
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
                  onClick={() => navigate(createPageUrl('CreateGuideProfile'))}
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
      </div>
    </div>
  );
}