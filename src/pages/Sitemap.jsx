import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "../components/contexts/LanguageContext";
import { useTranslation } from "../components/translations/useTranslations";
import { Map, Mountain, Calendar as CalendarIcon, Users, FileText, UserPlus } from "lucide-react";

export default function SitemapPage() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  React.useEffect(() => {
    document.title = language === 'el' 
      ? 'Χάρτης Ιστοτόπου | Nature Explorers'
      : 'Sitemap | Nature Explorers';
  }, [language]);

  const linkSections = [
    {
      title: language === 'el' ? 'Κύρια Πλοήγηση' : 'Main Navigation',
      icon: <Map className="w-5 h-5" />,
      links: [
        { name: language === 'el' ? 'Αρχική' : 'Home', path: 'Home' },
        { name: language === 'el' ? 'Ημερολόγιο Εκδρομών' : 'Trip Calendar', path: 'Calendar' },
        { name: language === 'el' ? 'Διοργανωτές' : 'Organizers', path: 'OrganizersList' },
        { name: language === 'el' ? 'Οδηγοί Βουνού' : 'Mountain Guides', path: 'Guides' },
      ]
    },
    {
      title: language === 'el' ? 'Ενέργειες Χρήστη' : 'User Actions',
      icon: <UserPlus className="w-5 h-5" />,
      links: [
        { name: language === 'el' ? 'Δημιουργία Προφίλ Οδηγού' : 'Create Guide Profile', path: 'CreateGuideProfile' },
      ]
    },
    {
      title: language === 'el' ? 'Νομικά' : 'Legal',
      icon: <FileText className="w-5 h-5" />,
      links: [
        { name: language === 'el' ? 'Όροι Χρήσης' : 'Terms of Use', path: 'TermsOfUse' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <Map className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-stone-900">
              {language === 'el' ? 'Χάρτης Ιστοτόπου' : 'Sitemap'}
            </h1>
          </div>

          <p className="text-stone-600 mb-8">
            {language === 'el' 
              ? 'Πλοηγηθείτε εύκολα σε όλες τις σελίδες του Nature Explorers'
              : 'Navigate easily through all Nature Explorers pages'
            }
          </p>

          <div className="space-y-8">
            {linkSections.map((section, idx) => (
              <div key={idx} className="border-l-4 border-emerald-600 pl-6">
                <div className="flex items-center gap-2 mb-4">
                  {section.icon}
                  <h2 className="text-xl font-semibold text-stone-900">{section.title}</h2>
                </div>
                <ul className="space-y-3">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <Link 
                        to={createPageUrl(link.path)}
                        className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors text-lg"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Dynamic Content Note */}
            <div className="border-l-4 border-stone-300 pl-6 mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Mountain className="w-5 h-5 text-stone-600" />
                <h2 className="text-xl font-semibold text-stone-900">
                  {language === 'el' ? 'Δυναμικό Περιεχόμενο' : 'Dynamic Content'}
                </h2>
              </div>
              <p className="text-stone-600">
                {language === 'el' 
                  ? 'Εξερευνήστε τις πλήρεις λίστες των Εκδρομών, Διοργανωτών και Οδηγών Βουνού μέσω των παραπάνω σελίδων πλοήγησης.'
                  : 'Explore our full lists of Expeditions, Organizers, and Mountain Guides through the navigation pages above.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}