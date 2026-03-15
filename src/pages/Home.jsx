import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Calendar, ArrowRight, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { formatDateRange } from '../components/helpers/dateHelpers';
import { useLanguage } from '../components/contexts/LanguageContext';
import { useTranslation } from '../components/translations/useTranslations';
import useSEO from '../components/seo/useSEO';
import StructuredData from '../components/seo/StructuredData';
import { getTripImage, handleImageError } from '../components/helpers/imageHelpers';
import { formatPriceForCard } from '../components/helpers/pricingHelpers';

const difficultyConfig = {
  easy:       { label: 'Easy',        style: 'background:rgba(22,163,74,0.85);color:#f0e3c7;' },
  moderate:   { label: 'Moderate',    style: 'background:rgba(240,227,199,0.9);color:#0c281c;' },
  challenging:{ label: 'Challenging', style: 'background:rgba(217,119,6,0.85);color:#f0e3c7;' },
  difficult:  { label: 'Difficult',   style: 'background:rgba(185,28,28,0.85);color:#f0e3c7;' },
};

// Ticker item separator
const TickerDot = () => (
  <span style={{ color: '#F0E3C7', opacity: 0.5, margin: '0 18px', fontSize: '6px', verticalAlign: 'middle' }}>●</span>
);

function TickerStrip({ trips, language }) {
  const items = trips.slice(0, 20);
  if (!items.length) return null;

  return (
    <div
      style={{ background: '#143522', overflow: 'hidden', padding: '10px 0', borderTop: '0.5px solid rgba(240,227,199,0.15)', borderBottom: '0.5px solid rgba(240,227,199,0.15)' }}
    >
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-inner {
          display: inline-flex;
          animation: ticker-scroll 40s linear infinite;
          white-space: nowrap;
        }
        .ticker-inner:hover { animation-play-state: paused; }
      `}</style>
      <div className="ticker-inner">
        {[...items, ...items].map((trip, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', letterSpacing: '0.03em', color: '#F0E3C7', opacity: 0.85 }}>
            <Link to={`${createPageUrl("TripDetails")}?id=${trip.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              {trip.title}
              {trip.start_date && (
                <span style={{ opacity: 0.55, marginLeft: '6px' }}>
                  {format(new Date(trip.start_date), 'd MMM')}
                </span>
              )}
            </Link>
            <TickerDot />
          </span>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const navigate = useNavigate();

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

  const { data: allTrips = [] } = useQuery({
    queryKey: ['home-all-trips'],
    queryFn: () => base44.entities.HikingTrip.list('-start_date', 200),
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['home-users-count'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: organizers = [] } = useQuery({
    queryKey: ['home-organizers'],
    queryFn: () => base44.entities.Organizer.list(),
    initialData: [],
  });

  const organizerMap = React.useMemo(() => {
    const map = {};
    organizers.forEach(org => { map[org.organizer_code] = org; });
    return map;
  }, [organizers]);

  const today = React.useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }, []);

  const upcomingTrips = React.useMemo(() =>
    allTrips.filter(trip => {
      if (!trip.start_date) return false;
      const d = new Date(trip.start_date); d.setHours(0, 0, 0, 0);
      return d >= today && (trip.status === 'upcoming' || trip.status === 'almost soldout');
    }),
    [allTrips, today]
  );

  const featuredExpeditions = React.useMemo(() => {
    const sorted = [...upcomingTrips].sort((a, b) => a.id.localeCompare(b.id));
    return sorted.slice(0, 3);
  }, [upcomingTrips]);

  const tickerTrips = React.useMemo(() =>
    upcomingTrips.slice(0, 20),
    [upcomingTrips]
  );

  // Structured data (unchanged from original)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "TouristInformationCenter",
    "name": "Nature Explorers",
    "alternateName": language === 'el' ? "Nature Explorers - Πεζοπορία Ελλάδα" : "Nature Explorers Greece - Hiking & Trekking",
    "url": window.location.origin,
    "logo": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png",
    "description": language === 'el'
      ? "Η #1 πλατφόρμα για οργανωμένες εκδρομές και ομαδικές εκδρομές πεζοπορίας στην Ελλάδα."
      : "The #1 platform for organized hiking trips and group expeditions in Greece.",
    "sameAs": ["https://www.facebook.com/natureexplorersgr/", "https://www.instagram.com/natureexplorers.gr/"],
    "contactPoint": { "@type": "ContactPoint", "email": "natureexplorersgr@gmail.com", "contactType": "Customer Service", "areaServed": "GR", "availableLanguage": ["en", "el"] },
    "areaServed": { "@type": "Country", "name": "Greece" },
    "address": { "@type": "PostalAddress", "addressCountry": "GR" },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Nature Explorers",
    "url": window.location.origin,
    "potentialAction": { "@type": "SearchAction", "target": { "@type": "EntryPoint", "urlTemplate": `${window.location.origin}${createPageUrl("Calendar")}?search={search_term_string}` }, "query-input": "required name=search_term_string" },
    "inLanguage": ["en", "el"],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": language === 'el' ? [
      { "@type": "Question", "name": "Πού μπορώ να βρω οργανωμένες εκδρομές πεζοπορίας στην Ελλάδα;", "acceptedAnswer": { "@type": "Answer", "text": "Στο Nature Explorers θα βρείτε τις καλύτερες οργανωμένες εκδρομές και ομαδικές εκδρομές πεζοπορίας σε όλη την Ελλάδα με πιστοποιημένους οδηγούς." } },
      { "@type": "Question", "name": "Πώς μπορώ να συμμετέχω σε ομαδικές εκδρομές πεζοπορίας;", "acceptedAnswer": { "@type": "Answer", "text": "Εγγραφείτε στο Nature Explorers, περιηγηθείτε στις διαθέσιμες εκδρομές στο ημερολόγιο, επιλέξτε και κάντε κράτηση." } },
    ] : [
      { "@type": "Question", "name": "Where can I find organized hiking trips in Greece?", "acceptedAnswer": { "@type": "Answer", "text": "At Nature Explorers you'll find the best organized hiking trips and group expeditions across Greece with certified guides." } },
      { "@type": "Question", "name": "How can I join group hiking expeditions?", "acceptedAnswer": { "@type": "Answer", "text": "Sign up at Nature Explorers, browse available trips in our calendar, select the expedition and make a booking." } },
    ]
  };

  const isEl = language === 'el';

  return (
    <>
      <StructuredData data={organizationSchema} />
      <StructuredData data={websiteSchema} />
      <StructuredData data={faqSchema} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .home-root { font-family: 'DM Sans', sans-serif; background: #0C281C; color: #F0E3C7; }
        .serif { font-family: 'Playfair Display', serif; }
        .serif-italic { font-family: 'Playfair Display', serif; font-style: italic; }

        .pill-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 28px; border-radius: 99px; font-family: 'DM Sans', sans-serif;
          font-weight: 500; font-size: 15px; cursor: pointer; text-decoration: none;
          transition: all 0.22s ease; border: 1.5px solid;
        }
        .pill-btn-primary {
          background: #F0E3C7; color: #0C281C; border-color: #F0E3C7;
        }
        .pill-btn-primary:hover { background: #e6d5b4; border-color: #e6d5b4; }
        .pill-btn-ghost {
          background: transparent; color: #F0E3C7; border-color: rgba(240,227,199,0.45);
        }
        .pill-btn-ghost:hover { background: rgba(240,227,199,0.1); border-color: rgba(240,227,199,0.7); }

        .expedition-card {
          background: #143522;
          border: 0.5px solid rgba(240,227,199,0.18);
          border-radius: 12px;
          overflow: hidden;
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
          display: flex; flex-direction: column;
        }
        .expedition-card:hover {
          transform: translateY(-3px);
          border-color: rgba(240,227,199,0.45);
          box-shadow: 0 12px 40px rgba(0,0,0,0.4);
        }
        .expedition-card:hover .card-img img {
          transform: scale(1.04);
        }
        .card-img { overflow: hidden; position: relative; }
        .card-img img { transition: transform 0.35s ease; width: 100%; height: 100%; object-fit: cover; }

        .difficulty-badge {
          position: absolute; top: 12px; left: 12px;
          padding: 3px 10px; border-radius: 99px;
          font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600;
          letter-spacing: 0.02em; text-transform: uppercase;
        }
        .stat-item { text-align: right; }
        .stat-number { font-family: 'Playfair Display', serif; font-size: clamp(2.2rem, 4vw, 3rem); font-weight: 700; color: #F0E3C7; line-height: 1.05; }
        .stat-label { font-family: 'DM Sans', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(240,227,199,0.55); margin-top: 2px; }
      `}</style>

      <div className="home-root">

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section style={{ position: 'relative', minHeight: '92vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
          {/* Background image */}
          <img
            src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=1920&q=80&fm=webp"
            srcSet="https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&q=80&fm=webp 800w, https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=1400&q=80&fm=webp 1400w, https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=1920&q=80&fm=webp 1920w"
            sizes="100vw"
            alt={isEl ? "Πεζοπορία στα ελληνικά βουνά - οργανωμένες εκδρομές" : "Hiking in Greek mountains - organized expeditions"}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.55) saturate(0.75)' }}
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            width="1920"
            height="1280"
          />
          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(12,40,28,0.6) 65%, #0C281C 100%)' }} />

          {/* Hero content — bottom-left */}
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: 'clamp(32px,6vw,80px)', paddingBottom: 'clamp(48px,8vw,96px)', gap: '32px', flexWrap: 'wrap' }}>
            {/* Left text block */}
            <div style={{ maxWidth: '640px', flex: '1 1 340px' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(240,227,199,0.65)', marginBottom: '16px', fontWeight: 500 }}>
                {isEl ? 'Οργανωμένες Αποστολές' : 'Organized Expeditions'}
              </p>
              <h1 className="serif" style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', fontWeight: 700, color: '#F0E3C7', lineHeight: 1.1, marginBottom: '20px' }}>
                {isEl ? (
                  <>Πεζοπορήστε στην <span className="serif-italic">άγρια</span> Ελλάδα</>
                ) : (
                  <>Hike the <span className="serif-italic">wild</span> side of Greece</>
                )}
              </h1>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(15px,2vw,18px)', color: 'rgba(240,227,199,0.78)', lineHeight: 1.65, marginBottom: '32px', maxWidth: '500px' }}>
                {isEl
                  ? 'Ομαδικές αποστολές, trekking και ορεινές περιπέτειες με έμπειρους οδηγούς — Βρείτε την επόμενη περιπέτειά σας!'
                  : 'Group expeditions, trekking and mountain adventures with expert guides — Find your next adventure!'}
              </p>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <Link to={createPageUrl("Calendar")} className="pill-btn pill-btn-primary">
                  {isEl ? 'Δείτε Εκδρομές' : 'Browse Expeditions'}
                </Link>
                <Link to={createPageUrl("OrganizersList")} className="pill-btn pill-btn-ghost">
                  {isEl ? 'Γνωρίστε τους Οδηγούς' : 'Meet Organizers'}
                </Link>
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(240,227,199,0.45)', letterSpacing: '0.02em' }}>
                {isEl ? 'Εγγραφείτε δωρεάν και ξεκινήστε την επόμενη outdoor περιπέτειά σας σήμερα!' : 'Sign up free and start your next outdoor adventure today!'}
              </p>
            </div>

            {/* Right stats block */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '8px', flex: '0 0 auto' }}>
              <div className="stat-item">
                <div className="stat-number">{upcomingTrips.length}+</div>
                <div className="stat-label">{isEl ? 'Επερχόμενες Εκδρομές' : 'Upcoming Trips'}</div>
              </div>
              <div className="stat-item" style={{ borderTop: '0.5px solid rgba(240,227,199,0.15)', paddingTop: '24px' }}>
                <div className="stat-number">{users.length > 0 ? `${users.length}+` : '—'}</div>
                <div className="stat-label">{isEl ? 'Ευτυχισμένοι Πεζοπόροι' : 'Happy Hikers'}</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TICKER ───────────────────────────────────────────────────────── */}
        {tickerTrips.length > 0 && <TickerStrip trips={tickerTrips} language={language} />}

        {/* ── FEATURED EXPEDITIONS ─────────────────────────────────────────── */}
        {featuredExpeditions.length > 0 && (
          <section style={{ padding: 'clamp(56px,8vw,96px) clamp(20px,5vw,80px)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              {/* Section header */}
              <div style={{ marginBottom: '48px' }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(240,227,199,0.45)', marginBottom: '10px' }}>
                  {isEl ? 'Επιλεγμένα για σένα' : 'Hand-picked for you'}
                </p>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <h2 className="serif" style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 700, color: '#F0E3C7', margin: 0 }}>
                    {isEl ? 'Επιλεγμένες Εκδρομές' : 'Featured Expeditions'}
                  </h2>
                  <Link to={createPageUrl("Calendar")} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'rgba(240,227,199,0.6)', textDecoration: 'none', transition: 'color 0.2s ease' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#F0E3C7'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,227,199,0.6)'}
                  >
                    {isEl ? 'Δείτε όλες' : 'View all'} <ArrowRight size={15} />
                  </Link>
                </div>
              </div>

              {/* Cards grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {featuredExpeditions.map(trip => {
                  const organizer = organizerMap[trip.organizer_code];
                  const diff = difficultyConfig[trip.difficulty] || difficultyConfig.moderate;
                  return (
                    <div key={trip.id} className="expedition-card">
                      {/* Image */}
                      <div className="card-img" style={{ height: '220px' }}>
                        <img
                          src={getTripImage(trip.image_url, trip.id)}
                          alt={trip.title}
                          onError={(e) => handleImageError(e, trip.id)}
                        />
                        <span className="difficulty-badge" style={diff.style}>
                          {trip.difficulty}
                        </span>
                      </div>

                      {/* Content */}
                      <div style={{ padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', flex: 1, gap: '12px' }}>
                        <h3 className="serif" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F0E3C7', margin: 0, lineHeight: 1.3 }}>
                          {trip.title}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(240,227,199,0.6)' }}>
                            <MapPin size={13} style={{ flexShrink: 0 }} />
                            <span>{trip.location}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(240,227,199,0.6)' }}>
                            <Calendar size={13} style={{ flexShrink: 0 }} />
                            <span>{formatDateRange(trip.start_date, trip.end_date)}</span>
                          </div>
                        </div>

                        {/* Footer row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '14px', borderTop: '0.5px solid rgba(240,227,199,0.12)' }}>
                          <span className="serif" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F0E3C7' }}>
                            {formatPriceForCard(trip, language)}
                          </span>
                          <Link
                            to={`${createPageUrl("TripDetails")}?id=${trip.id}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 500, color: 'rgba(240,227,199,0.65)', textDecoration: 'none', transition: 'color 0.2s ease' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#F0E3C7'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,227,199,0.65)'}
                          >
                            {isEl ? 'Λεπτομέρειες' : 'Details'} <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}