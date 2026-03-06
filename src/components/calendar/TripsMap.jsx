import React, { useRef, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { Mountain } from "lucide-react";
import { format } from "date-fns";
import { formatPriceForCard } from "../helpers/pricingHelpers";
import { useLanguage } from "../contexts/LanguageContext";
import { createPageUrl } from "@/utils";

import "leaflet.markercluster";

// Fix Leaflet default marker icons broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
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

function buildPopupHTML(trip, organizer, language) {
  const color = difficultyColors[trip.difficulty] || "#059669";
  const price = formatPriceForCard(trip, language);
  const dateStr = trip.start_date ? format(new Date(trip.start_date), "d MMM yyyy") : "";
  const detailUrl = `${createPageUrl("TripDetails")}?id=${trip.id}`;
  const orgName = organizer ? (organizer.username || organizer.full_name) : "";

  return `
    <div style="width:220px;font-family:sans-serif;font-size:13px;">
      ${trip.image_url ? `<img src="${trip.image_url}" alt="" style="width:100%;height:90px;object-fit:cover;border-radius:6px;margin-bottom:8px;" onerror="this.style.display='none'" />` : ""}
      <p style="font-weight:700;color:#1c1917;margin:0 0 4px;line-height:1.3;">${trip.title}</p>
      <div style="display:flex;align-items:center;gap:4px;color:#78716c;margin-bottom:3px;font-size:11px;">
        <span>📍</span><span>${trip.location}</span>
      </div>
      ${dateStr ? `<div style="display:flex;align-items:center;gap:4px;color:#78716c;margin-bottom:6px;font-size:11px;"><span>📅</span><span>${dateStr}</span></div>` : ""}
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <span style="background:${color};color:white;border-radius:4px;padding:2px 7px;font-size:10px;font-weight:600;">${trip.difficulty}</span>
        <span style="color:#059669;font-weight:700;font-size:12px;">${price}</span>
      </div>
      ${orgName ? `<p style="color:#a8a29e;font-size:11px;margin:0 0 8px;">by ${orgName}</p>` : ""}
      <a href="${detailUrl}" style="display:block;background:#059669;color:white;text-align:center;padding:6px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600;">
        ${language === 'el' ? 'Λεπτομέρειες' : 'View Details'}
      </a>
    </div>
  `;
}

// Component that manages the marker cluster layer imperatively
function ClusterLayer({ trips, organizerMap, language }) {
  const map = useMap();
  const clusterRef = useRef(null);

  useEffect(() => {
    // Remove old cluster group
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 60,
      iconCreateFunction: (c) => {
        const count = c.getChildCount();
        const size = count < 10 ? 36 : count < 100 ? 44 : 52;
        return L.divIcon({
          html: `<div style="
            width:${size}px;height:${size}px;
            background:rgba(5,150,105,0.85);
            border:3px solid white;
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            color:white;font-weight:700;font-size:${size < 44 ? 13 : 15}px;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
          ">${count}</div>`,
          className: "",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
    });

    trips.forEach((trip) => {
      if (!trip.coords) return;
      const color = difficultyColors[trip.difficulty] || "#059669";
      const icon = createColoredIcon(color);
      const marker = L.marker([trip.coords.lat, trip.coords.lng], { icon });
      const organizer = organizerMap?.[trip.organizer_code];
      marker.bindPopup(buildPopupHTML(trip, organizer, language), { maxWidth: 240, minWidth: 220 });
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    return () => {
      if (clusterRef.current) map.removeLayer(clusterRef.current);
    };
  }, [trips, organizerMap, language, map]);

  return null;
}

export default function TripsMap({ trips, organizerMap }) {
  const { language } = useLanguage();

  // Inject markercluster CSS from CDN
  useEffect(() => {
    const urls = [
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.css",
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.css",
    ];
    urls.forEach((href) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
      }
    });
  }, []);

  // Only use trips that have explicit lat/lng from the entity
  const geoTrips = useMemo(() => {
    return trips
      .filter(trip => trip.latitude && trip.longitude)
      .map(trip => ({ ...trip, coords: { lat: trip.latitude, lng: trip.longitude } }));
  }, [trips]);

  return (
    <div className="rounded-xl overflow-hidden border border-stone-200 shadow-sm">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-stone-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Mountain className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-stone-800 text-sm">
            {language === 'el' ? 'Χάρτης Εκδρομών' : 'Trip Map'}
          </span>
          <span className="text-xs text-stone-500 bg-stone-100 rounded-full px-2 py-0.5">
            {geoTrips.length} {language === 'el' ? 'εκδρομές' : 'trips'}
          </span>
        </div>
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
          {geoTrips.length > 0 && (
            <ClusterLayer trips={geoTrips} organizerMap={organizerMap} language={language} />
          )}
          {geoTrips.length === 0 && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 1000,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.75)", backdropFilter: "blur(2px)"
            }}>
              <p style={{ color: "#57534e", fontSize: "14px", fontWeight: 500 }}>
                {language === 'el' ? 'Δεν υπάρχουν εκδρομές με γεωγραφικά δεδομένα για την επιλογή σας' : 'No trips with location data for your selection'}
              </p>
            </div>
          )}
        </MapContainer>
      </div>
    </div>
  );
}