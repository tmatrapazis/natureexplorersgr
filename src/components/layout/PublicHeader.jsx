import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LogIn, LogOut, Globe, Menu, Calendar, Users, Compass, Home, Info, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../translations/useTranslations';
import { useLocation } from 'react-router-dom';

export default function PublicHeader() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation(language);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/Home';

  const { data: user } = useQuery({
    queryKey: ['current-user-public-header'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const handleLogin = () => base44.auth.redirectToLogin(window.location.pathname);
  const handleLogout = () => base44.auth.logout(createPageUrl("Home"));

  const navLinks = [
    { to: createPageUrl("Calendar"), label: t('navigation.calendar') },
    { to: createPageUrl("OrganizersList"), label: t('navigation.organizers') },
    { to: createPageUrl("Guides"), label: t('navigation.guides') },
    { to: createPageUrl("GreekRefuges"), label: t('navigation.refuges') },
    { to: '/About', label: language === 'el' ? 'Σχετικά' : 'About' },
  ];

  // Transparent over hero on home, solid otherwise
  const headerBg = isHome
    ? 'rgba(0,0,0,0)' // transparent on home (hero is behind)
    : '#0C281C';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:wght@700&display=swap');

        .pub-header {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.3s ease, backdrop-filter 0.3s ease;
        }
        .pub-header.scrolled {
          background: rgba(12,40,28,0.97) !important;
          backdrop-filter: blur(12px);
          border-bottom: 0.5px solid rgba(240,227,199,0.12);
        }
        .nav-link {
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
          color: rgba(240,227,199,0.75); text-decoration: none;
          transition: color 0.2s ease;
        }
        .nav-link:hover { color: #F0E3C7; }
        .header-cta {
          padding: 8px 22px; border-radius: 99px;
          border: 1.5px solid rgba(240,227,199,0.5);
          color: #F0E3C7; background: transparent;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          cursor: pointer; text-decoration: none; display: inline-flex; align-items: center;
          transition: all 0.22s ease;
        }
        .header-cta:hover {
          background: #F0E3C7; color: #0C281C; border-color: #F0E3C7;
        }
        .lang-toggle {
          display: flex; align-items: center; gap: 2px;
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
          background: none; border: none; cursor: pointer;
        }
        .lang-btn {
          padding: 4px 8px; border-radius: 4px;
          color: rgba(240,227,199,0.5); background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
          transition: color 0.2s ease;
        }
        .lang-btn.active { color: #F0E3C7; }
        .lang-btn:hover { color: #F0E3C7; }
        .lang-sep { color: rgba(240,227,199,0.25); font-size: 11px; }

        /* Mobile overlay */
        .mobile-nav-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: #0C281C;
          display: flex; flex-direction: column;
          padding: 24px;
        }
        .mobile-nav-link {
          font-family: 'DM Sans', sans-serif; font-size: 22px; font-weight: 500;
          color: rgba(240,227,199,0.75); text-decoration: none; padding: 14px 0;
          border-bottom: 0.5px solid rgba(240,227,199,0.1);
          transition: color 0.2s ease;
        }
        .mobile-nav-link:hover { color: #F0E3C7; }
      `}</style>

      <ScrollAwareHeader isHome={isHome}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(16px,4vw,48px)', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
          
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png"
              alt={language === 'el' ? "Nature Explorers λογότυπο" : "Nature Explorers logo"}
              style={{ height: '36px', width: 'auto' }}
            />
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '15px', color: '#F0E3C7', lineHeight: 1.2 }}>Nature Explorers</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', color: 'rgba(240,227,199,0.45)', letterSpacing: '0.05em' }}>
                {language === 'el' ? 'Ανακάλυψε την άγρια φύση' : 'Discover the wild side of Greece'}
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '32px', flex: 1, justifyContent: 'center' }} className="hidden-mobile" aria-label="Main navigation">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} className="nav-link">{link.label}</Link>
            ))}
          </nav>

          {/* Desktop Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }} className="hidden-mobile">
            {/* Language toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
              <button className={`lang-btn ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>EN</button>
              <span className="lang-sep">/</span>
              <button className={`lang-btn ${language === 'el' ? 'active' : ''}`} onClick={() => setLanguage('el')}>ΕΛ</button>
            </div>

            <Link to={createPageUrl("Calendar")} className="header-cta">
              {language === 'el' ? 'Δείτε Εκδρομές' : 'Browse Trips'}
            </Link>

            {!user ? (
              <button onClick={handleLogin} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,227,199,0.6)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s ease' }}
                onMouseEnter={e => e.currentTarget.style.color = '#F0E3C7'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,227,199,0.6)'}
              >
                <LogIn size={15} /> {t('common.login')}
              </button>
            ) : (
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,227,199,0.6)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s ease' }}
                onMouseEnter={e => e.currentTarget.style.color = '#F0E3C7'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,227,199,0.6)'}
              >
                <LogOut size={15} /> {t('common.logout')}
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F0E3C7', display: 'none', padding: '8px' }}
            className="show-mobile"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .hidden-mobile { display: none !important; }
            .show-mobile { display: flex !important; }
          }
        `}</style>
      </ScrollAwareHeader>

      {/* Mobile overlay nav */}
      {mobileOpen && (
        <div className="mobile-nav-overlay">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '18px', color: '#F0E3C7' }}>Nature Explorers</div>
            <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F0E3C7' }}>
              <X size={24} />
            </button>
          </div>

          <nav style={{ flex: 1 }}>
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} className="mobile-nav-link" style={{ display: 'block' }} onClick={() => setMobileOpen(false)}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Lang */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setLanguage('en')} style={{ flex: 1, padding: '12px', borderRadius: '99px', border: `1.5px solid rgba(240,227,199,${language === 'en' ? '0.7' : '0.2'})`, background: language === 'en' ? 'rgba(240,227,199,0.1)' : 'transparent', color: language === 'en' ? '#F0E3C7' : 'rgba(240,227,199,0.45)', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', cursor: 'pointer' }}>English</button>
              <button onClick={() => setLanguage('el')} style={{ flex: 1, padding: '12px', borderRadius: '99px', border: `1.5px solid rgba(240,227,199,${language === 'el' ? '0.7' : '0.2'})`, background: language === 'el' ? 'rgba(240,227,199,0.1)' : 'transparent', color: language === 'el' ? '#F0E3C7' : 'rgba(240,227,199,0.45)', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', cursor: 'pointer' }}>Ελληνικά</button>
            </div>

            {!user ? (
              <button onClick={() => { handleLogin(); setMobileOpen(false); }} style={{ padding: '14px', borderRadius: '99px', border: '1.5px solid #F0E3C7', background: '#F0E3C7', color: '#0C281C', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
                {t('common.login')}
              </button>
            ) : (
              <button onClick={() => { handleLogout(); setMobileOpen(false); }} style={{ padding: '14px', borderRadius: '99px', border: '1.5px solid rgba(240,227,199,0.4)', background: 'transparent', color: '#F0E3C7', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', cursor: 'pointer' }}>
                {t('common.logout')}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Scroll-aware wrapper that adds 'scrolled' class
function ScrollAwareHeader({ children, isHome }) {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const bg = isHome
    ? (scrolled ? undefined : 'transparent')
    : '#0C281C';

  return (
    <header
      className={`pub-header${scrolled ? ' scrolled' : ''}`}
      style={{ background: bg }}
    >
      {children}
    </header>
  );
}