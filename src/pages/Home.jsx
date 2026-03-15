import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Calendar, Menu, Globe, LogIn, LogOut, Instagram, Facebook, Mail, Compass, Home, Info, Users } from 'lucide-react';
import { useLanguage } from '../components/contexts/LanguageContext';
import { useTranslation } from '../components/translations/useTranslations';
import useSEO from '../components/seo/useSEO';
import StructuredData from '../components/seo/StructuredData';
import { getTripImage, handleImageError } from '../components/helpers/imageHelpers';
import { formatPriceForCard } from '../components/helpers/pricingHelpers';
import { formatDateRange } from '../components/helpers/dateHelpers';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

// Google Fonts injection
const fontsLoaded = { current: false };
if (!fontsLoaded.current && typeof document !== 'undefined') {
  fontsLoaded.current = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap';
  document.head.appendChild(link);
}

const C = {
  bg: '#0C281C',
  bgDeep: '#070f0b',
  bgCard: '#143522',
  cream: '#F0E3C7',
  creamMuted: 'rgba(240,227,199,0.6)',
  creamDim: 'rgba(240,227,199,0.18)',
  creamBorder: 'rgba(240,227,199,0.18)',
};

const difficultyConfig = {
  easy: { label: 'Easy', style: { background: 'rgba(34,197,94,0.2)', color: '#86efac', border: '0.5px solid rgba(134,239,172,0.4)' } },
  moderate: { label: 'Moderate', style: { background: 'rgba(240,227,199,0.15)', color: C.cream, border: `0.5px solid ${C.creamBorder}` } },
  challenging: { label: 'Challenging', style: { background: 'rgba(251,191,36,0.2)', color: '#fde68a', border: '0.5px solid rgba(253,230,138,0.4)' } },
  difficult: { label: 'Difficult', style: { background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '0.5px solid rgba(252,165,165,0.4)' } },
};

