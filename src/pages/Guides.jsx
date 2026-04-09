import React, { useCallback } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MountainGuide, Organizer } from "@/api/db";
import { useAuth } from "@/lib/AuthContext";
import PullToRefresh from '../components/ui/PullToRefresh';
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "../components/contexts/LanguageContext";
import { useTranslation } from "../components/translations/useTranslations";
import PageWrapper from "../components/layout/PageWrapper";
import { Compass, Shield, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import GuideCard from "../components/guides/GuideCard";
import useSEO from "../components/seo/useSEO";

// Number of guide cards to show per "page" — incremental load-more keeps
// the initial render fast without requiring a third-party virtualization lib.
const GUIDES_PER_PAGE = 9;

export default function GuidesPage() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = React.useState(GUIDES_PER_PAGE);

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

  const { user } = useAuth();

  const { data: guides = [], isLoading: guidesLoading } = useQuery({
    queryKey: ['mountain-guides'],
    queryFn: () => MountainGuide.filter({ status: 'active' }),
  });

  const { data: organizers = [] } = useQuery({
    queryKey: ['all-organizers'],
    queryFn: () => Organizer.list(),
  });

  // Check if logged-in user has a guide profile
  const { data: userGuideProfile } = useQuery({
    queryKey: ['user-guide-profile', user?.id],
    queryFn: () => MountainGuide.filter({ user_id: user.id }),
    enabled: !!user,
  });

  const hasGuideProfile = userGuideProfile && userGuideProfile.length > 0;

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['mountain-guides'] }),
      queryClient.invalidateQueries({ queryKey: ['all-organizers'] }),
    ]);
  }, [queryClient]);

  // Guides visible in current "page" — incremental rendering keeps initial paint fast
  const visibleGuides = React.useMemo(
    () => guides.slice(0, visibleCount),
    [guides, visibleCount]
  );
  const hasMore = visibleCount < guides.length;

  if (guidesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label={language === 'el' ? 'Φόρτωση οδηγών…' : 'Loading guides…'}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark" aria-hidden="true" />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-brand-dark to-brand-dark text-white py-12 md:py-16 px-4 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1547233528-b4d311a5be41?w=1400&q=80)' }}>
        <div className="absolute inset-0 bg-brand-dark/70 z-0"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4">
            <Compass className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0" aria-hidden="true" />
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold break-words min-w-0">
              {language === 'el' ? 'Συνοδοί Βουνού' : 'Mountain Guides'}
            </h1>
          </div>
          <p className="text-base md:text-lg text-brand-gold max-w-2xl mx-auto text-center px-2 break-words">
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
          <Card className="mb-8 border-2 border-brand-dark/20 bg-gradient-to-r from-brand-gold/40 to-teal-50">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-brand-dark mb-2">
                    {language === 'el'
                        ? 'Είστε Συνοδός Βουνού;'
                        : 'Are You a Mountain Guide?'}
                  </h3>
                  <p className="text-foreground">
                    {language === 'el'
                      ? 'Δημιουργήστε το προφίλ σας και μοιραστείτε την εμπειρία σας με την κοινότητα'
                      : 'Create your profile and share your expertise with the community'}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    if (!user) {
                      navigate('/login');
                    } else {
                      navigate(createPageUrl('CreateGuideProfile'));
                    }
                  }}
                  className="bg-brand-dark hover:bg-brand-dark/90 flex items-center gap-2 min-h-[44px]"
                  aria-label={language === 'el' ? 'Δημιουργία προφίλ οδηγού' : 'Create guide profile'}
                >
                  <Plus className="w-5 h-5" aria-hidden="true" />
                  {language === 'el' ? 'Δημιουργία Προφίλ' : 'Create Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {guides.length === 0 ? (
          <div className="text-center py-16" role="status">
            <Shield className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {language === 'el' ? 'Δεν υπάρχουν οδηγοί ακόμα' : 'No guides yet'}
            </h3>
            <p className="text-muted-foreground">
              {language === 'el'
                ? 'Ελέγξτε ξανά σύντομα για νέους πιστοποιημένους οδηγούς'
                : 'Check back soon for certified guides'
              }
            </p>
          </div>
        ) : (
          <>
            {/* content-visibility:auto on each card wrapper lets the browser skip
                layout/paint for off-screen cards — browser-native rendering optimisation */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              role="list"
              aria-label={language === 'el' ? 'Λίστα οδηγών' : 'Guides list'}
            >
              {visibleGuides.map(guide => (
                <div
                  key={guide.id}
                  role="listitem"
                  style={{ contentVisibility: 'auto', containIntrinsicSize: '0 380px' }}
                >
                  <GuideCard
                    guide={guide}
                    organizers={organizers}
                    language={language}
                  />
                </div>
              ))}
            </div>

            {/* Load More button — avoids rendering all guides on initial paint */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount(c => c + GUIDES_PER_PAGE)}
                  className="border-brand-dark/20 text-brand-dark hover:bg-brand-gold/40 gap-2 min-h-[44px]"
                  aria-label={language === 'el' ? 'Φόρτωση περισσότερων οδηγών' : 'Load more guides'}
                >
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                  {language === 'el' ? 'Περισσότεροι Οδηγοί' : 'Load More Guides'}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({guides.length - visibleCount} {language === 'el' ? 'ακόμα' : 'remaining'})
                  </span>
                </Button>
              </div>
            )}
          </>
        )}
      </PageWrapper>
    </PullToRefresh>
  );
}
