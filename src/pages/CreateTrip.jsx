import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, X, Loader2, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import useSEO from '../components/seo/useSEO';
import { useLanguage } from '../components/contexts/LanguageContext';
import { useTranslation } from '../components/translations/useTranslations';

export default function CreateTripPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  // Prevent indexing - this is an authenticated page
  useSEO({
    title: t('create_trip.title'),
    description: 'Create hiking trip',
    noindex: true
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  // Check if user has an organizer_code linked
  const hasOrganizerCode = user?.organizer_code;

  const [tripData, setTripData] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    location: "",
    difficulty: "moderate",
    distance_km: 0,
    elevation_gain_m: 0,
    total_slots: 10,
    price: 0,
    external_link: "",
    image_url: "",
    requirements: [],
    departure_from: [],
    tags: [],
    cancel_policy: "",
    status: "draft"
  });

  const [currentRequirement, setCurrentRequirement] = useState("");
  const [currentDeparture, setCurrentDeparture] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Load data from navigation state if recreating a trip
  useEffect(() => {
    if (location.state?.tripData) {
      const data = location.state.tripData;
      setTripData({
        ...data,
        start_date: "",
        end_date: "",
        status: "draft",
        requirements: data.requirements || [],
        tags: data.tags || []
      });
    }
  }, [location.state]);

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

  const createTripMutation = useMutation({
    mutationFn: async (data) => {
      if (!user?.organizer_code) {
        throw new Error("You must be linked to an Organizer profile to create trips");
      }
      return await base44.entities.HikingTrip.create({
        ...data,
        organizer_code: user.organizer_code
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hiking-trips'] });
      navigate(createPageUrl("MyTrips"));
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async (data) => {
      if (!user?.organizer_code) {
        throw new Error("You must be linked to an Organizer profile to create trips");
      }
      return await base44.entities.HikingTrip.create({
        ...data,
        organizer_code: user.organizer_code,
        status: "draft"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hiking-trips'] });
      navigate(createPageUrl("MyTrips"));
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hasOrganizerCode) {
      alert("You need to be linked to an Organizer profile to create trips. Please contact an admin.");
      return;
    }
    
    const dataToSubmit = { ...tripData };
    if (!dataToSubmit.end_date) {
      dataToSubmit.end_date = dataToSubmit.start_date;
    }
    
    await createTripMutation.mutateAsync(dataToSubmit);
  };

  const handleSaveDraft = async () => {
    if (!hasOrganizerCode) {
      alert("You need to be linked to an Organizer profile to create trips. Please contact an admin.");
      return;
    }
    
    const dataToSubmit = { ...tripData };
    if (!dataToSubmit.end_date) {
      dataToSubmit.end_date = dataToSubmit.start_date;
    }
    
    await saveDraftMutation.mutateAsync(dataToSubmit);
  };

  const addRequirement = () => {
    if (currentRequirement.trim()) {
      setTripData({
        ...tripData,
        requirements: [...tripData.requirements, currentRequirement.trim()]
      });
      setCurrentRequirement("");
    }
  };

  const removeRequirement = (index) => {
    setTripData({
      ...tripData,
      requirements: tripData.requirements.filter((_, i) => i !== index)
    });
  };

  const addDeparture = () => {
    if (currentDeparture.trim()) {
      setTripData({
        ...tripData,
        departure_from: [...tripData.departure_from, currentDeparture.trim()]
      });
      setCurrentDeparture("");
    }
  };

  const removeDeparture = (index) => {
    setTripData({
      ...tripData,
      departure_from: tripData.departure_from.filter((_, i) => i !== index)
    });
  };

  const toggleTag = (tag) => {
    if (tripData.tags.includes(tag)) {
      setTripData({
        ...tripData,
        tags: tripData.tags.filter(t => t !== tag)
      });
    } else {
      setTripData({
        ...tripData,
        tags: [...tripData.tags, tag]
      });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setTripData({ ...tripData, image_url: file_url });
    } catch (error) {
      console.error("Image upload failed", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageGeneration = async () => {
    setUploadingImage(true);
    try {
      const prompt = `Beautiful hiking trail landscape for a ${tripData.difficulty} difficulty hike in ${tripData.location || 'mountains'}, scenic nature photography, high quality`;
      const result = await base44.integrations.Core.GenerateImage({ prompt });
      setTripData({ ...tripData, image_url: result.url });
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Link to={createPageUrl("MyTrips")}>
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('create_trip.back_to_trips')}
          </Button>
        </Link>

        <Card className="p-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-6">{t('create_trip.title')}</h1>

          {!hasOrganizerCode && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-amber-800 font-medium">
                {language === 'el'
                  ? 'Πρέπει να συνδεθείτε με ένα προφίλ Διοργανωτή για να δημιουργήσετε εκδρομές. Παρακαλώ επικοινωνήστε με έναν διαχειριστή για να ρυθμίσετε το προφίλ σας ως διοργανωτή.'
                  : 'You need to be linked to an Organizer profile to create trips. Please contact an admin to set up your organizer profile.'}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">{t('create_trip.trip_title')} *</Label>
              <Input
                id="title"
                value={tripData.title}
                onChange={(e) => setTripData({...tripData, title: e.target.value})}
                placeholder={t('create_trip.trip_title_placeholder')}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">{t('create_trip.description')}</Label>
              <Textarea
                id="description"
                value={tripData.description}
                onChange={(e) => setTripData({...tripData, description: e.target.value})}
                placeholder={t('create_trip.description_placeholder')}
                rows={4}
              />
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
                <Input
                  id="start_date"
                  type="date"
                  value={tripData.start_date}
                  onChange={(e) => setTripData({...tripData, start_date: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="end_date">{t('create_trip.end_date')} *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={tripData.end_date}
                  min={tripData.start_date}
                  onChange={(e) => setTripData({...tripData, end_date: e.target.value})}
                  required
                />
                 <p className="text-xs text-stone-500 mt-1">{t('create_trip.end_date_note')}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="location">{t('create_trip.location_region')} *</Label>
              <Input
                id="location"
                value={tripData.location}
                onChange={(e) => setTripData({...tripData, location: e.target.value})}
                placeholder={t('create_trip.location_placeholder')}
                required
              />
              <p className="text-xs text-stone-500 mt-1">{t('create_trip.location_note')}</p>
            </div>

            <div>
              <Label htmlFor="event_url">{language === 'el' ? 'Σύνδεσμος Κράτησης' : 'Booking Link'} *</Label>
              <Input
                id="event_url"
                type="url"
                value={tripData.event_url}
                onChange={(e) => setTripData({...tripData, event_url: e.target.value})}
                placeholder={language === 'el' ? 'Π.χ. https://example.com/book' : 'e.g. https://example.com/book'}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="difficulty">{t('create_trip.difficulty_level')}</Label>
                <Select
                  value={tripData.difficulty}
                  onValueChange={(value) => setTripData({...tripData, difficulty: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Input
                  id="distance"
                  type="number"
                  min="0"
                  step="0.1"
                  value={tripData.distance_km}
                  onChange={(e) => setTripData({...tripData, distance_km: parseFloat(e.target.value)})}
                />
              </div>

              <div>
                <Label htmlFor="elevation">{t('create_trip.elevation_gain')}</Label>
                <Input
                  id="elevation"
                  type="number"
                  min="0"
                  value={tripData.elevation_gain_m}
                  onChange={(e) => setTripData({...tripData, elevation_gain_m: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">{t('create_trip.price_per_person')} *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={tripData.price}
                  onChange={(e) => setTripData({...tripData, price: parseFloat(e.target.value)})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="slots">{t('create_trip.total_slots')}</Label>
                <Input
                  id="slots"
                  type="number"
                  min="1"
                  value={tripData.total_slots}
                  onChange={(e) => setTripData({...tripData, total_slots: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cancel_policy">{t('create_trip.cancellation_policy')}</Label>
              <Textarea
                id="cancel_policy"
                value={tripData.cancel_policy}
                onChange={(e) => setTripData({...tripData, cancel_policy: e.target.value})}
                placeholder={t('create_trip.cancellation_policy_placeholder')}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="status">{language === 'el' ? 'Κατάσταση Εκδρομής' : 'Trip Status'}</Label>
              <Select
                value={tripData.status}
                onValueChange={(value) => setTripData({...tripData, status: value})}
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
                value={tripData.external_link}
                onChange={(e) => setTripData({...tripData, external_link: e.target.value})}
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
                <Button type="button" onClick={addRequirement} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {tripData.requirements.map((req, index) => (
                  <div key={index} className="flex items-center justify-between bg-stone-50 p-2 rounded">
                    <span className="text-sm">{req}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRequirement(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(createPageUrl("MyTrips"))}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saveDraftMutation.isPending || createTripMutation.isPending}
              >
                {saveDraftMutation.isPending ? t('create_trip.saving') : (language === 'el' ? 'Αποθήκευση Πρόχειρου' : 'Save as Draft')}
              </Button>
              <Button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={createTripMutation.isPending || saveDraftMutation.isPending}
              >
                {createTripMutation.isPending ? t('create_trip.creating') : t('create_trip.create_trip_button')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}