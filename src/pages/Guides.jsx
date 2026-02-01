import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "../components/contexts/LanguageContext";
import { useTranslation } from "../components/translations/useTranslations";
import { Compass, Shield } from "lucide-react";
import GuideCard from "../components/guides/GuideCard";

export default function GuidesPage() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  React.useEffect(() => {
    document.title = language === 'el' 
      ? 'Οδηγοί Βουνού | Mountain Guides Directory | Nature Explorers'
      : 'Mountain Guides | Professional Hiking Guides Greece | Nature Explorers';
  }, [language]);

  const { data: guides = [], isLoading: guidesLoading } = useQuery({
    queryKey: ['mountain-guides'],
    queryFn: () => base44.entities.MountainGuide.filter({ status: 'active' }),
  });

  const { data: organizers = [] } = useQuery({
    queryKey: ['all-organizers'],
    queryFn: () => base44.entities.Organizer.list(),
  });

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
      <div className="relative bg-gradient-to-r from-emerald-700 to-emerald-900 text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-3 mb-4">
            <Compass className="w-10 h-10" />
            <h1 className="text-4xl md:text-5xl font-bold">
              {language === 'el' ? 'Οδηγοί Βουνού' : 'Mountain Guides'}
            </h1>
          </div>
          <p className="text-lg text-emerald-100 max-w-2xl">
            {language === 'el' 
              ? 'Γνωρίστε τους πιστοποιημένους επαγγελματίες οδηγούς που κάνουν κάθε εκδρομή ασφαλή και αξέχαστη'
              : 'Meet the certified professionals who make every adventure safe and unforgettable'
            }
          </p>
        </div>
      </div>

      {/* Guides Grid */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
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