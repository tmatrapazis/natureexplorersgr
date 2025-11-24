import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Instagram, Facebook, Mail } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function PublicFooter() {
  const { language } = useLanguage();

  return (
    <footer className="border-t bg-stone-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Brand Section */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png"
                alt="Nature Explorers logo"
                className="h-8 w-auto"
              />
              <span className="font-bold text-lg">Nature Explorers</span>
            </div>
            <p className="text-sm text-stone-600 text-center md:text-left">
              {language === 'el' 
                ? 'Ανακαλύψτε πεζοπορικές εκδρομές σε όλη την Ελλάδα'
                : 'Discover hiking adventures across Greece'}
            </p>
          </div>

          {/* Quick Links Section */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="font-semibold mb-3">{language === 'el' ? 'Πλοήγηση' : 'Quick Links'}</h3>
            <nav className="flex flex-col gap-2 text-sm">
              <Link to={createPageUrl("Calendar")} className="text-stone-600 hover:text-emerald-600 transition-colors">
                {language === 'el' ? 'Εκδρομές' : 'Expeditions'}
              </Link>
              <Link to={createPageUrl("OrganizersList")} className="text-stone-600 hover:text-emerald-600 transition-colors">
                {language === 'el' ? 'Οδηγοί' : 'Organizers'}
              </Link>
              <Link to={createPageUrl("TermsOfUse")} className="text-stone-600 hover:text-emerald-600 transition-colors">
                {language === 'el' ? 'Όροι Χρήσης' : 'Terms of Use'}
              </Link>
            </nav>
          </div>

          {/* Contact & Social Section */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="font-semibold mb-3">{language === 'el' ? 'Επικοινωνία' : 'Connect With Us'}</h3>
            <div className="flex items-center gap-4 mb-3">
              <a
                href="https://www.instagram.com/natureexplorers.gr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-600 hover:text-emerald-600 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/natureexplorersgr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-600 hover:text-emerald-600 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="mailto:natureexplorersgr@gmail.com"
                className="text-stone-600 hover:text-emerald-600 transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
            <a 
              href="mailto:natureexplorersgr@gmail.com" 
              className="text-sm text-stone-600 hover:text-emerald-600 transition-colors"
            >
              natureexplorersgr@gmail.com
            </a>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="pt-6 border-t border-stone-200 text-center">
          <p className="text-sm text-stone-600">
            © {new Date().getFullYear()} Nature Explorers. {language === 'el' ? 'Όλα τα δικαιώματα διατηρούνται' : 'All rights reserved'}.
          </p>
        </div>
      </div>
    </footer>
  );

}