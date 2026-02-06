import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import useSEO from '../components/seo/useSEO';
import { useLanguage } from '../components/contexts/LanguageContext';
import { useTranslation } from '../components/translations/useTranslations';

export default function EditTripPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get("id");

  const [user, setUser] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const { language } = useLanguage();
  const { t } = useTranslation(language);

  // Prevent indexing - this is an authenticated page
  useSEO({
    title: t('create_trip.edit_title'),
    description: 'Edit hiking trip',
    noindex: true
  });

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        if (base44.auth && typeof base44.auth.currentUser !== 'undefined') {
          setUser(base44.auth.currentUser);
        } else if (base44.auth && typeof base44.auth.getUser === 'function') {
          const fetchedUser = await base44.auth.getUser();
          setUser(fetchedUser);
        }
      } catch (error) {
        console.error("Failed to fetch current user from base44 auth:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  const { data: trip, isLoading: isTripLoading } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
        const results = await base44.entities.HikingTrip.filter({ id: tripId });
        return results[0];
    },
    enabled: !!tripId,
  });

  const [tripData, setTripData] = useState(null);
  const [currentRequirement, setCurrentRequirement] = useState("");
  const [currentDeparture, setCurrentDeparture] = useState("");
  const [currentPricingLabel, setCurrentPricingLabel] = useState("");
  const [currentPricingPrice, setCurrentPricingPrice] = useState("");
  const [currentPricingDescription, setCurrentPricingDescription] = useState("");

  useEffect(() => {
    if (trip) {
      setTripData({
        ...trip,
        start_date: trip.start_date ? new Date(trip.start_date).toISOString().split('T')[0] : "",
        end_date: trip.end_date ? new Date(trip.end_date).toISOString().split('T')[0] : "",
        requirements: trip.requirements || [],
        departure_from: trip.departure_from || [],
        pricing_options: trip.pricing_options || [],
        tags: trip.tags || [],
        cancel_policy: trip.cancel_policy || "",
        status: trip.status || "draft"
      });
    }
  }, [trip]);

  const updateTripMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.HikingTrip.update(tripId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hiking-trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      navigate(createPageUrl("MyTrips"));
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tripData) return;
    
    // Remove system fields that shouldn't be updated
    const { created_date, updated_date, id, created_by, view_count, organizer_name, organizer_is_verified, organizer_email, computedStatus, ...dataToSubmit } = tripData;
    
    // Ensure end_date is set
    if (!dataToSubmit.end_date) {
      dataToSubmit.end_date = dataToSubmit.start_date;
    }
    
    await updateTripMutation.mutateAsync(dataToSubmit);
    setIsFormDirty(false);
  };

  const handleNavigateAway = (destination) => {
    if (isFormDirty) {
      setPendingNavigation(destination);
      setShowExitDialog(true);
    } else {
      navigate(destination);
    }
  };

  const handleSaveAndExit = async () => {
    const form = document.querySelector('form');
    if (form) {
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
    }
    setShowExitDialog(false);
  };

  const handleDiscardAndExit = () => {
    setIsFormDirty(false);
    setShowExitDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isFormDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormDirty]);
  
  const handleInputChange = (key, value) => {
      setTripData(prev => ({...prev, [key]: value}));
      setIsFormDirty(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleInputChange('image_url', file_url);
    } catch (error) {
      console.error("Image upload failed", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const addRequirement = () => {
    if (currentRequirement.trim()) {
      handleInputChange('requirements', [...tripData.requirements, currentRequirement.trim()]);
      setCurrentRequirement("");
    }
  };

  const removeRequirement = (index) => {
    handleInputChange('requirements', tripData.requirements.filter((_, i) => i !== index));
  };

  const addDeparture = () => {
    if (currentDeparture.trim()) {
      handleInputChange('departure_from', [...tripData.departure_from, currentDeparture.trim()]);
      setCurrentDeparture("");
    }
  };

  const removeDeparture = (index) => {
    handleInputChange('departure_from', tripData.departure_from.filter((_, i) => i !== index));
  };

  const toggleTag = (tag) => {
    if (tripData.tags.includes(tag)) {
      handleInputChange('tags', tripData.tags.filter(t => t !== tag));
    } else {
      handleInputChange('tags', [...tripData.tags, tag]);
    }
  };

  const addPricingOption = () => {
    if (currentPricingLabel.trim() && currentPricingPrice) {
      const newOption = {
        label: currentPricingLabel.trim(),
        price: parseFloat(currentPricingPrice),
        ...(currentPricingDescription.trim() && { description: currentPricingDescription.trim() })
      };
      handleInputChange('pricing_options', [...tripData.pricing_options, newOption]);
      setCurrentPricingLabel("");
      setCurrentPricingPrice("");
      setCurrentPricingDescription("");
    }
  };

  const removePricingOption = (index) => {
    handleInputChange('pricing_options', tripData.pricing_options.filter((_, i) => i !== index));
  };

  const handleImageGeneration = async () => {
    setUploadingImage(true);
    try {
      const prompt = `Beautiful hiking trail landscape for a ${tripData.difficulty} difficulty hike in ${tripData.location || 'mountains'}, scenic nature photography, high quality`;
      const result = await base44.integrations.Core.GenerateImage({ prompt });
      handleInputChange('image_url', result.url);
    } finally {
      setUploadingImage(false);
    }
  };



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
    "forest",
    "bus",
    "organized-carpooling"
  ];
  
  if (isTripLoading || !tripData) {
      return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600"/>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="outline" 
          className="mb-6"
          onClick={() => handleNavigateAway(createPageUrl("MyTrips"))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('create_trip.back_to_trips')}
        </Button>

        <Card className="p-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-6">{t('create_trip.edit_title')}</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">{t('create_trip.trip_title')} *</Label>
              <Input id="title" value={tripData.title} onChange={(e) => handleInputChange('title', e.target.value)} required />
            </div>

            <div>
              <Label htmlFor="description">{t('create_trip.description')}</Label>
              <Textarea id="description" value={tripData.description || ""} onChange={(e) => handleInputChange('description', e.target.value)} rows={4} />
            </div>

            <div>
              <Label>{t('create_trip.tags')}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={tripData.tags.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer ${tripData.tags.includes(tag) ? 'bg-emerald-600' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-stone-500 mt-2">{t('create_trip.tags_description')}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">{t('create_trip.start_date')} *</Label>
                <Input id="start_date" type="date" value={tripData.start_date} onChange={(e) => handleInputChange('start_date', e.target.value)} required />
              </div>

              <div>
                <Label htmlFor="end_date">{t('create_trip.end_date')} *</Label>
                <Input id="end_date" type="date" value={tripData.end_date} min={tripData.start_date} onChange={(e) => handleInputChange('end_date', e.target.value)} required />
                 <p className="text-xs text-stone-500 mt-1">{t('create_trip.end_date_note')}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="location">{t('create_trip.location_region')} *</Label>
              <Input id="location" value={tripData.location} onChange={(e) => handleInputChange('location', e.target.value)} placeholder={t('create_trip.location_placeholder')} required />
              <p className="text-xs text-stone-500 mt-1">{t('create_trip.location_note')}</p>
            </div>

            <div>
              <Label htmlFor="event_url">{language === 'el' ? 'Σύνδεσμος Κράτησης' : 'Booking Link'} *</Label>
              <Input
                id="event_url"
                type="url"
                value={tripData.event_url || ""}
                onChange={(e) => handleInputChange('event_url', e.target.value)}
                placeholder={language === 'el' ? 'Π.χ. https://example.com/book' : 'e.g. https://example.com/book'}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="difficulty">{t('create_trip.difficulty_level')}</Label>
                <Select value={tripData.difficulty} onValueChange={(value) => handleInputChange('difficulty', value)}>
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

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="distance">{t('create_trip.distance')}</Label>
                <Input id="distance" type="number" min="0" step="0.1" value={tripData.distance_km || 0} onChange={(e) => handleInputChange('distance_km', parseFloat(e.target.value))} />
              </div>

              <div>
                <Label htmlFor="elevation">{t('create_trip.elevation_gain')}</Label>
                <Input id="elevation" type="number" min="0" value={tripData.elevation_gain_m || 0} onChange={(e) => handleInputChange('elevation_gain_m', parseInt(e.target.value))} />
              </div>
            </div>

            <div>
              <Label>{language === 'el' ? 'Επιλογές Τιμολόγησης' : 'Pricing Options'}</Label>
              <p className="text-xs text-stone-500 mb-2">
                {language === 'el' 
                  ? 'Προσθέστε διαφορετικές κατηγορίες τιμών (π.χ. Κανονική, Early Bird, Φοιτητική)'
                  : 'Add different pricing categories (e.g., Standard, Early Bird, Student)'}
              </p>
              <div className="space-y-2 mb-2">
                <div className="grid grid-cols-12 gap-2">
                  <Input
                    placeholder={language === 'el' ? 'Κατηγορία' : 'Label'}
                    value={currentPricingLabel}
                    onChange={(e) => setCurrentPricingLabel(e.target.value)}
                    className="col-span-3"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={language === 'el' ? 'Τιμή' : 'Price'}
                    value={currentPricingPrice}
                    onChange={(e) => setCurrentPricingPrice(e.target.value)}
                    className="col-span-2"
                  />
                  <Input
                    placeholder={language === 'el' ? 'Περιγραφή (προαιρετικό)' : 'Description (optional)'}
                    value={currentPricingDescription}
                    onChange={(e) => setCurrentPricingDescription(e.target.value)}
                    className="col-span-6"
                  />
                  <Button type="button" onClick={addPricingOption} variant="outline" className="col-span-1">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {tripData.pricing_options.map((option, index) => (
                  <div key={index} className="flex items-center justify-between bg-stone-50 p-3 rounded">
                    <div className="flex-1">
                      <span className="font-medium text-sm">{option.label}: €{option.price}</span>
                      {option.description && <p className="text-xs text-stone-500">{option.description}</p>}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePricingOption(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {tripData.pricing_options.length === 0 && (
                <div className="mt-2">
                  <Label htmlFor="legacy-price">{t('create_trip.price_per_person')}</Label>
                  <Input
                    id="legacy-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={tripData.price || 0}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-stone-500 mt-1">
                    {language === 'el' 
                      ? 'Χρησιμοποιήστε αυτό το πεδίο για μονή τιμή ή προσθέστε πολλαπλές επιλογές τιμολόγησης παραπάνω'
                      : 'Use this field for single price or add multiple pricing options above'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="slots">{t('create_trip.total_slots')}</Label>
              <Input id="slots" type="number" min="1" value={tripData.total_slots || 10} onChange={(e) => handleInputChange('total_slots', parseInt(e.target.value))} />
            </div>

            <div>
              <Label htmlFor="cancel_policy">{t('create_trip.cancellation_policy')}</Label>
              <Textarea
                id="cancel_policy"
                value={tripData.cancel_policy || ""}
                onChange={(e) => handleInputChange('cancel_policy', e.target.value)}
                placeholder={t('create_trip.cancellation_policy_placeholder')}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="status">{language === 'el' ? 'Κατάσταση Εκδρομής' : 'Trip Status'}</Label>
              <Select
                value={tripData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{language === 'el' ? 'Πρόχειρο (δεν θα δημοσιευτεί)' : 'Draft (will not be published)'}</SelectItem>
                  <SelectItem value="upcoming">{language === 'el' ? 'Επερχόμενη (θα δημοσιευτεί)' : 'Upcoming (will be published)'}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-stone-500 mt-1">
                {language === 'el' 
                  ? 'Επιλέξτε "Πρόχειρο" για να αποθηκεύσετε την εκδρομή χωρίς να τη δημοσιεύσετε. Μπορείτε να την δημοσιεύσετε αργότερα αλλάζοντας την κατάσταση.'
                  : 'Select "Draft" to save the trip without publishing it. You can publish it later by changing the status.'}
              </p>
            </div>
            
            <div>
              <Label htmlFor="external">{t('create_trip.external_link')}</Label>
              <Input
                id="external"
                type="url"
                value={tripData.external_link || ""}
                onChange={(e) => handleInputChange('external_link', e.target.value)}
                placeholder={t('create_trip.external_link_placeholder')}
              />
            </div>

            <div>
              <Label htmlFor="image-upload">{t('create_trip.upload_primary_image')}</Label>
              <div className="flex gap-2">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleImageGeneration}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : t('create_trip.generate_ai_image')}
                </Button>
              </div>
              {uploadingImage && <p className="text-sm text-stone-500">{t('create_trip.uploading')}</p>}
              {tripData.image_url && (
                <img 
                  src={tripData.image_url} 
                  alt="Preview" 
                  className="mt-2 w-full h-48 object-cover rounded-lg"
                />
              )}
            </div>

            <div>
              <Label>{t('create_trip.requirements_label')}</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={currentRequirement}
                  onChange={(e) => setCurrentRequirement(e.target.value)}
                  placeholder={t('create_trip.requirements_placeholder')}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                />
                <Button type="button" onClick={addRequirement} variant="outline"><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-2">
                {tripData.requirements.map((req, index) => (
                  <div key={index} className="flex items-center justify-between bg-stone-50 p-2 rounded">
                    <span className="text-sm">{req}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeRequirement(index)}><X className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>{language === 'el' ? 'Αναχώρηση Από' : 'Departure From'} *</Label>
              <p className="text-xs text-stone-500 mb-2">
                {language === 'el' 
                  ? 'Προσθέστε τις τοποθεσίες αναχώρησης (π.χ. Αθήνα, Θεσσαλονίκη)'
                  : 'Add departure locations (e.g. Athens, Thessaloniki)'}
              </p>
              <div className="flex gap-2 mb-2">
                <Input
                  value={currentDeparture}
                  onChange={(e) => setCurrentDeparture(e.target.value)}
                  placeholder={language === 'el' ? 'π.χ. Αθήνα' : 'e.g. Athens'}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDeparture())}
                />
                <Button type="button" onClick={addDeparture} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {tripData.departure_from.map((departure, index) => (
                  <div key={index} className="flex items-center justify-between bg-stone-50 p-2 rounded">
                    <span className="text-sm">{departure}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDeparture(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => handleNavigateAway(createPageUrl("MyTrips"))}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={updateTripMutation.isPending}>
                {updateTripMutation.isPending ? (language === 'el' ? 'Αποθήκευση...' : 'Saving...') : (language === 'el' ? 'Αποθήκευση Αλλαγών' : 'Save Changes')}
              </Button>
            </div>
          </form>
        </Card>

        <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {language === 'el' ? 'Μη αποθηκευμένες αλλαγές' : 'Unsaved Changes'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {language === 'el' 
                  ? 'Έχετε μη αποθηκευμένες αλλαγές. Θέλετε να τις αποθηκεύσετε πριν φύγετε;'
                  : 'You have unsaved changes. Would you like to save them before leaving?'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleDiscardAndExit}>
                {language === 'el' ? 'Απόρριψη Αλλαγών' : 'Discard Changes'}
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => setShowExitDialog(false)}>
                {language === 'el' ? 'Ακύρωση' : 'Cancel'}
              </AlertDialogAction>
              <AlertDialogAction onClick={handleSaveAndExit} className="bg-emerald-600 hover:bg-emerald-700">
                {language === 'el' ? 'Αποθήκευση & Έξοδος' : 'Save & Exit'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}