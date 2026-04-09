import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MobileSelect from '@/components/ui/MobileSelect';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import { HikingTrip } from '@/api/db';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter } from
'@/components/ui/dialog';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../translations/useTranslations';

function TripFilters({ filters, onFilterChange }) {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const [open, setOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);

  // Fetch all unique departure locations
  const { data: allTrips = [] } = useQuery({
    queryKey: ['all-trips-departure'],
    queryFn: () => HikingTrip.list(),
  });

  const uniqueDepartureLocations = React.useMemo(() => {
    const locations = new Set();
    allTrips.forEach(trip => {
      if (trip.departure_from && Array.isArray(trip.departure_from)) {
        trip.departure_from.forEach(loc => locations.add(loc));
      }
    });
    return Array.from(locations).sort();
  }, [allTrips]);

  const availableTags = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const tags = new Set();
    allTrips.forEach(trip => {
      if (trip.start_date >= today && Array.isArray(trip.tags)) {
        trip.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [allTrips]);

  const toggleTag = (tag) => {
    const newTags = tempFilters.tags.includes(tag) ?
    tempFilters.tags.filter((t) => t !== tag) :
    [...tempFilters.tags, tag];
    setTempFilters({ ...tempFilters, tags: newTags });
  };

  const toggleDepartureLocation = (location) => {
    const newLocations = tempFilters.departureFrom?.includes(location) ?
    tempFilters.departureFrom.filter((l) => l !== location) :
    [...(tempFilters.departureFrom || []), location];
    setTempFilters({ ...tempFilters, departureFrom: newLocations });
  };

  const handleApplyFilters = () => {
    onFilterChange(tempFilters);
    setOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      difficulty: "all",
      minPrice: "",
      maxPrice: "",
      tags: [],
      departureFrom: [],
      verifiedOnly: false,
      searchQuery: ""
    };
    setTempFilters(clearedFilters);
    onFilterChange(clearedFilters);
    setOpen(false);
  };

  const activeFiltersCount = [
  filters.difficulty !== "all" ? 1 : 0,
  filters.minPrice ? 1 : 0,
  filters.maxPrice ? 1 : 0,
  filters.tags.length,
  filters.departureFrom?.length || 0,
  filters.verifiedOnly ? 1 : 0,
  filters.searchQuery ? 1 : 0].
  reduce((a, b) => a + b, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="px-4 py-2.5 text-sm font-medium rounded-md inline-flex items-center justify-center min-h-[44px]"
          aria-label={`${t('filters.filter_trips')}${activeFiltersCount > 0 ? ` (${activeFiltersCount} active)` : ''}`}
        >
          <Filter className="w-4 h-4 mr-2" />
          {t('filters.filter_trips')}
          {activeFiltersCount > 0 &&
          <Badge variant="default" className="ml-2 bg-brand-dark">
              {activeFiltersCount}
            </Badge>
          }
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-brand-dark" />
            {t('filters.filter_trips')}
          </DialogTitle>
          <DialogDescription>
            {t('filters.description')} {/* Adjusted key for better semantic */}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Search */}
          <div>
            <Label htmlFor="search">{t('filters.search_label')}</Label> {/* Adjusted key for better semantic */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder={t('filters.search_placeholder')}
                value={tempFilters.searchQuery}
                onChange={(e) => setTempFilters({ ...tempFilters, searchQuery: e.target.value })}
                className="pl-10" />

            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Difficulty */}
            <div>
              <Label htmlFor="difficulty">{t('filters.difficulty')}</Label>
              <MobileSelect
                value={tempFilters.difficulty}
                onValueChange={(value) => setTempFilters({ ...tempFilters, difficulty: value })}
                options={[
                  { value: "all", label: t('filters.all_levels') },
                  { value: "easy", label: t('trip.difficulty_easy') },
                  { value: "moderate", label: t('trip.difficulty_moderate') },
                  { value: "challenging", label: t('trip.difficulty_challenging') },
                  { value: "difficult", label: t('trip.difficulty_difficult') }
                ]}
                placeholder={t('filters.difficulty')}
                label={t('filters.difficulty')}
              />
            </div>

            {/* Verified Only */}
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="verified"
                checked={tempFilters.verifiedOnly}
                onCheckedChange={(checked) => setTempFilters({ ...tempFilters, verifiedOnly: checked })} />

              <Label htmlFor="verified" className="cursor-pointer">{t('filters.verified_only')}</Label>
            </div>
          </div>

          {/* Price Range */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min-price">{t('filters.min_price')}</Label>
              <Input
                id="min-price"
                type="number"
                min="0"
                placeholder="0" // Assuming "0" as a numerical value does not require translation
                value={tempFilters.minPrice}
                onChange={(e) => setTempFilters({ ...tempFilters, minPrice: e.target.value })} />

            </div>

            <div>
              <Label htmlFor="max-price">{t('filters.max_price')}</Label>
              <Input
                id="max-price"
                type="number"
                min="0"
                placeholder={t('filters.no_limit')}
                value={tempFilters.maxPrice}
                onChange={(e) => setTempFilters({ ...tempFilters, maxPrice: e.target.value })} />

            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>{t('filters.tags')}</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {availableTags.map((tag) =>
              <Badge
                key={tag}
                variant={tempFilters.tags.includes(tag) ? "default" : "outline"}
                className={`cursor-pointer min-h-[44px] px-4 flex items-center ${tempFilters.tags.includes(tag) ? 'bg-brand-dark' : ''}`}
                onClick={() => toggleTag(tag)}
                role="button"
                tabIndex={0}
                aria-label={`${tempFilters.tags.includes(tag) ? 'Remove' : 'Add'} tag ${tag}`}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggleTag(tag))}
              >
                  {tag}
                </Badge>
              )}
            </div>
          </div>

          {/* Departure Locations */}
          {uniqueDepartureLocations.length > 0 && (
            <div>
              <Label>{language === 'el' ? 'Αναχώρηση Από' : 'Departure From'}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {uniqueDepartureLocations.map((location) =>
                <Badge
                  key={location}
                  variant={tempFilters.departureFrom?.includes(location) ? "default" : "outline"}
                  className={`cursor-pointer min-h-[44px] px-4 flex items-center ${tempFilters.departureFrom?.includes(location) ? 'bg-blue-600' : ''}`}
                  onClick={() => toggleDepartureLocation(location)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${tempFilters.departureFrom?.includes(location) ? 'Remove' : 'Add'} departure from ${location}`}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggleDepartureLocation(location))}
                >
                    {location}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleClearFilters}
            className="min-h-[44px]"
            aria-label={t('filters.clear')}
          >
            <X className="w-4 h-4 mr-2" />
            {t('filters.clear')}
          </Button>
          <Button 
            onClick={handleApplyFilters} 
            className="bg-brand-dark hover:bg-brand-dark/90 min-h-[44px]"
            aria-label={t('filters.apply')}
          >
            {t('filters.apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}

export default React.memo(TripFilters);