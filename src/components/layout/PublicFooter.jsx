import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Instagram, Facebook, Mail } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function PublicFooter() {
  const { language } = useLanguage();

  return (
    <footer style={{ background: '#070f0b', borderTop: '0.5px solid rgba(240,227,199,0.12)', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap');
        .footer-social {
          display: inline-flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 50%;
          border: 0.5px solid rgba(240,227,199,0.25);
          color: rgba(240,227,199,0.6); text-decoration: none;
          transition: all 0.22s ease;
        }
        .footer-social:hover {
          border-color: rgba(240,227,199,0.6); color: #F0E3C7;
          background: rgba(240,227,199,0.06);
        }
        .footer-link {
          font-size: 13px; color: rgba(240,227,199,0.45); text-decoration: none;
          transition: color 0.2s ease;
        }
        .footer-link:hover { color: rgba(240,227,199,0.8); }
      `}</style>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px clamp(16px,4vw,48px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png"
              alt="Nature Explorers logo"
              style={{ height: '24px', width: 'auto' }}
            />
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'rgba(240,227,199,0.7)' }}>Nature Explorers</span>
          </div>

          {/* Copyright + links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'rgba(240,227,199,0.3)' }}>
              © {new Date().getFullYear()} Nature Explorers.
            </span>
            <Link to="/About" className="footer-link">
              {language === 'el' ? 'Σχετικά' : 'About'}
            </Link>
            <Link to={createPageUrl("TermsOfUse")} className="footer-link">
              {language === 'el' ? 'Όροι Χρήσης' : 'Terms of Use'}
            </Link>
          </div>

          {/* Social icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a href="https://www.instagram.com/natureexplorers.gr/" target="_blank" rel="noopener noreferrer" className="footer-social" aria-label="Instagram">
              <Instagram size={15} />
            </a>
            <a href="https://www.facebook.com/natureexplorersgr/" target="_blank" rel="noopener noreferrer" className="footer-social" aria-label="Facebook">
              <Facebook size={15} />
            </a>
            <a href="mailto:natureexplorersgr@gmail.com" className="footer-social" aria-label="Email">
              <Mail size={15} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}