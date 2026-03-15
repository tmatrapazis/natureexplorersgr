import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Instagram, Facebook, Mail } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function PublicFooter() {
  const { language } = useLanguage();

  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png"
              alt="Nature Explorers logo"
              className="h-6 w-auto"
            />
            <span className="font-semibold">Nature Explorers</span>
          </div>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Nature Explorers. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4">
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
            <Link to="/About" className="text-sm font-medium text-muted-foreground hover:text-primary">
              {language === 'el' ? 'Σχετικά' : 'About'}
            </Link>
            <Link to={createPageUrl("TermsOfUse")} className="text-sm font-medium text-muted-foreground hover:text-primary">
              {language === 'el' ? 'Όροι Χρήσης' : 'Terms of Use'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );

}