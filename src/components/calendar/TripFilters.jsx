
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
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

const availableTags = [
"beginner-friendly",
"sunrise-hike",
"sunset-hike",
"pet-friendly",
"family-friendly",
"challenging",
"camping",
"multi-day",
"guided",
"photography",
"wildlife",
"waterfall",
"summit",
"coastal",
"forest"];


export default function TripFilters({ filters, onFilterChange }) {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const [open, setOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);

  const toggleTag = (tag) => {
    const newTags = tempFilters.tags.includes(tag) ?
    tempFilters.tags.filter((t) => t !== tag) :
    [...tempFilters.tags, tag];
    setTempFilters({ ...tempFilters, tags: newTags });
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
  filters.verifiedOnly ? 1 : 0,
  filters.searchQuery ? 1 : 0].
  reduce((a, b) => a + b, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-background mb-6 pt-5 pr-4 pb-5 pl-4 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input shadow-sm hover:bg-accent hover:text-accent-foreground h-9">
          <Filter className="w-4 h-4 mr-2" />
          {t('filters.filter_trips')}
          {activeFiltersCount > 0 &&
          <Badge variant="default" className="ml-2 bg-emerald-600">
              {activeFiltersCount}
            </Badge>
          }
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-emerald-600" />
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
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
              <Select
                value={tempFilters.difficulty}
                onValueChange={(value) => setTempFilters({ ...tempFilters, difficulty: value })}>

                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.all_levels')}</SelectItem>
                  <SelectItem value="easy">{t('trip.difficulty_easy')}</SelectItem>
                  <SelectItem value="moderate">{t('trip.difficulty_moderate')}</SelectItem>
                  <SelectItem value="challenging">{t('trip.difficulty_challenging')}</SelectItem>
                  <SelectItem value="difficult">{t('trip.difficulty_difficult')}</SelectItem> {/* New translation key */}
                </SelectContent>
              </Select>
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
                className={`cursor-pointer ${tempFilters.tags.includes(tag) ? 'bg-emerald-600' : ''}`}
                onClick={() => toggleTag(tag)}>

                  {tag} {/* Tags themselves are not translated, they are identifiers */}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClearFilters}>
            <X className="w-4 h-4 mr-2" />
            {t('filters.clear')}
          </Button>
          <Button onClick={handleApplyFilters} className="bg-emerald-600 hover:bg-emerald-700">
            {t('filters.apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}