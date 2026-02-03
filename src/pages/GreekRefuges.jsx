import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mountain, MapPin, Users, ArrowUpDown, ExternalLink, Facebook, Instagram } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

export default function GreekRefuges() {
  const [sortConfig, setSortConfig] = useState({ key: 'altitude', direction: 'desc' });
  const [selectedRefuge, setSelectedRefuge] = useState(null);
  const [mapCenter, setMapCenter] = useState([39.0, 22.0]);
  const [mapZoom, setMapZoom] = useState(7);
  
  useEffect(() => {
    document.title = "Ελληνικά Ορειβατικά Καταφύγια | Nature Explorers";
  }, []);

  const { data: refugesData = [], isLoading } = useQuery({
    queryKey: ['refuges'],
    queryFn: () => base44.entities.Refuge.list(),
  });

  const sortedRefuges = React.useMemo(() => {
    let sorted = [...refugesData];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sorted;
  }, [sortConfig, refugesData]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleRowClick = (refuge) => {
    setSelectedRefuge(refuge);
    setMapCenter([refuge.lat, refuge.lng]);
    setMapZoom(14);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Mountain className="w-12 h-12 text-emerald-600 animate-pulse mx-auto mb-4" />
          <p className="text-stone-600">Φόρτωση καταφυγίων...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Mountain className="w-12 h-12 text-emerald-600" />
            <h1 className="text-4xl md:text-5xl font-bold text-stone-900">
              Ελληνικά Ορειβατικά Καταφύγια
            </h1>
          </div>
          <p className="text-lg text-stone-600 max-w-3xl mx-auto">
            Εξερευνήστε τα {refugesData.length} ορειβατικά καταφύγια της Ελλάδας στον χάρτη και βρείτε πληροφορίες για κάθε καταφύγιο.
          </p>
        </div>

        {/* Map Section */}
        <Card className="mb-8 overflow-hidden">
          <CardContent className="p-0">
            <div className="h-[500px] w-full">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController center={mapCenter} zoom={mapZoom} />
                {refugesData.map((refuge) => (
                  <Marker
                    key={refuge.id}
                    position={[refuge.lat, refuge.lng]}
                    eventHandlers={{
                      click: () => {
                        setSelectedRefuge(refuge);
                      },
                    }}
                  >
                    <Popup>
                      <div className="text-center">
                        <h3 className="font-bold text-base mb-2">{refuge.name}</h3>
                        <p className="text-sm text-stone-600 mb-1">
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
                            {refuge.capacity} άτομα
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
          </CardContent>
        </Card>

        {/* Table Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Λίστα Καταφυγίων
            </CardTitle>
            <p className="text-sm text-stone-600 mt-2">
              Κάντε κλικ σε οποιαδήποτε γραμμή για να δείτε το καταφύγιο στον χάρτη
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('name')}
                        className="font-semibold"
                      >
                        Καταφύγιο
                        <ArrowUpDown className="w-4 h-4 ml-2" />
                      </Button>
                    </th>
                    <th className="text-left p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('mountain')}
                        className="font-semibold"
                      >
                        Βουνό
                        <ArrowUpDown className="w-4 h-4 ml-2" />
                      </Button>
                    </th>
                    <th className="text-left p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('altitude')}
                        className="font-semibold"
                      >
                        Υψόμετρο
                        <ArrowUpDown className="w-4 h-4 ml-2" />
                      </Button>
                    </th>
                    <th className="text-left p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('capacity')}
                        className="font-semibold"
                      >
                        Χωρητικότητα
                        <ArrowUpDown className="w-4 h-4 ml-2" />
                      </Button>
                    </th>
                    <th className="text-left p-3">
                      <span className="font-semibold">Τύπος</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRefuges.map((refuge) => (
                    <tr
                      key={refuge.id}
                      onClick={() => handleRowClick(refuge)}
                      className={`border-b cursor-pointer hover:bg-emerald-50 transition-colors ${
                        selectedRefuge?.id === refuge.id ? 'bg-emerald-100' : ''
                      }`}
                    >
                      <td className="p-3">
                        <div className="font-medium text-stone-900">{refuge.name}</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {refuge.website && (
                            <a
                              href={refuge.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-emerald-600 hover:underline inline-flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-3 h-3" />
                              Ιστοσελίδα
                            </a>
                          )}
                          {refuge.refuge_link && (
                            <a
                              href={refuge.refuge_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-3 h-3" />
                              Κρατήσεις
                            </a>
                          )}
                          {(refuge.google_maps_link || (refuge.lat && refuge.lng)) && (
                            <a
                              href={refuge.google_maps_link || getGoogleMapsLink(refuge.lat, refuge.lng)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-red-600 hover:underline inline-flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MapPin className="w-3 h-3" />
                              Maps
                            </a>
                          )}
                          {refuge.facebook && (
                            <a
                              href={refuge.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-700 hover:underline inline-flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Facebook className="w-3 h-3" />
                            </a>
                          )}
                          {refuge.instagram && (
                            <a
                              href={refuge.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-pink-600 hover:underline inline-flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Instagram className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-stone-700">{refuge.mountain}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="bg-stone-100">
                          {refuge.altitude}m
                        </Badge>
                      </td>
                      <td className="p-3 text-stone-700">
                        {refuge.capacity > 0 ? `${refuge.capacity} άτομα` : '-'}
                      </td>
                      <td className="p-3">
                        <Badge className="bg-emerald-600 text-white">
                          {refuge.type}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-stone-600">
          <p>
            Δεδομένα από{' '}
            <a
              href="https://www.topoguide.gr/greece/mountain_refuges.php"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              Topoguide.gr
            </a>
          </p>
          <p className="mt-2">
            Οι συντεταγμένες είναι προσεγγιστικές. Για ακριβείς πληροφορίες επικοινωνήστε με τους διαχειριστές των καταφυγίων.
          </p>
        </div>
      </div>
    </div>
  );
}