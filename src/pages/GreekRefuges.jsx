import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mountain, MapPin, Users, ArrowUpDown } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Mountain Refuges Data with approximate coordinates
const refugesData = [
  { id: 1, name: "Καταφύγιο Αστράκας", mountain: "Τύμφη", altitude: 1923, capacity: 51, type: "Ορειβατικό", lat: 39.9833, lng: 20.8167, website: "http://www.astrakarefuge.com/" },
  { id: 2, name: "Καταφύγιο Βαρδουσίων (ΕΟΣ)", mountain: "Βαρδούσια", altitude: 1918, capacity: 75, type: "Ορειβατικό", lat: 38.7167, lng: 22.1167 },
  { id: 3, name: "Καταφύγιο Βαρδουσίων (ΠΟΑ)", mountain: "Βαρδούσια", altitude: 2015, capacity: 18, type: "Ορειβατικό", lat: 38.7200, lng: 22.1200, website: "http://www.poa.gr/" },
  { id: 4, name: "Καταφύγιο Γιώσου Αποστολίδη", mountain: "Όλυμπος", altitude: 2697, capacity: 80, type: "Ορειβατικό", lat: 40.0847, lng: 22.3583, website: "http://www.olympus-refuge.gr/" },
  { id: 5, name: "Καταφύγιο Σπήλιος Αγαπητός", mountain: "Όλυμπος", altitude: 2100, capacity: 108, type: "Ορειβατικό", lat: 40.0858, lng: 22.3578, website: "http://www.sao.gr/" },
  { id: 6, name: "Καταφύγιο Δημήτρη Μπουντόλας", mountain: "Όλυμπος", altitude: 1868, capacity: 18, type: "Ορειβατικό", lat: 40.0861, lng: 22.3572 },
  { id: 7, name: "Καταφύγιο Μπάφι", mountain: "Πάρνηθα", altitude: 1150, capacity: 50, type: "Ορειβατικό", lat: 38.1667, lng: 23.7333, website: "http://www.eosathinas.gr/" },
  { id: 8, name: "Καταφύγιο Φλάμπουρι", mountain: "Πάρνηθα", altitude: 1200, capacity: 50, type: "Ορειβατικό", lat: 38.1583, lng: 23.7417 },
  { id: 9, name: "Καταφύγιο Βελουχιού", mountain: "Βελούχι", altitude: 1869, capacity: 30, type: "Ορειβατικό", lat: 38.7667, lng: 21.9667, website: "http://www.katafygio-velouchi.gr/" },
  { id: 10, name: "Καταφύγιο Καλλέργη", mountain: "Λευκά Όρη", altitude: 1680, capacity: 60, type: "Ορειβατικό", lat: 35.3167, lng: 23.9333 },
  { id: 11, name: "Καταφύγιο Βόλικα", mountain: "Λευκά Όρη", altitude: 1310, capacity: 30, type: "Ορειβατικό", lat: 35.2833, lng: 23.9167 },
  { id: 12, name: "Καταφύγιο Ταϋγέτου", mountain: "Ταΰγετος", altitude: 1550, capacity: 28, type: "Ορειβατικό", lat: 36.9500, lng: 22.3500, website: "http://www.spartahiking.gr/" },
  { id: 13, name: "Καταφύγιο Μαινάλου", mountain: "Μαίναλο", altitude: 1550, capacity: 26, type: "Ορειβατικό", lat: 37.6167, lng: 22.3500 },
  { id: 14, name: "Καταφύγιο Αγράφων", mountain: "Ανατολικά Άγραφα", altitude: 1536, capacity: 24, type: "Ορειβατικό", lat: 39.1167, lng: 21.5833, website: "https://agrafarefuge.gr/" },
  { id: 15, name: "Καταφύγιο Βοβούσας «Βάλια Κάλντα»", mountain: "Βάλια Κάλντα", altitude: 1004, capacity: 50, type: "Ορειβατικό", lat: 40.1000, lng: 21.0333, website: "http://www.katafigiovaliacalda.com/" },
  { id: 16, name: "Καταφύγιο Άσκιου", mountain: "Σινιάτσικο", altitude: 1464, capacity: 60, type: "Ορειβατικό", lat: 40.0667, lng: 21.5833 },
  { id: 17, name: "Καταφύγιο Βασιλίτσας", mountain: "Βασιλίτσα", altitude: 1835, capacity: 60, type: "Ορειβατικό", lat: 40.4167, lng: 21.2333, website: "http://vasilitsav1850.gr/" },
  { id: 18, name: "Καταφύγιο Γκιώνα", mountain: "Γκιώνα", altitude: 1800, capacity: 24, type: "Ορειβατικό", lat: 38.6667, lng: 22.3333 },
  { id: 19, name: "Καταφύγιο Πρωτοπαπά", mountain: "Πήλιο", altitude: 1600, capacity: 40, type: "Ορειβατικό", lat: 39.4167, lng: 23.0333 },
  { id: 20, name: "Καταφύγιο Άγιο Πνεύμα", mountain: "Φαλακρό", altitude: 1735, capacity: 80, type: "Ορειβατικό", lat: 41.2833, lng: 24.0833 },
  { id: 21, name: "Καταφύγιο Ψηλορείτη", mountain: "Ψηλορείτης", altitude: 1540, capacity: 40, type: "Ορειβατικό", lat: 35.2333, lng: 24.7667 },
  { id: 22, name: "Καταφύγιο Παναχαϊκού", mountain: "Παναχαϊκό", altitude: 1580, capacity: 32, type: "Ορειβατικό", lat: 38.2000, lng: 21.8333 },
  { id: 23, name: "Καταφύγιο Άνω Πηγάδι", mountain: "Όλυμπος", altitude: 1389, capacity: 18, type: "Ορειβατικό", lat: 40.0889, lng: 22.3611 },
  { id: 24, name: "Καταφύγιο Βοϊδομάτη", mountain: "Τύμφη", altitude: 1440, capacity: 25, type: "Ορειβατικό", lat: 39.9500, lng: 20.7500 },
  { id: 25, name: "Καταφύγιο Γαρδικίου", mountain: "Γράμμος", altitude: 1850, capacity: 40, type: "Ορειβατικό", lat: 40.3667, lng: 20.8833 },
];

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
  }, [sortConfig]);

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
                        <h3 className="font-bold text-base mb-1">{refuge.name}</h3>
                        <p className="text-sm text-stone-600 mb-1">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {refuge.mountain}
                        </p>
                        <p className="text-sm">
                          <Mountain className="w-3 h-3 inline mr-1" />
                          {refuge.altitude}m
                        </p>
                        {refuge.capacity > 0 && (
                          <p className="text-sm">
                            <Users className="w-3 h-3 inline mr-1" />
                            {refuge.capacity} άτομα
                          </p>
                        )}
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
                        {refuge.website && refuge.website !== '#' && (
                          <a
                            href={refuge.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Ιστοσελίδα
                          </a>
                        )}
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