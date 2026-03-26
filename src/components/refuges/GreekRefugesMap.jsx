import React, { useEffect } from 'react';
import { MapContainer as _MapContainer, TileLayer as _TileLayer, Marker as _Marker, Popup, useMap } from 'react-leaflet';
const MapContainer = /** @type {React.FC<any>} */ (_MapContainer);
const TileLayer = /** @type {React.FC<any>} */ (_TileLayer);
const Marker = /** @type {React.FC<any>} */ (_Marker);
import { MapPin, Mountain, Users, Facebook, Instagram, Home } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';

// Create custom refuge home icon using lucide-react
const createRefugeIcon = () => {
  const iconHtml = ReactDOMServer.renderToString(
    <div style={{ 
      backgroundColor: '#059669', 
      borderRadius: '50%', 
      width: '32px', 
      height: '32px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      border: '3px solid white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
    }}>
      <Home style={{ color: 'white', width: '18px', height: '18px' }} />
    </div>
  );
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-refuge-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const refugeIcon = createRefugeIcon();

// Helper function to generate Google Maps link
const getGoogleMapsLink = (lat, lng) => {
  return `https://www.google.com/maps?q=${lat},${lng}`;
};

// Component to handle map zoom
function MapController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, map]);
  
  return null;
}

export default function GreekRefugesMap({ refugesData, mapCenter, mapZoom, setSelectedRefuge, t }) {
  return (
    <div className="h-[300px] md:h-[500px] w-full max-w-full relative z-0">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />
        <MapController center={mapCenter} zoom={mapZoom} />
        {refugesData.map((refuge) => (
          <Marker
            key={refuge.id}
            position={[refuge.lat, refuge.lng]}
            icon={refugeIcon}
            eventHandlers={{
              click: () => {
                setSelectedRefuge(refuge);
              },
            }}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-bold text-base mb-2">{refuge.name}</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {refuge.mountain}
                </p>
                <p className="text-sm mb-1">
                  <Mountain className="w-3 h-3 inline mr-1" />
                  {refuge.altitude}m
                </p>
                {refuge.capacity > 0 && (
                  <p className="text-sm mb-2">
                    <Users className="w-3 h-3 inline mr-1" />
                    {refuge.capacity} {t('refuges.people')}
                  </p>
                )}
                <div className="flex gap-2 justify-center mt-2">
                  {(refuge.google_maps_link || (refuge.lat && refuge.lng)) && (
                    <a
                      href={refuge.google_maps_link || getGoogleMapsLink(refuge.lat, refuge.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Google Maps
                    </a>
                  )}
                  {refuge.facebook && (
                    <a
                      href={refuge.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Facebook
                    </a>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}