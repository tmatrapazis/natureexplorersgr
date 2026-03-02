import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Loader2 } from "lucide-react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../translations/useTranslations';

const availableTags = [
  "beginner-friendly", "sunrise-hike", "sunset-hike", "pet-friendly",
  "family-friendly", "challenging", "camping", "multi-day", "guided",
  "photography", "wildlife", "waterfall", "summit", "coastal", "forest",
  "bus", "organized-carpooling"
];

const emptyTrip = {
  title: "", description: "", start_date: "", end_date: "", location: "",
  difficulty: "moderate", distance_km: 0, elevation_gain_m: 0, total_slots: 10,
  price: 0, pricing_options: [], external_link: "", event_url: "", image_url: "",
  requirements: [], departure_from: [], tags: [], cancel_policy: "", status: "draft"
};

export default function TripForm({ initialData, onSubmit, onCancel, onSaveDraft, isSubmitting, isEditing = false }) {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const [tripData, setTripData] = useState(() => {
    if (!initialData) return emptyTrip;
    return {
      ...emptyTrip,
      ...initialData,
      start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : "",
      end_date: initialData.end_date ? new Date(initialData.end_date).toISOString().split('T')[0] : "",
      requirements: initialData.requirements || [],
      departure_from: initialData.departure_from || [],
      pricing_options: initialData.pricing_options || [],
      tags: initialData.tags || [],
    };
  });

  const [useMultiplePricing, setUseMultiplePricing] = useState(
    !!(initialData?.pricing_options && initialData.pricing_options.length > 0)
  );
  const [currentRequirement, setCurrentRequirement] = useState("");
  const [currentDeparture, setCurrentDeparture] = useState("");
  const [currentPricingLabel, setCurrentPricingLabel] = useState("");
  const [currentPricingPrice, setCurrentPricingPrice] = useState("");
  const [currentPricingDescription, setCurrentPricingDescription] = useState("");
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
        pricing_options: initialData.pricing_options || [],
        tags: initialData.tags || [],
      });
      setUseMultiplePricing(!!(initialData.pricing_options && initialData.pricing_options.length > 0));
    }
  }, [initialData?.id]);

  const update = (key, value) => setTripData(prev => ({ ...prev, [key]: value }));

  const handlePricingModeChange = (checked) => {
    setUseMultiplePricing(checked);
    if (checked) update('price', 0);
    else update('pricing_options', []);
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

  const addPricingOption = () => {
    if (currentPricingLabel.trim() && currentPricingPrice) {
      update('pricing_options', [...tripData.pricing_options, {
        label: currentPricingLabel.trim(),
        price: parseFloat(currentPricingPrice),
        ...(currentPricingDescription.trim() && { description: currentPricingDescription.trim() })
      }]);
      setCurrentPricingLabel(""); setCurrentPricingPrice(""); setCurrentPricingDescription("");
    }
  };
  const removePricingOption = (i) => update('pricing_options', tripData.pricing_options.filter((_, idx) => idx !== i));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update('image_url', file_url);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageGeneration = async () => {
    setUploadingImage(true);
    try {
      const prompt = `Beautiful hiking trail landscape for a ${tripData.difficulty} difficulty hike in ${tripData.location || 'mountains'}, scenic nature photography, high quality`;
      const result = await base44.integrations.Core.GenerateImage({ prompt });
      update('image_url', result.url);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = { ...tripData };
    if (!dataToSubmit.end_date) dataToSubmit.end_date = dataToSubmit.start_date;
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
          <ReactQuill theme="snow" value={tripData.description || ""} onChange={(v) => update('description', v)} style={{ height: '150px', marginBottom: '42px' }} />
        </div>
      </div>

      {/* Tags */}
      <div>
        <Label>{t('create_trip.tags')}</Label>
        <div className="flex flex-wrap gap-2 mt-2 w-full min-w-0">
          {availableTags.map(tag => (
            <Badge key={tag} variant={tripData.tags.includes(tag) ? "default" : "outline"}
              className={`cursor-pointer whitespace-normal break-words text-center ${tripData.tags.includes(tag) ? 'bg-emerald-600' : ''}`}
              onClick={() => toggleTag(tag)}>
              {tag}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-stone-500 mt-2">{t('create_trip.tags_description')}</p>
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
          <p className="text-xs text-stone-500 mt-1">{t('create_trip.end_date_note')}</p>
        </div>
      </div>

      {/* Location */}
      <div>
        <Label htmlFor="location">{t('create_trip.location_region')} *</Label>
        <Input id="location" value={tripData.location} onChange={(e) => update('location', e.target.value)} placeholder={t('create_trip.location_placeholder')} required />
        <p className="text-xs text-stone-500 mt-1">{t('create_trip.location_note')}</p>
      </div>

      {/* Booking Link */}
      <div>
        <Label htmlFor="event_url">{language === 'el' ? 'Σύνδεσμος Κράτησης' : 'Booking Link'}</Label>
        <Input id="event_url" type="url" value={tripData.event_url || ""} onChange={(e) => update('event_url', e.target.value)}
          placeholder={language === 'el' ? 'Π.χ. https://example.com/book' : 'e.g. https://example.com/book'} />
      </div>

      {/* Difficulty */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="difficulty">{t('create_trip.difficulty_level')}</Label>
          <Select value={tripData.difficulty} onValueChange={(v) => update('difficulty', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">{t('trip.difficulty_easy')}</SelectItem>
              <SelectItem value="moderate">{t('trip.difficulty_moderate')}</SelectItem>
              <SelectItem value="challenging">{t('trip.difficulty_challenging')}</SelectItem>
              <SelectItem value="difficult">{t('trip.difficulty_difficult')}</SelectItem>
            </SelectContent>
          </Select>
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
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label>{language === 'el' ? 'Τιμολόγηση' : 'Pricing'}</Label>
          <div className="flex items-center gap-2">
            <Label htmlFor="pricing-mode" className="text-sm font-normal">
              {language === 'el' ? 'Πολλαπλές επιλογές τιμών' : 'Multiple pricing options'}
            </Label>
            <Switch id="pricing-mode" checked={useMultiplePricing} onCheckedChange={handlePricingModeChange} />
          </div>
        </div>
        {useMultiplePricing ? (
          <>
            <p className="text-xs text-stone-500 mb-2">
              {language === 'el' ? 'Προσθέστε διαφορετικές κατηγορίες τιμών (π.χ. Κανονική, Early Bird, Φοιτητική)' : 'Add different pricing categories (e.g., Standard, Early Bird, Student)'}
            </p>
            <div className="flex flex-col md:grid md:grid-cols-12 gap-2 mb-2">
              <Input placeholder={language === 'el' ? 'Κατηγορία' : 'Label'} value={currentPricingLabel} onChange={(e) => setCurrentPricingLabel(e.target.value)} className="md:col-span-3" />
              <Input type="number" min="0" step="0.01" placeholder={language === 'el' ? 'Τιμή' : 'Price'} value={currentPricingPrice} onChange={(e) => setCurrentPricingPrice(e.target.value)} className="md:col-span-2" />
              <Input placeholder={language === 'el' ? 'Περιγραφή (προαιρετικό)' : 'Description (optional)'} value={currentPricingDescription} onChange={(e) => setCurrentPricingDescription(e.target.value)} className="md:col-span-6" />
              <Button type="button" onClick={addPricingOption} variant="outline" className="md:col-span-1"><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-2">
              {tripData.pricing_options.map((option, i) => (
                <div key={i} className="flex items-center justify-between bg-stone-50 p-3 rounded">
                  <div className="flex-1">
                    <span className="font-medium text-sm">{option.label}: €{option.price}</span>
                    {option.description && <p className="text-xs text-stone-500">{option.description}</p>}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removePricingOption(i)}><X className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div>
            <Label htmlFor="single-price">{t('create_trip.price_per_person')}</Label>
            <Input id="single-price" type="number" min="0" step="0.01" value={tripData.price || 0} onChange={(e) => update('price', parseFloat(e.target.value))} />
          </div>
        )}
      </div>

      {/* Total Slots */}
      <div>
        <Label htmlFor="slots">{t('create_trip.total_slots')}</Label>
        <Input id="slots" type="number" min="1" value={tripData.total_slots || 10} onChange={(e) => update('total_slots', parseInt(e.target.value))} />
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
          <Button type="button" variant="outline" onClick={handleImageGeneration} disabled={uploadingImage}>
            {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : t('create_trip.generate_ai_image')}
          </Button>
        </div>
        {uploadingImage && <p className="text-sm text-stone-500">{t('create_trip.uploading')}</p>}
        {tripData.image_url && <img src={tripData.image_url} alt="Preview" className="mt-2 w-full h-48 object-cover rounded-lg" />}
      </div>

      {/* Requirements */}
      <div>
        <Label>{t('create_trip.requirements_label')}</Label>
        <div className="flex gap-2 mb-2">
          <Input value={currentRequirement} onChange={(e) => setCurrentRequirement(e.target.value)} placeholder={t('create_trip.requirements_placeholder')}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())} />
          <Button type="button" onClick={addRequirement} variant="outline"><Plus className="w-4 h-4" /></Button>
        </div>
        <div className="space-y-2">
          {tripData.requirements.map((req, i) => (
            <div key={i} className="flex items-center justify-between bg-stone-50 p-2 rounded">
              <span className="text-sm">{req}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeRequirement(i)}><X className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      </div>

      {/* Departure From */}
      <div>
        <Label>{language === 'el' ? 'Αναχώρηση Από' : 'Departure From'}</Label>
        <p className="text-xs text-stone-500 mb-2">
          {language === 'el' ? 'Προσθέστε τις τοποθεσίες αναχώρησης (π.χ. Αθήνα, Θεσσαλονίκη)' : 'Add departure locations (e.g. Athens, Thessaloniki)'}
        </p>
        <div className="flex gap-2 mb-2">
          <Input value={currentDeparture} onChange={(e) => setCurrentDeparture(e.target.value)}
            placeholder={language === 'el' ? 'π.χ. Αθήνα' : 'e.g. Athens'}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDeparture())} />
          <Button type="button" onClick={addDeparture} variant="outline"><Plus className="w-4 h-4" /></Button>
        </div>
        <div className="space-y-2">
          {tripData.departure_from.map((dep, i) => (
            <div key={i} className="flex items-center justify-between bg-stone-50 p-2 rounded">
              <span className="text-sm">{dep}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeDeparture(i)}><X className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      </div>

      {/* Trip Status */}
      <div>
        <Label htmlFor="status">{language === 'el' ? 'Κατάσταση Εκδρομής' : 'Trip Status'}</Label>
        <Select value={tripData.status} onValueChange={(v) => update('status', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">{language === 'el' ? 'Πρόχειρο (δεν θα δημοσιευτεί)' : 'Draft (will not be published)'}</SelectItem>
            <SelectItem value="upcoming">{language === 'el' ? 'Επερχόμενη (θα δημοσιευτεί)' : 'Upcoming (will be published)'}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-stone-500 mt-1">
          {language === 'el' ? 'Επιλέξτε "Πρόχειρο" για να αποθηκεύσετε χωρίς δημοσίευση.' : 'Select "Draft" to save without publishing.'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          {isEditing ? (language === 'el' ? 'Ακύρωση' : 'Cancel') : t('common.cancel')}
        </Button>
        {extraActions}
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto" disabled={isSubmitting}>
          {isSubmitting
            ? (isEditing ? (language === 'el' ? 'Αποθήκευση...' : 'Saving...') : t('create_trip.creating'))
            : (isEditing ? (language === 'el' ? 'Αποθήκευση Αλλαγών' : 'Save Changes') : t('create_trip.create_trip_button'))
          }
        </Button>
      </div>
    </form>
  );
}