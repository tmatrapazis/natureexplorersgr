import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MapPin, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const pinIcon = L.divIcon({
  html: `<div style="
    width:28px;height:28px;
    background:#059669;
    border:3px solid white;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    box-shadow:0 2px 6px rgba(0,0,0,0.35);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  className: "",
});

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

export default function LocationPicker({ latitude, longitude, onLocationChange, language }) {
  const [pinPos, setPinPos] = useState(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    if (latitude && longitude) {
      setPinPos({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  const handleMapClick = (latlng) => {
    setPinPos(latlng);
    onLocationChange(latlng.lat, latlng.lng);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    // Detect coordinate format: (lat, lng) or "lat, lng"
    const coordMatch = searchQuery.match(/\(?\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\)?/);
    if (coordMatch) {
      const pos = { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
      setPinPos(pos);
      onLocationChange(pos.lat, pos.lng);
      mapRef.current?.setView([pos.lat, pos.lng], 13);
      return;
    }

    setIsSearching(true);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ", Greece")}&limit=1&accept-language=el,en`;
    const res = await fetch(url, { headers: { "User-Agent": "NatureExplorers/1.0" } });
    const data = await res.json();
    setIsSearching(false);
    if (data && data.length > 0) {
      const pos = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      setPinPos(pos);
      onLocationChange(pos.lat, pos.lng);
      mapRef.current?.setView([pos.lat, pos.lng], 12);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder={language === 'el' ? 'Αναζήτηση τοποθεσίας…' : 'Search location…'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
          className="flex-1"
        />
        <Button type="button" variant="outline" onClick={handleSearch} disabled={isSearching}>
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      <div className="rounded-lg overflow-hidden border border-stone-200 h-[260px]">
        <MapContainer
          center={pinPos ? [pinPos.lat, pinPos.lng] : [38.5, 22.5]}
          zoom={pinPos ? 11 : 6}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onMapClick={handleMapClick} />
          {pinPos && <Marker position={[pinPos.lat, pinPos.lng]} icon={pinIcon} />}
        </MapContainer>
      </div>

      {pinPos ? (
        <p className="text-xs text-emerald-700 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {language === 'el' ? 'Συντεταγμένες:' : 'Coordinates:'} {pinPos.lat.toFixed(5)}, {pinPos.lng.toFixed(5)}
        </p>
      ) : (
        <p className="text-xs text-stone-400">
          {language === 'el' ? 'Κάντε κλικ στον χάρτη για να τοποθετήσετε καρφίτσα' : 'Click on the map to drop a pin'}
        </p>
      )}
    </div>
  );
}