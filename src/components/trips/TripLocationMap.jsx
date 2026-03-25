import React from 'react';
import { MapContainer as _MapContainer, TileLayer as _TileLayer, Marker as _Marker, Popup } from 'react-leaflet';
const MapContainer = /** @type {React.FC<any>} */ (_MapContainer);
const TileLayer = /** @type {React.FC<any>} */ (_TileLayer);
const Marker = /** @type {React.FC<any>} */ (_Marker);
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom marker icon
const createMarkerIcon = (color = 'emerald') => {
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40">
        <path d="M16 0C9 0 4 5 4 12c0 8 12 28 12 28s12-20 12-28c0-7-5-12-12-12z" fill="#10b981" />
        <circle cx="16" cy="12" r="5" fill="white" />
      </svg>`
    )}`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
};

export default function TripLocationMap({ trip }) {
  const hasCoordinates = trip?.latitude && trip?.longitude;

  if (!hasCoordinates) {
    return (
      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground text-sm">{trip.location}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border border-border shadow-sm">
      <MapContainer
        center={[trip.latitude, trip.longitude]}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <Marker position={[trip.latitude, trip.longitude]} icon={createMarkerIcon()}>
          <Popup>{trip.location}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}