function NavBar({ language, setLanguage, user, onLogin, onLogout }) {
  const [open, setOpen] = React.useState(false);
  const { t } = useTranslation(language);

  const navLinks = [
    { to: createPageUrl('Calendar'), label: language === 'el' ? 'Ημερολόγιο' : 'Calendar' },
    { to: createPageUrl('OrganizersList'), label: language === 'el' ? 'Διοργανωτές' : 'Organizers' },
    { to: createPageUrl('Guides'), label: language === 'el' ? 'Ξεναγοί' : 'Guides' },
    { to: createPageUrl('GreekRefuges'), label: language === 'el' ? 'Καταφύγια' : 'Refuges' },
    { to: '/About', label: language === 'el' ? 'Σχετικά' : 'About' },
  ];

  return (
    <header style={{ background: 'rgba(12,40,28,0.92)', backdropFilter: 'blur(12px)', borderBottom: `0.5px solid ${C.creamBorder}`, fontFamily: "'DM Sans', sans-serif" }} className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 flex-shrink-0">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png"
            alt="Nature Explorers logo"
            className="h-9 w-auto"
          />
          <div>
            <div style={{ color: C.cream, fontWeight: 600, fontSize: '1rem', lineHeight: 1.2 }}>Nature Explorers</div>
            <div style={{ color: C.creamMuted, fontSize: '0.65rem', letterSpacing: '0.05em' }}>{language === 'el' ? 'Ανακάλυψε την άγρια Ελλάδα' : 'Discover the wild side of Greece'}</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7 flex-1 justify-center">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} style={{ color: C.creamMuted, fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = C.cream}
              onMouseLeave={e => e.target.style.color = C.creamMuted}>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setLanguage(language === 'en' ? 'el' : 'en')}
            style={{ color: C.creamMuted, fontSize: '0.8rem', fontWeight: 500, background: C.creamDim, border: `0.5px solid ${C.creamBorder}`, borderRadius: '99px', padding: '4px 12px', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.target.style.color = C.cream; e.target.style.background = 'rgba(240,227,199,0.25)'; }}
            onMouseLeave={e => { e.target.style.color = C.creamMuted; e.target.style.background = C.creamDim; }}
          >
            {language === 'en' ? 'EN / ΕΛ' : 'ΕΛ / EN'}
          </button>

          {!user ? (
            <button onClick={onLogin}
              style={{ color: C.creamMuted, fontSize: '0.85rem', background: 'transparent', border: `0.5px solid ${C.creamBorder}`, borderRadius: '99px', padding: '6px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = C.cream; e.currentTarget.style.borderColor = C.cream; }}
              onMouseLeave={e => { e.currentTarget.style.color = C.creamMuted; e.currentTarget.style.borderColor = C.creamBorder; }}>
              <LogIn size={14} />{language === 'el' ? 'Σύνδεση' : 'Login'}
            </button>
          ) : (
            <button onClick={onLogout}
              style={{ color: C.creamMuted, fontSize: '0.85rem', background: 'transparent', border: `0.5px solid ${C.creamBorder}`, borderRadius: '99px', padding: '6px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = C.cream; e.currentTarget.style.borderColor = C.cream; }}
              onMouseLeave={e => { e.currentTarget.style.color = C.creamMuted; e.currentTarget.style.borderColor = C.creamBorder; }}>
              <LogOut size={14} />{language === 'el' ? 'Αποσύνδεση' : 'Logout'}
            </button>
          )}

          <Link to={createPageUrl('Calendar')}
            style={{ color: C.bg, background: C.cream, borderRadius: '99px', padding: '7px 20px', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s', display: 'inline-block' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.cream; }}>
            {language === 'el' ? 'Εξερεύνηση' : 'Browse Trips'}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button style={{ color: C.cream, background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <Menu size={24} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" style={{ background: C.bg, borderLeft: `0.5px solid ${C.creamBorder}`, fontFamily: "'DM Sans', sans-serif" }}>
              <div className="flex flex-col gap-6 mt-8">
                {navLinks.map(link => (
                  <Link key={link.to} to={link.to} onClick={() => setOpen(false)}
                    style={{ color: C.creamMuted, fontSize: '1.1rem', textDecoration: 'none' }}>
                    {link.label}
                  </Link>
                ))}
                <div style={{ borderTop: `0.5px solid ${C.creamBorder}`, paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button onClick={() => setLanguage(language === 'en' ? 'el' : 'en')}
                    style={{ color: C.creamMuted, background: C.creamDim, border: `0.5px solid ${C.creamBorder}`, borderRadius: '99px', padding: '8px 16px', cursor: 'pointer', fontSize: '0.9rem' }}>
                    {language === 'en' ? 'Switch to Ελληνικά' : 'Switch to English'}
                  </button>
                  {!user ? (
                    <button onClick={onLogin} style={{ color: C.bg, background: C.cream, border: 'none', borderRadius: '99px', padding: '10px 16px', cursor: 'pointer', fontWeight: 600 }}>
                      {language === 'el' ? 'Σύνδεση' : 'Login'}
                    </button>
                  ) : (
                    <button onClick={onLogout} style={{ color: C.creamMuted, background: 'transparent', border: `0.5px solid ${C.creamBorder}`, borderRadius: '99px', padding: '10px 16px', cursor: 'pointer' }}>
                      {language === 'el' ? 'Αποσύνδεση' : 'Logout'}
                    </button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function TickerStrip({ trips, language }) {
  const items = trips.length > 0
    ? trips.slice(0, 12).map(t => t.title)
    : ['Upcoming trips loading...'];

  const repeated = [...items, ...items, ...items];

  return (
    <div style={{ background: '#143522', borderTop: `0.5px solid ${C.creamBorder}`, borderBottom: `0.5px solid ${C.creamBorder}`, overflow: 'hidden', fontFamily: "'DM Sans', sans-serif", padding: '10px 0' }}>
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-33.333%); }
        }
        .ticker-inner {
          display: flex;
          animation: ticker 40s linear infinite;
          width: max-content;
          white-space: nowrap;
        }
        .ticker-inner:hover { animation-play-state: paused; }
      `}</style>
      <div className="ticker-inner">
        {repeated.map((item, i) => (
          <span key={i} style={{ color: C.creamMuted, fontSize: '0.8rem', letterSpacing: '0.04em', padding: '0 2rem', display: 'inline-flex', alignItems: 'center', gap: '1rem' }}>
            {item}
            <span style={{ color: C.creamDim, fontSize: '0.6rem' }}>●</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function TripCard({ trip, language }) {
  const [hovered, setHovered] = React.useState(false);
  const diff = difficultyConfig[trip.difficulty] || difficultyConfig.moderate;

  return (
    <Link to={`${createPageUrl('TripDetails')}?id=${trip.id}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: C.bgCard,
          border: `0.5px solid ${hovered ? 'rgba(240,227,199,0.45)' : C.creamBorder}`,
          borderRadius: '12px',
          overflow: 'hidden',
          transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
          transition: 'all 0.25s ease',
          boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.5)' : '0 2px 12px rgba(0,0,0,0.3)',
          fontFamily: "'DM Sans', sans-serif",
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', overflow: 'hidden', height: '220px' }}>
          <img
            src={getTripImage(trip.image_url, trip.id)}
            alt={trip.title}
            onError={(e) => handleImageError(e, trip.id)}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              filter: hovered ? 'brightness(0.75)' : 'brightness(0.85)',
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
              transition: 'all 0.4s ease',
            }}
          />
          <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
            <span style={{ ...diff.style, borderRadius: '99px', padding: '3px 10px', fontSize: '0.72rem', fontWeight: 500 }}>
              {language === 'el' ? (
                { easy: 'Εύκολο', moderate: 'Μέτριο', challenging: 'Απαιτητικό', difficult: 'Δύσκολο' }[trip.difficulty] || diff.label
              ) : diff.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ color: C.cream, fontFamily: "'Playfair Display', serif", fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.3, margin: 0 }}>
            {trip.title}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: C.creamMuted, fontSize: '0.82rem' }}>
              <MapPin size={13} style={{ flexShrink: 0 }} />
              <span>{trip.location}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: C.creamMuted, fontSize: '0.82rem' }}>
              <Calendar size={13} style={{ flexShrink: 0 }} />
              <span>{formatDateRange(trip.start_date, trip.end_date)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: `0.5px solid ${C.creamBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: C.cream, fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700 }}>
            {formatPriceForCard(trip, language)}
          </span>
          <span style={{ color: C.creamMuted, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px', transition: 'color 0.2s', ...(hovered && { color: C.cream }) }}>
            {language === 'el' ? 'Λεπτομέρειες' : 'Details'} →
          </span>
        </div>
      </div>
    </Link>
  );
}

function DarkFooter({ language }) {
  return (
    <footer style={{ background: C.bgDeep, borderTop: `0.5px solid ${C.creamBorder}`, fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png"
              alt="Nature Explorers logo"
              className="h-7 w-auto"
              style={{ filter: 'brightness(0.9)' }}
            />
            <span style={{ color: C.creamMuted, fontWeight: 600, fontSize: '0.95rem' }}>Nature Explorers</span>
          </div>

          <p style={{ color: 'rgba(240,227,199,0.35)', fontSize: '0.8rem' }}>
            © {new Date().getFullYear()} Nature Explorers. All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            {[
              { href: 'https://www.instagram.com/natureexplorers.gr/', icon: Instagram, label: 'Instagram' },
              { href: 'https://www.facebook.com/natureexplorersgr/', icon: Facebook, label: 'Facebook' },
              { href: 'mailto:natureexplorersgr@gmail.com', icon: Mail, label: 'Email' },
            ].map(({ href, icon: Icon, label }) => (
              <a key={label} href={href} target={href.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer" aria-label={label}
                style={{ width: '34px', height: '34px', borderRadius: '50%', border: `0.5px solid ${C.creamBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.creamMuted, transition: 'all 0.2s', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.color = C.cream; e.currentTarget.style.borderColor = C.cream; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.creamMuted; e.currentTarget.style.borderColor = C.creamBorder; }}>
                <Icon size={15} />
              </a>
            ))}
            <Link to="/About" style={{ color: C.creamMuted, fontSize: '0.82rem', textDecoration: 'none', marginLeft: '4px', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = C.cream}
              onMouseLeave={e => e.target.style.color = C.creamMuted}>
              {language === 'el' ? 'Σχετικά' : 'About'}
            </Link>
            <Link to={createPageUrl('TermsOfUse')} style={{ color: C.creamMuted, fontSize: '0.82rem', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = C.cream}
              onMouseLeave={e => e.target.style.color = C.creamMuted}>
              {language === 'el' ? 'Όροι Χρήσης' : 'Terms of Use'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation(language);

  React.useEffect(() => {
    const path = window.location.pathname;
    if (path === '/Home' || path === '/home') {
      window.location.replace('/');
    }
  }, []);

  useSEO({
    title: language === 'el'
      ? 'Πεζοπορία Ελλάδα | Οργανωμένες Εκδρομές | Ομαδικές Εκδρομές | Nature Explorers'
      : 'Hiking Greece | Trekking Greece | Organized Hiking Trips | Nature Explorers',
    description: language === 'el'
      ? 'Οι καλύτερες οργανωμένες εκδρομές και ομαδικές εκδρομές πεζοπορίας στην Ελλάδα. Ταξίδια πεζοπορίας, trekking, ορειβασία σε Πάρνηθα, Όλυμπο, Πήλιο με έμπειρους οδηγούς. Βρείτε ομάδες πεζοπορίας και κρατήστε θέση σε εκδρομές βουνού. Nature Explorers - Η #1 πλατφόρμα outdoor περιπετειών.'
      : 'Best organized hiking trips and group expeditions in Greece. Hiking tours, trekking adventures, mountain climbing in Parnitha, Olympus, Pelion with expert guides. Find hiking groups and book hiking trips. Nature Explorers - #1 outdoor adventure platform.',
    image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png',
    url: window.location.href,
    type: 'website'
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => { try { return await base44.auth.me(); } catch { return null; } },
    retry: false,
  });

  const { data: allTrips = [] } = useQuery({
    queryKey: ['featured-expeditions'],
    queryFn: async () => {
      const trips = await base44.entities.HikingTrip.list('-start_date', 100);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return trips.filter(trip => {
        if (!trip.start_date) return false;
        const startDate = new Date(trip.start_date); startDate.setHours(0, 0, 0, 0);
        return startDate > today && (trip.status === 'upcoming' || trip.status === 'almost soldout');
      });
    },
    initialData: [],
  });

  const featuredExpeditions = React.useMemo(() => {
    // Prefer promoted trips, then stable-shuffle the rest
    const promoted = allTrips.filter(t => t.is_promoted);
    const rest = allTrips.filter(t => !t.is_promoted).sort((a, b) => a.id.localeCompare(b.id));
    return [...promoted, ...rest].slice(0, 3);
  }, [allTrips]);

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "TouristInformationCenter",
    "name": "Nature Explorers",
    "url": window.location.origin,
    "logo": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png",
    "description": language === 'el'
      ? "Η #1 πλατφόρμα για οργανωμένες εκδρομές πεζοπορίας στην Ελλάδα."
      : "The #1 platform for organized hiking trips and group expeditions in Greece.",
    "sameAs": ["https://www.facebook.com/natureexplorersgr/", "https://www.instagram.com/natureexplorers.gr/"],
    "contactPoint": { "@type": "ContactPoint", "email": "natureexplorersgr@gmail.com", "contactType": "Customer Service", "areaServed": "GR" },
    "areaServed": { "@type": "Country", "name": "Greece" },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Nature Explorers",
    "url": window.location.origin,
    "potentialAction": {
      "@type": "SearchAction",
      "target": { "@type": "EntryPoint", "urlTemplate": `${window.location.origin}${createPageUrl("Calendar")}?search={search_term_string}` },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": ["en", "el"],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": language === 'el' ? [
      { "@type": "Question", "name": "Πού μπορώ να βρω οργανωμένες εκδρομές πεζοπορίας στην Ελλάδα;", "acceptedAnswer": { "@type": "Answer", "text": "Στο Nature Explorers θα βρείτε τις καλύτερες οργανωμένες εκδρομές και ομαδικές εκδρομές πεζοπορίας σε όλη την Ελλάδα με πιστοποιημένους οδηγούς." } },
      { "@type": "Question", "name": "Πώς μπορώ να συμμετέχω σε ομαδικές εκδρομές πεζοπορίας;", "acceptedAnswer": { "@type": "Answer", "text": "Εγγραφείτε στο Nature Explorers, περιηγηθείτε στις διαθέσιμες εκδρομές και κάντε κράτηση." } },
    ] : [
      { "@type": "Question", "name": "Where can I find organized hiking trips in Greece?", "acceptedAnswer": { "@type": "Answer", "text": "At Nature Explorers you'll find the best organized hiking trips and group expeditions across Greece with certified guides." } },
      { "@type": "Question", "name": "How can I join group hiking expeditions?", "acceptedAnswer": { "@type": "Answer", "text": "Sign up at Nature Explorers, browse available trips in our calendar, select the expedition that interests you and make a booking." } },
    ]
  };

  const handleLogin = () => base44.auth.redirectToLogin(window.location.pathname);
  const handleLogout = () => base44.auth.logout(createPageUrl('Home'));

  return (
    <>
      <StructuredData data={organizationSchema} />
      <StructuredData data={websiteSchema} />
      <StructuredData data={faqSchema} />

      <style>{`
        .home-page { font-family: 'DM Sans', sans-serif; background: ${C.bg}; min-height: 100vh; }
        .hero-headline { font-family: 'Playfair Display', serif; }
        .serif { font-family: 'Playfair Display', serif; }
      `}</style>

      <div className="home-page" style={{ background: C.bg }}>
        <NavBar language={language} setLanguage={setLanguage} user={user} onLogin={handleLogin} onLogout={handleLogout} />

        {/* ── HERO ── */}
        <section style={{ position: 'relative', minHeight: '90vh', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
          <img
            src="https://images.unsplash.com/photo-1551632811-561732d1e306?w=1920&q=80&fm=webp"
            srcSet="https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80&fm=webp 800w, https://images.unsplash.com/photo-1551632811-561732d1e306?w=1400&q=80&fm=webp 1400w, https://images.unsplash.com/photo-1551632811-561732d1e306?w=1920&q=80&fm=webp 1920w"
            sizes="100vw"
            alt={language === 'el' ? 'Πεζοπορία στα ελληνικά βουνά - ομαδικές εκδρομές' : 'Hiking in Greek mountains - group expeditions trekking Greece'}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5) saturate(0.7)' }}
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            width="1920" height="1280"
          />
          {/* Gradient overlay — dark at bottom */}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${C.bg} 0%, rgba(12,40,28,0.6) 50%, transparent 100%)` }} />

          {/* Hero content — bottom left */}
          <div style={{ position: 'relative', zIndex: 10, maxWidth: '700px', padding: '0 5vw 6vw' }}>
            <p style={{ color: C.creamMuted, fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
              {language === 'el' ? 'Οργανωμένες Αποστολές' : 'Organized Expeditions'}
            </p>

            <h1 className="hero-headline" style={{ color: C.cream, fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)', fontWeight: 700, lineHeight: 1.1, marginBottom: '20px' }}>
              {language === 'el' ? (
                <>Πεζοπορία στην <em style={{ fontStyle: 'italic' }}>άγρια</em> Ελλάδα</>
              ) : (
                <>Hike the <em style={{ fontStyle: 'italic' }}>wild</em> side of Greece</>
              )}
            </h1>

            <p style={{ color: C.creamMuted, fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)', lineHeight: 1.65, marginBottom: '32px', maxWidth: '560px', fontFamily: "'DM Sans', sans-serif" }}>
              {language === 'el'
                ? 'Ομαδικές αποστολές, trekking και ορεινές περιπέτειες με έμπειρους οδηγούς — Βρείτε την επόμενη περιπέτειά σας!'
                : 'Group expeditions, trekking and mountain adventures with expert guides — Find your next adventure!'}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <Link to={createPageUrl('Calendar')}
                style={{ background: C.cream, color: C.bg, borderRadius: '99px', padding: '12px 28px', fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', display: 'inline-block' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff'}
                onMouseLeave={e => e.currentTarget.style.background = C.cream}>
                {language === 'el' ? 'Εξερεύνηση Εκδρομών' : 'Browse Expeditions'}
              </Link>
              <Link to={createPageUrl('OrganizersList')}
                style={{ color: C.cream, background: 'transparent', border: `1.5px solid rgba(240,227,199,0.5)`, borderRadius: '99px', padding: '12px 28px', fontWeight: 500, fontSize: '0.95rem', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', display: 'inline-block' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.cream; e.currentTarget.style.background = C.creamDim; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(240,227,199,0.5)'; e.currentTarget.style.background = 'transparent'; }}>
                {language === 'el' ? 'Γνώρισε τους Διοργανωτές' : 'Meet Organizers'}
              </Link>
            </div>

            <p style={{ color: 'rgba(240,227,199,0.4)', fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif" }}>
              {language === 'el' ? 'Εγγραφή δωρεάν — ξεκινήστε την επόμενη outdoor περιπέτειά σας σήμερα!' : 'Sign up free and start your next outdoor adventure today!'}
            </p>
          </div>

          {/* Bottom-right stats */}
          <div style={{ position: 'absolute', bottom: '5vw', right: '5vw', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-end' }} className="hidden md:flex">
            {[
              { value: '120+', label: language === 'el' ? 'Ενεργές εκδρομές' : 'Active trips' },
              { value: '48', label: language === 'el' ? 'Έμπειροι οδηγοί' : 'Expert guides' },
              { value: '9k+', label: language === 'el' ? 'Ευτυχισμένοι πεζοπόροι' : 'Happy hikers' },
            ].map(stat => (
              <div key={stat.value} style={{ textAlign: 'right' }}>
                <div className="serif" style={{ color: C.cream, fontSize: '1.9rem', fontWeight: 700, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ color: C.creamMuted, fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px', fontFamily: "'DM Sans', sans-serif" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── TICKER ── */}
        <TickerStrip trips={allTrips} language={language} />

        {/* ── FEATURED EXPEDITIONS ── */}
        {featuredExpeditions.length > 0 && (
          <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 5vw', background: C.bg }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <p style={{ color: C.creamMuted, fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '10px', fontFamily: "'DM Sans', sans-serif" }}>
                {language === 'el' ? 'Επιλεγμένες για εσάς' : 'Hand-picked for you'}
              </p>
              <h2 className="serif" style={{ color: C.cream, fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 700, marginBottom: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.2 }}>
                {language === 'el' ? 'Επιλεγμένες Εκδρομές' : 'Featured Expeditions'}
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {featuredExpeditions.map(trip => (
                  <TripCard key={trip.id} trip={trip} language={language} />
                ))}
              </div>

              <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                <Link to={createPageUrl('Calendar')}
                  style={{ color: C.creamMuted, border: `0.5px solid ${C.creamBorder}`, borderRadius: '99px', padding: '10px 28px', fontSize: '0.88rem', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', display: 'inline-block' }}
                  onMouseEnter={e => { e.currentTarget.style.color = C.cream; e.currentTarget.style.borderColor = C.cream; }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.creamMuted; e.currentTarget.style.borderColor = C.creamBorder; }}>
                  {language === 'el' ? 'Δες όλες τις εκδρομές →' : 'View all expeditions →'}
                </Link>
              </div>
            </div>
          </section>
        )}

        <DarkFooter language={language} />
      </div>
    </>
  );
}