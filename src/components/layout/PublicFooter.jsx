import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Instagram, Facebook, Mail } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function PublicFooter() {
  const { language } = useLanguage();

  return (
    <footer className="border-t">
      <div className="mx-auto pt-10 pb-6 pl-4 container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="mr-24 ml-24 flex items-center gap-2">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png"
              alt="Nature Explorers logo"
              className="h-6 w-auto" />

            <span className="font-semibold">Nature Explorers</span>
          </div>
          
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/natureexplorers.gr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-600 hover:text-emerald-600 transition-colors"
              aria-label="Instagram">

              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://www.facebook.com/natureexplorersgr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-600 hover:text-emerald-600 transition-colors"
              aria-label="Facebook">

              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="mailto:natureexplorersgr@gmail.com"
              className="text-stone-600 hover:text-emerald-600 transition-colors"
              aria-label="Email">

              <Mail className="w-5 h-5" />
            </a>
          </div>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Nature Explorers. All rights reserved.
          </p>
          
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link to={createPageUrl("Calendar")} className="text-muted-foreground hover:text-primary">
              {language === 'el' ? 'Εκδρομές' : 'Expeditions'}
            </Link>
            <Link to={createPageUrl("OrganizersList")} className="text-muted-foreground hover:text-primary">
              {language === 'el' ? 'Οδηγοί' : 'Organizers'}
            </Link>
            <Link to={createPageUrl("TermsOfUse")} className="text-muted-foreground hover:text-primary">
              {language === 'el' ? 'Όροι Χρήσης' : 'Terms of Use'}
            </Link>
          </nav>
        </div>
      </div>
    </footer>);

}