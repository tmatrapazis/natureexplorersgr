import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Loader2 } from "lucide-react";
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../translations/useTranslations';
import LazyQuillEditor from '../lazy/LazyQuillEditor';
const LazyLocationPicker = React.lazy(() => import('../lazy/LazyLocationPicker'));
import MobileSelect from '../ui/MobileSelect';
import { useOrganizerPlan } from '@/lib/useOrganizerPlan';

const availableTags = [
  "beginner-friendly", "sunrise-hike", "sunset-hike", "pet-friendly",
  "family-friendly", "challenging", "camping", "multi-day", "guided",
  "photography", "wildlife", "waterfall", "summit", "coastal", "forest",
  "bus", "organized-carpooling"
];

const emptyTrip = {
  title: "", description: "", start_date: "", end_date: "", location: "",
  latitude: null, longitude: null,
  difficulty: "moderate", distance_km: 0, elevation_gain_m: 0, total_attendees: 10,
  price: 0, pricing_options: [], external_link: "", event_url: "", image_url: "",
  requirements: [], departure_from: [], tags: [], cancel_policy: "", status: "draft"
};

export default function TripForm({ initialData, onSubmit, onCancel, onSaveDraft = undefined, onDirtyChange = undefined, isSubmitting, isEditing = false }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const { isPremium } = useOrganizerPlan();

  const [tripData, setTripData] = useState(() => {
    if (!initialData) return emptyTrip;
    return {
      ...emptyTrip,
      ...initialData,
      start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : "",
      end_date: initialData.end_date ? new Date(initialData.end_date).toISOString().split('T')[0] : "",
      requirements: initialData.requirements || [],
      departure_from: initialData.departure_from || [],
      pricing_options: initialData.pricing_options?.length > 0
        ? initialData.pricing_options
        : (initialData.price > 0 ? [{ label: 'Standard', price: initialData.price }] : []),
      tags: initialData.tags || [],
    };
  });

  const [currentRequirement, setCurrentRequirement] = useState("");
  const [currentDeparture, setCurrentDeparture] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTripData({
        ...emptyTrip,
        ...initialData,
        start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : "",
        end_date: initialData.end_date ? new Date(initialData.end_date).toISOString().split('T')[0] : "",
        requirements: initialData.requirements || [],
        departure_from: initialData.departure_from || [],
        pricing_options: initialData.pricing_options?.length > 0
          ? initialData.pricing_options
          : (initialData.price > 0 ? [{ label: 'Standard', price: initialData.price }] : []),
        tags: initialData.tags || [],
      });
    }
  }, [initialData?.id]);

  const update = (key, value) => {
    setTripData(prev => ({ ...prev, [key]: value }));
    if (onDirtyChange) onDirtyChange(true);
  };

  const addPricingOption = () => {
    update('pricing_options', [...(tripData.pricing_options || []), { label: '', price: 0 }]);
  };
  const removePricingOption = (i) => update('pricing_options', tripData.pricing_options.filter((_, idx) => idx !== i));
  const updatePricingOption = (i, field, value) => {
    const updated = tripData.pricing_options.map((opt, idx) =>
      idx === i ? { ...opt, [field]: field === 'price' ? parseFloat(value) || 0 : value } : opt
    );
    update('pricing_options', updated);
  };

  const addRequirement = () => {
    if (currentRequirement.trim()) {
      update('requirements', [...tripData.requirements, currentRequirement.trim()]);
      setCurrentRequirement("");
    }
  };
  const removeRequirement = (i) => update('requirements', tripData.requirements.filter((_, idx) => idx !== i));

  const addDeparture = () => {
    if (currentDeparture.trim()) {
      update('departure_from', [...tripData.departure_from, currentDeparture.trim()]);
      setCurrentDeparture("");
    }
  };
  const removeDeparture = (i) => update('departure_from', tripData.departure_from.filter((_, idx) => idx !== i));

  const toggleTag = (tag) => {
    update('tags', tripData.tags.includes(tag)
      ? tripData.tags.filter(t => t !== tag)
      : [...tripData.tags, tag]
    );
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `trip-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('trip-images')
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('trip-images').getPublicUrl(data.path);
      update('image_url', publicUrl);
      toast.success(language === 'el' ? 'Εικόνα ανέβηκε με επιτυχία' : 'Image uploaded successfully');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(language === 'el' ? 'Σφάλμα ανέβασμα εικόνας' : 'Error uploading image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageGeneration = async () => {
    setUploadingImage(false);
    console.warn('Image generation not yet implemented — will use Supabase Edge Function');
    toast.error(language === 'el' ? 'Η δημιουργία εικόνας δεν είναι ακόμα διαθέσιμη' : 'Image generation not yet available');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = { ...tripData };
    if (!dataToSubmit.end_date) dataToSubmit.end_date = dataToSubmit.start_date;
    // Normalize pricing: single price → pricing_options tier; keep price in sync for SEO
    if (!dataToSubmit.pricing_options || dataToSubmit.pricing_options.length === 0) {
      dataToSubmit.pricing_options = dataToSubmit.price > 0
        ? [{ label: 'Standard', price: dataToSubmit.price }]
        : [];
    }
    dataToSubmit.price = dataToSubmit.pricing_options[0]?.price ?? 0;
    // Validate tier slots don't exceed total_attendees
    const tierSlotsSum = dataToSubmit.pricing_options.reduce((sum, t) => sum + (t.slots || 0), 0);
    if (tierSlotsSum > 0 && tierSlotsSum > (dataToSubmit.total_attendees || 0)) {
      toast.error(
        language === 'el'
          ? `Το άθροισμα θέσεων ανά κατηγορία (${tierSlotsSum}) υπερβαίνει τις Συνολικές Θέσεις (${dataToSubmit.total_attendees}).`
          : `Tier slots total (${tierSlotsSum}) exceeds Total Slots (${dataToSubmit.total_attendees}). Please adjust.`
      );
      return;
    }
    // Initialize `remaining` for each tier that has a slot limit.
    // Only set it if it's not already present (preserve existing remaining for edits).
    dataToSubmit.pricing_options = dataToSubmit.pricing_options.map(t =>
      t.slots > 0 ? { ...t, remaining: t.remaining ?? t.slots } : t
    );
    // Auto-sum total_attendees when all tiers have per-tier slot limits
    const allHaveSlots = dataToSubmit.pricing_options.length > 0 &&
      dataToSubmit.pricing_options.every(t => t.slots > 0);
    if (allHaveSlots) {
      dataToSubmit.total_attendees = dataToSubmit.pricing_options.reduce((sum, t) => sum + t.slots, 0);
    }
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <Label htmlFor="title">{t('create_trip.trip_title')} *</Label>
        <Input id="title" value={tripData.title} onChange={(e) => update('title', e.target.value)} placeholder={t('create_trip.trip_title_placeholder')} required />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">{t('create_trip.description')}</Label>
        <div className="mt-1" style={{ minHeight: '200px' }}>
          <LazyQuillEditor 
            value={tripData.description || ""} 
            onChange={(v) => update('description', v)} 
            style={{ height: '150px', marginBottom: '42px' }}
            placeholder={t('create_trip.description_placeholder') || ''}
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <Label>{t('create_trip.tags')}</Label>
        <div className="flex flex-wrap gap-2 mt-2 w-full min-w-0">
          {availableTags.map(tag => (
            <Badge 
              key={tag} 
              variant={tripData.tags.includes(tag) ? "default" : "outline"}
              className={`cursor-pointer whitespace-normal break-words text-center min-h-[44px] px-4 flex items-center ${tripData.tags.includes(tag) ? 'bg-[#0c281c]' : ''}`}
              onClick={() => toggleTag(tag)}
              role="button"
              tabIndex={0}
              aria-label={`${tripData.tags.includes(tag) ? (language === 'el' ? 'Αφαίρεση ετικέτας' : 'Remove tag') : (language === 'el' ? 'Προσθήκη ετικέτας' : 'Add tag')} ${tag}`}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggleTag(tag))}
            >
              {tag}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">{t('create_trip.tags_description')}</p>
      </div>

      {/* Dates */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">{t('create_trip.start_date')} *</Label>
          <Input id="start_date" type="date" value={tripData.start_date} onChange={(e) => update('start_date', e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="end_date">{t('create_trip.end_date')} *</Label>
          <Input id="end_date" type="date" value={tripData.end_date} min={tripData.start_date} onChange={(e) => update('end_date', e.target.value)} required />
          <p className="text-xs text-muted-foreground mt-1">{t('create_trip.end_date_note')}</p>
        </div>
      </div>

      {/* Location */}
      <div>
        <Label htmlFor="location">{t('create_trip.location_region')} *</Label>
        <Input id="location" value={tripData.location} onChange={(e) => update('location', e.target.value)} placeholder={t('create_trip.location_placeholder')} required className="mb-2" />
        <p className="text-xs text-muted-foreground mb-3">{t('create_trip.location_note')}</p>
        <Label className="mb-1 block text-sm text-muted-foreground">
          {language === 'el' ? 'Ακριβής τοποθεσία στον χάρτη (προαιρετικό)' : 'Precise map location (optional)'}
        </Label>
        <React.Suspense fallback={
          <div className="h-[400px] flex items-center justify-center bg-muted/30 rounded-lg border border-border">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0c281c] mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        }>
          <LazyLocationPicker
            latitude={tripData.latitude}
            longitude={tripData.longitude}
            language={language}
            onLocationChange={(lat, lng) => { update('latitude', lat); update('longitude', lng); }}
          />
        </React.Suspense>
      </div>

      {/* Booking Link — free plan only; premium uses in-app booking */}
      {!isPremium && (
        <div>
          <Label htmlFor="event_url">{language === 'el' ? 'Σύνδεσμος Κράτησης' : 'Booking Link'}</Label>
          <p className="text-xs text-muted-foreground mb-1">
            {language === 'el'
              ? 'Προσθέστε έναν εξωτερικό σύνδεσμο κράτησης (π.χ. Google Forms, Eventbrite).'
              : 'Add an external booking link (e.g. Google Forms, Eventbrite). Premium organizers use the built-in booking system instead.'}
          </p>
          <Input id="event_url" type="url" value={tripData.event_url || ""} onChange={(e) => update('event_url', e.target.value)}
            placeholder={language === 'el' ? 'Π.χ. https://example.com/book' : 'e.g. https://example.com/book'} />
        </div>
      )}

      {/* Difficulty */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="difficulty">{t('create_trip.difficulty_level')}</Label>
          <MobileSelect
            value={tripData.difficulty}
            onValueChange={(v) => update('difficulty', v)}
            options={[
              { value: 'easy', label: t('trip.difficulty_easy') },
              { value: 'moderate', label: t('trip.difficulty_moderate') },
              { value: 'challenging', label: t('trip.difficulty_challenging') },
              { value: 'difficult', label: t('trip.difficulty_difficult') },
            ]}
            placeholder={t('create_trip.difficulty_level')}
            label={t('create_trip.difficulty_level')}
          />
        </div>
      </div>

      {/* Distance & Elevation */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="distance">{t('create_trip.distance')}</Label>
          <Input id="distance" type="number" min="0" step="0.1" value={tripData.distance_km || 0} onChange={(e) => update('distance_km', parseFloat(e.target.value))} />
        </div>
        <div>
          <Label htmlFor="elevation">{t('create_trip.elevation_gain')}</Label>
          <Input id="elevation" type="number" min="0" value={tripData.elevation_gain_m || 0} onChange={(e) => update('elevation_gain_m', parseFloat(e.target.value))} />
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{language === 'el' ? 'Τιμολόγηση' : 'Pricing'}</Label>
          <span className="text-xs text-muted-foreground">
            {language === 'el' ? 'Προσθέστε μία ή περισσότερες επιλογές τιμής' : 'Add one or more price options'}
          </span>
        </div>

        {(tripData.pricing_options || []).length === 0 ? (
          /* Single price mode */
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground w-6">€</span>
            <Input
              id="single-price"
              type="number"
              min="0"
              step="0.01"
              value={tripData.price || 0}
              onChange={(e) => update('price', parseFloat(e.target.value) || 0)}
              className="w-36"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-[44px] text-xs"
              onClick={() => update('pricing_options', [
                { label: language === 'el' ? 'Κανονική' : 'Standard', price: tripData.price || 0 }
              ])}
            >
              <Plus className="w-3 h-3 mr-1" />
              {language === 'el' ? 'Προσθήκη κατηγοριών' : 'Add tiers'}
            </Button>
          </div>
        ) : (
          /* Multiple pricing tiers — inline editable rows */
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_6rem_5rem_2.5rem] gap-2 px-1">
              <span className="text-xs text-muted-foreground">{language === 'el' ? 'Κατηγορία' : 'Label'}</span>
              <span className="text-xs text-muted-foreground">{language === 'el' ? 'Τιμή' : 'Price'}</span>
              <span className="text-xs text-muted-foreground">{language === 'el' ? 'Θέσεις' : 'Slots'}</span>
              <span />
            </div>
            {tripData.pricing_options.map((option, i) => (
              <div key={i} className="grid grid-cols-[1fr_6rem_5rem_2.5rem] items-center gap-2">
                <Input
                  aria-label={language === 'el' ? 'Κατηγορία' : 'Label'}
                  placeholder={language === 'el' ? 'π.χ. Κανονική, Early Bird…' : 'e.g. Standard, Early Bird…'}
                  value={option.label}
                  onChange={(e) => updatePricingOption(i, 'label', e.target.value)}
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                  <Input
                    aria-label={language === 'el' ? 'Τιμή' : 'Price'}
                    type="number"
                    min="0"
                    step="0.01"
                    value={option.price}
                    onChange={(e) => updatePricingOption(i, 'price', e.target.value)}
                    className="pl-7"
                  />
                </div>
                <Input
                  aria-label={language === 'el' ? 'Θέσεις' : 'Slots'}
                  type="number"
                  min="1"
                  placeholder="∞"
                  value={option.slots || ''}
                  onChange={(e) => updatePricingOption(i, 'slots', e.target.value ? parseInt(e.target.value) : null)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (tripData.pricing_options.length === 1) {
                      update('price', option.price || 0);
                      update('pricing_options', []);
                    } else {
                      removePricingOption(i);
                    }
                  }}
                  className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive"
                  aria-label={language === 'el' ? 'Αφαίρεση' : 'Remove'}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPricingOption}
              className="min-h-[44px] text-xs w-full"
            >
              <Plus className="w-3 h-3 mr-1" />
              {language === 'el' ? 'Προσθήκη επιλογής' : 'Add option'}
            </Button>
            {(() => {
              const tierSlotsSum = tripData.pricing_options.reduce((sum, t) => sum + (t.slots || 0), 0);
              const totalSlots = tripData.total_attendees || 0;
              const hasAnyTierSlots = tripData.pricing_options.some(t => t.slots > 0);
              if (!hasAnyTierSlots) {
                return (
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'el'
                      ? 'Αφήστε τις θέσεις κενές για απεριόριστη διαθεσιμότητα ανά κατηγορία.'
                      : 'Leave slots blank for no per-tier limit.'}
                  </p>
                );
              }
              const isOver = tierSlotsSum > totalSlots;
              return (
                <p className={`text-xs mt-1 ${isOver ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                  {isOver
                    ? (language === 'el'
                        ? `Το άθροισμα θέσεων ανά κατηγορία (${tierSlotsSum}) υπερβαίνει τις Συνολικές Θέσεις (${totalSlots}).`
                        : `Tier slots total (${tierSlotsSum}) exceeds Total Slots (${totalSlots}).`)
                    : (language === 'el'
                        ? `Άθροισμα θέσεων: ${tierSlotsSum} / ${totalSlots}`
                        : `Tier slots: ${tierSlotsSum} / ${totalSlots}`)}
                </p>
              );
            })()}
          </div>
        )}
      </div>

      {/* Total Slots */}
      <div>
        <Label htmlFor="slots">{t('create_trip.total_slots')}</Label>
        <Input id="slots" type="number" min="1" value={tripData.total_attendees || 10} onChange={(e) => update('total_attendees', parseInt(e.target.value))} />
      </div>

      {/* Cancellation Policy */}
      <div>
        <Label htmlFor="cancel_policy">{t('create_trip.cancellation_policy')}</Label>
        <Textarea id="cancel_policy" value={tripData.cancel_policy || ""} onChange={(e) => update('cancel_policy', e.target.value)} placeholder={t('create_trip.cancellation_policy_placeholder')} rows={3} />
      </div>

      {/* External Link */}
      <div>
        <Label htmlFor="external">{t('create_trip.external_link')}</Label>
        <Input id="external" type="url" value={tripData.external_link || ""} onChange={(e) => update('external_link', e.target.value)} placeholder={t('create_trip.external_link_placeholder')} />
      </div>

      {/* Image Upload */}
      <div>
        <Label htmlFor="image-upload">{t('create_trip.upload_primary_image')}</Label>
        <div className="flex gap-2">
          <Input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="flex-1" />
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleImageGeneration} 
            disabled={uploadingImage}
            className="min-h-[44px]"
            aria-label={t('create_trip.generate_ai_image')}
          >
            {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : t('create_trip.generate_ai_image')}
          </Button>
        </div>
        {uploadingImage && <p className="text-sm text-muted-foreground">{t('create_trip.uploading')}</p>}
        {tripData.image_url && <img src={tripData.image_url} alt="Preview" className="mt-2 w-full h-48 object-cover rounded-lg" />}
      </div>

      {/* Requirements */}
      <div>
        <Label htmlFor="requirement-input">{t('create_trip.requirements_label')}</Label>
        <div className="flex gap-2 mb-2">
          <Input id="requirement-input" value={currentRequirement} onChange={(e) => setCurrentRequirement(e.target.value)} placeholder={t('create_trip.requirements_placeholder')}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())} />
          <Button 
            type="button" 
            onClick={addRequirement} 
            variant="outline" 
            className="min-h-[44px] min-w-[44px]"
            aria-label={language === 'el' ? 'Προσθήκη απαίτησης' : 'Add requirement'}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {tripData.requirements.map((req, i) => (
            <div key={i} className="flex items-center justify-between bg-muted/30 p-2 rounded">
              <span className="text-sm">{req}</span>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => removeRequirement(i)} 
                className="min-h-[44px] min-w-[44px]"
                aria-label={`${language === 'el' ? 'Αφαίρεση' : 'Remove'} ${req}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Departure From */}
      <div>
        <Label htmlFor="departure-input">{language === 'el' ? 'Αναχώρηση Από' : 'Departure From'}</Label>
        <p className="text-xs text-muted-foreground mb-2">
          {language === 'el' ? 'Προσθέστε τις τοποθεσίες αναχώρησης (π.χ. Αθήνα, Θεσσαλονίκη)' : 'Add departure locations (e.g. Athens, Thessaloniki)'}
        </p>
        <div className="flex gap-2 mb-2">
          <Input id="departure-input" value={currentDeparture} onChange={(e) => setCurrentDeparture(e.target.value)}
            placeholder={language === 'el' ? 'π.χ. Αθήνα' : 'e.g. Athens'}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDeparture())} />
          <Button 
            type="button" 
            onClick={addDeparture} 
            variant="outline" 
            className="min-h-[44px] min-w-[44px]"
            aria-label={language === 'el' ? 'Προσθήκη σημείου αναχώρησης' : 'Add departure location'}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {tripData.departure_from.map((dep, i) => (
            <div key={i} className="flex items-center justify-between bg-muted/30 p-2 rounded">
              <span className="text-sm">{dep}</span>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => removeDeparture(i)} 
                className="min-h-[44px] min-w-[44px]"
                aria-label={`${language === 'el' ? 'Αφαίρεση' : 'Remove'} ${dep}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Trip Status */}
      <div>
        <Label htmlFor="status">{language === 'el' ? 'Κατάσταση Εκδρομής' : 'Trip Status'}</Label>
        <MobileSelect
          value={tripData.status}
          onValueChange={(v) => update('status', v)}
          options={[
            { value: 'draft', label: language === 'el' ? 'Πρόχειρο (δεν θα δημοσιευτεί)' : 'Draft (will not be published)' },
            { value: 'upcoming', label: language === 'el' ? 'Επερχόμενη (θα δημοσιευτεί)' : 'Upcoming (will be published)' },
          ]}
          placeholder={language === 'el' ? 'Κατάσταση Εκδρομής' : 'Trip Status'}
          label={language === 'el' ? 'Κατάσταση Εκδρομής' : 'Trip Status'}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {language === 'el' ? 'Επιλέξτε "Πρόχειρο" για να αποθηκεύσετε χωρίς δημοσίευση.' : 'Select "Draft" to save without publishing.'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          className="w-full sm:w-auto min-h-[44px]"
          aria-label={t('common.cancel')}
        >
          {t('common.cancel')}
        </Button>
        {!isEditing && onSaveDraft && (
          <Button 
            type="submit" 
            variant="outline" 
            onClick={() => onSaveDraft()} 
            disabled={isSubmitting} 
            className="w-full sm:w-auto min-h-[44px] whitespace-normal"
            aria-label={language === 'el' ? 'Αποθήκευση Πρόχειρου' : 'Save as Draft'}
          >
            {isSubmitting ? t('create_trip.creating') : (language === 'el' ? 'Αποθήκευση Πρόχειρου' : 'Save as Draft')}
          </Button>
        )}
        <Button 
          type="submit" 
          className="bg-[#0c281c] hover:bg-[#0c281c]/90 w-full sm:w-auto min-h-[44px]" 
          disabled={isSubmitting}
          aria-label={isEditing 
            ? (language === 'el' ? 'Αποθήκευση Αλλαγών' : 'Save Changes')
            : t('create_trip.create_trip_button')}
        >
          {isSubmitting
            ? (isEditing ? (language === 'el' ? 'Αποθήκευση...' : 'Saving...') : t('create_trip.creating'))
            : (isEditing ? (language === 'el' ? 'Αποθήκευση Αλλαγών' : 'Save Changes') : t('create_trip.create_trip_button'))
          }
        </Button>
      </div>
    </form>
  );
}