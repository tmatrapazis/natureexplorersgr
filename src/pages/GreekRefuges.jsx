import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mountain, MapPin, Users, ArrowUpDown, ExternalLink, Facebook, Instagram } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import { Refuge } from '@/api/db';
import { useLanguage } from '@/components/contexts/LanguageContext';
import { useTranslation } from '@/components/translations/useTranslations';
import PageWrapper from '../components/layout/PageWrapper';
import useSEO from '../components/seo/useSEO';
import LazyGreekRefugesMap from '../components/lazy/LazyGreekRefugesMap';

// Helper function to generate Google Maps link
const getGoogleMapsLink = (lat, lng) => {
  return `https://www.google.com/maps?q=${lat},${lng}`;
};

export default function GreekRefuges() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  useSEO({
    title: language === 'el'
      ? 'Ελληνικά Ορειβατικά Καταφύγια | Καταφύγια Βουνού Ελλάδα | Nature Explorers'
      : 'Greek Mountain Refuges | Alpine Shelters Greece | Nature Explorers',
    description: language === 'el'
      ? 'Εξερευνήστε τα ορειβατικά καταφύγια της Ελλάδας. Βρείτε πληροφορίες, τοποθεσίες και χάρτη για καταφύγια σε Όλυμπο, Πάρνηθα, Πήλιο, Κρήτη και άλλα ελληνικά βουνά.'
      : 'Explore Greek mountain refuges. Find information, locations and map for alpine shelters on Olympus, Parnitha, Pelion, Crete and other Greek mountains.',
    url: 'https://natureexplorers.gr/GreekRefuges',
    type: 'website',
  });

  const [sortConfig, setSortConfig] = useState({ key: 'altitude', direction: 'desc' });
  const [selectedRefuge, setSelectedRefuge] = useState(null);
  const [mapCenter, setMapCenter] = useState([39.0, 22.0]);
  const [mapZoom, setMapZoom] = useState(7);
  
  useEffect(() => {
    document.title = `${t('refuges.page_title')} | Nature Explorers`;
  }, [language, t]);

  const { data: refugesData = [], isLoading } = useQuery({
    queryKey: ['refuges'],
    queryFn: () => Refuge.list(),
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
    (document.getElementById('root') || window).scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <PageWrapper>
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4">
            <Mountain className="w-8 h-8 md:w-12 md:h-12 text-[#0c281c] flex-shrink-0" />
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground break-words min-w-0">
              {t('refuges.page_title')}
            </h1>
          </div>
          <p className="text-sm md:text-lg text-muted-foreground max-w-3xl mx-auto px-2 break-words">
            {t('refuges.page_subtitle').replace('{count}', refugesData.length)}
          </p>
        </div>

        {/* Map Section */}
        <Card className="mb-6 md:mb-8 overflow-hidden relative z-0 w-full max-w-full">
          <CardContent className="p-0">
            <LazyGreekRefugesMap
              refugesData={refugesData}
              mapCenter={mapCenter}
              mapZoom={mapZoom}
              setSelectedRefuge={setSelectedRefuge}
              t={t}
            />
          </CardContent>
        </Card>

        {/* Table/List Section */}
        <Card className="w-full max-w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <MapPin className="w-5 h-5 text-[#0c281c] flex-shrink-0" />
              <span className="break-words min-w-0">{t('refuges.list_title')}</span>
            </CardTitle>
            <p className="text-xs md:text-sm text-muted-foreground mt-2 break-words">
              {t('refuges.list_subtitle')}
            </p>
          </CardHeader>
          <CardContent className="p-0 md:p-6">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
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
                        {t('refuges.refuge_name')}
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
                        {t('refuges.mountain')}
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
                        {t('refuges.altitude')}
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
                        {t('refuges.capacity')}
                        <ArrowUpDown className="w-4 h-4 ml-2" />
                      </Button>
                    </th>
                    <th className="text-left p-3">
                      <span className="font-semibold">{t('refuges.type')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRefuges.map((refuge) => (
                    <tr
                      key={refuge.id}
                      onClick={() => handleRowClick(refuge)}
                      className={`border-b cursor-pointer hover:bg-[#f0e3c7]/40 transition-colors ${
                        selectedRefuge?.id === refuge.id ? 'bg-emerald-100' : ''
                      }`}
                    >
                      <td className="p-3">
                        <div className="font-medium text-foreground">{refuge.name}</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {refuge.website && (
                            <a
                              href={refuge.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#0c281c] hover:underline inline-flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-3 h-3" />
                              {t('refuges.website')}
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
                              {t('refuges.bookings')}
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
                              {t('refuges.maps')}
                            </a>
                          )}
                          {refuge.facebook && (
                            <a
                              href={refuge.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${refuge.name} on Facebook`}
                              className="text-xs text-blue-700 hover:underline inline-flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Facebook className="w-3 h-3" aria-hidden="true" />
                            </a>
                          )}
                          {refuge.instagram && (
                            <a
                              href={refuge.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${refuge.name} on Instagram`}
                              className="text-xs text-pink-600 hover:underline inline-flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Instagram className="w-3 h-3" aria-hidden="true" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-foreground">{refuge.mountain}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="bg-muted">
                          {refuge.altitude}m
                        </Badge>
                      </td>
                      <td className="p-3 text-foreground">
                        {refuge.capacity > 0 ? `${refuge.capacity} ${t('refuges.people')}` : '-'}
                      </td>
                      <td className="p-3">
                        <Badge className="bg-[#0c281c] text-white">
                          {refuge.type}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-3 p-4">
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <Button
                  variant={sortConfig.key === 'name' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSort('name')}
                  className="whitespace-nowrap flex-shrink-0"
                >
                  {t('refuges.refuge_name')}
                  <ArrowUpDown className="w-3 h-3 ml-1" />
                </Button>
                <Button
                  variant={sortConfig.key === 'altitude' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSort('altitude')}
                  className="whitespace-nowrap flex-shrink-0"
                >
                  {t('refuges.altitude')}
                  <ArrowUpDown className="w-3 h-3 ml-1" />
                </Button>
                <Button
                  variant={sortConfig.key === 'mountain' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSort('mountain')}
                  className="whitespace-nowrap flex-shrink-0"
                >
                  {t('refuges.mountain')}
                  <ArrowUpDown className="w-3 h-3 ml-1" />
                </Button>
              </div>

              {sortedRefuges.map((refuge) => (
                <div
                  key={refuge.id}
                  onClick={() => handleRowClick(refuge)}
                  className={`border rounded-lg p-4 cursor-pointer hover:border-emerald-600 transition-all w-full max-w-full ${
                    selectedRefuge?.id === refuge.id ? 'bg-[#f0e3c7]/40 border-emerald-600' : 'bg-card'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground text-base break-words min-w-0 flex-1">{refuge.name}</h3>
                      <Badge className="bg-[#0c281c] text-white flex-shrink-0 text-xs">
                        {refuge.type}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="break-words min-w-0">{refuge.mountain}</span>
                      </span>
                      <Badge variant="outline" className="bg-muted flex-shrink-0">
                        {refuge.altitude}m
                      </Badge>
                      {refuge.capacity > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4 flex-shrink-0" />
                          {refuge.capacity}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {refuge.website && (
                        <a
                          href={refuge.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#0c281c] hover:underline inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" />
                          {t('refuges.website')}
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
                          {t('refuges.bookings')}
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
                          {t('refuges.maps')}
                        </a>
                      )}
                      {refuge.facebook && (
                        <a
                          href={refuge.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${refuge.name} on Facebook`}
                          className="text-xs text-blue-700 hover:underline inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Facebook className="w-3 h-3" aria-hidden="true" />
                        </a>
                      )}
                      {refuge.instagram && (
                        <a
                          href={refuge.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${refuge.name} on Instagram`}
                          className="text-xs text-pink-600 hover:underline inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Instagram className="w-3 h-3" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-6 md:mt-8 text-center text-xs md:text-sm text-muted-foreground px-2">
          <p className="break-words">
            {t('refuges.data_source')}{' '}
            <a
              href="https://www.topoguide.gr/greece/mountain_refuges.php"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0c281c] hover:underline"
            >
              Topoguide.gr
            </a>
          </p>
          <p className="mt-2 break-words">
            {t('refuges.coordinates_note')}
          </p>
        </div>
    </PageWrapper>
  );
}