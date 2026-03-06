import React, { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, Calendar, Mountain } from "lucide-react";
import { format } from "date-fns";
import { formatPriceForCard } from "../helpers/pricingHelpers";
import { useLanguage } from "../contexts/LanguageContext";

// Fix Leaflet default marker icons broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const difficultyColors = {
  easy: "#16a34a",
  moderate: "#ca8a04",
  challenging: "#ea580c",
  difficult: "#dc2626",
};

function createColoredIcon(color) {
  return L.divIcon({
    html: `<div style="
      width: 28px; height: 28px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
    className: "",
  });
}

// Cache geocoded results in memory for session
const geocodeCache = {};

async function geocodeLocation(location) {
  if (!location) return null;
  const key = location.toLowerCase().trim();
  if (geocodeCache[key]) return geocodeCache[key];

  // Bias results towards Greece
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location + ", Greece")}&limit=1&accept-language=el,en`;

  const res = await fetch(url, {
    headers: { "User-Agent": "NatureExplorers/1.0 (hiking-app)" },
  });
  const data = await res.json();
  if (data && data.length > 0) {
    const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    geocodeCache[key] = coords;
    return coords;
  }
  geocodeCache[key] = null;
  return null;
}

export default function TripsMap({ trips, organizerMap }) {
  const { language } = useLanguage();
  const [geoTrips, setGeoTrips] = useState([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodedCount, setGeocodedCount] = useState(0);

  // Deduplicate locations so we only geocode each unique location once
  const uniqueLocations = useMemo(() => {
    const seen = new Set();
    return trips.filter(t => t.location && !seen.has(t.location) && seen.add(t.location));
  }, [trips]);

  useEffect(() => {
    if (trips.length === 0) return;

    setIsGeocoding(true);
    setGeocodedCount(0);

    let cancelled = false;

    async function geocodeAll() {
      const locationCoordMap = {};

      // Geocode unique locations sequentially (rate-limit Nominatim: max 1 req/sec)
      for (const trip of uniqueLocations) {
        if (cancelled) return;
        const coords = await geocodeLocation(trip.location);
        locationCoordMap[trip.location] = coords;
        setGeocodedCount(prev => prev + 1);
        await new Promise(r => setTimeout(r, 200)); // small delay to be polite
      }

      if (cancelled) return;

      // Map all trips to their coordinates (including duplicates of same location)
      const mapped = trips
        .map(trip => ({
          ...trip,
          coords: locationCoordMap[trip.location] || null,
        }))
        .filter(t => t.coords !== null);

      // Group trips at the same coordinate to avoid stacking
      const grouped = {};
      mapped.forEach(trip => {
        const key = `${trip.coords.lat.toFixed(4)},${trip.coords.lng.toFixed(4)}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(trip);
      });

      // Jitter overlapping markers slightly
      const final = [];
      Object.values(grouped).forEach(group => {
        group.forEach((trip, i) => {
          if (i === 0) {
            final.push(trip);
          } else {
            final.push({
              ...trip,
              coords: {
                lat: trip.coords.lat + (Math.random() - 0.5) * 0.04,
                lng: trip.coords.lng + (Math.random() - 0.5) * 0.04,
              },
            });
          }
        });
      });

      setGeoTrips(final);
      setIsGeocoding(false);
    }

    geocodeAll();
    return () => { cancelled = true; };
  }, [trips, uniqueLocations]);

  if (trips.length === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-stone-200 shadow-sm">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mountain className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-stone-800 text-sm">
            {language === 'el' ? 'Χάρτης Εκδρομών' : 'Trip Map'}
          </span>
          {geoTrips.length > 0 && (
            <span className="text-xs text-stone-500 bg-stone-100 rounded-full px-2 py-0.5">
              {geoTrips.length} {language === 'el' ? 'τοποθεσίες' : 'locations'}
            </span>
          )}
        </div>
        {isGeocoding && (
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            {language === 'el'
              ? `Φόρτωση χάρτη… ${geocodedCount}/${uniqueLocations.length}`
              : `Mapping… ${geocodedCount}/${uniqueLocations.length}`}
          </div>
        )}
        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-stone-500">
          {Object.entries(difficultyColors).map(([level, color]) => (
            <span key={level} className="flex items-center gap-1">
              <span style={{ background: color }} className="w-2.5 h-2.5 rounded-full inline-block" />
              {level}
            </span>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="h-[420px] w-full relative">
        <MapContainer
          center={[38.5, 22.5]}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {geoTrips.map(trip => {
            const organizer = organizerMap?.[trip.organizer_code];
            const color = difficultyColors[trip.difficulty] || "#059669";
            const icon = createColoredIcon(color);

            return (
              <Marker
                key={trip.id}
                position={[trip.coords.lat, trip.coords.lng]}
                icon={icon}
              >
                <Popup maxWidth={240} minWidth={200}>
                  <div className="text-sm">
                    {trip.image_url && (
                      <img
                        src={trip.image_url}
                        alt={trip.title}
                        className="w-full h-24 object-cover rounded mb-2"
                        onError={e => e.target.style.display = 'none'}
                      />
                    )}
                    <p className="font-bold text-stone-900 leading-snug mb-1 line-clamp-2">{trip.title}</p>
                    <div className="flex items-center gap-1 text-xs text-stone-500 mb-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span>{trip.location}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-stone-500 mb-2">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span>{format(new Date(trip.start_date), "d MMM yyyy")}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge style={{ backgroundColor: color, color: 'white', border: 'none' }} className="text-xs">
                        {trip.difficulty}
                      </Badge>
                      <span className="text-xs font-bold text-emerald-700">
                        {formatPriceForCard(trip, language)}
                      </span>
                    </div>
                    {organizer && (
                      <p className="text-xs text-stone-400 mb-2">by {organizer.username || organizer.full_name}</p>
                    )}
                    <Link to={`${createPageUrl("TripDetails")}?id=${trip.id}`}>
                      <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs h-7">
                        {language === 'el' ? 'Λεπτομέρειες' : 'View Details'}
                      </Button>
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {isGeocoding && geoTrips.length === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-[1000]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
              <p className="text-sm text-stone-600">
                {language === 'el' ? 'Φόρτωση χάρτη…' : 'Loading map…'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}