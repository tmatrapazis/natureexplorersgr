import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
    start_time: "",
    duration_hours: 4,
    location: "", // General location/region
    meeting_points: [], // Array for multiple meeting points
    difficulty: "moderate",
    distance_km: 0,
    elevation_gain_m: 0,
    min_participants: 1,
    max_participants: 0,
    total_slots: 10,
    price: 0,
    external_link: "",
    image_url: "",
    gallery_images: [],
    requirements: [],
    tags: [],
    cancel_policy: "",
    organizer_notes: "",
    gpx_file_url: ""
  });

  const [currentRequirement, setCurrentRequirement] = useState("");
  const [currentTag, setCurrentTag] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newMeetingPoint, setNewMeetingPoint] = useState({
    name: "",
    location: "",
    time: ""
  });

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
    "forest"
  ];

  const createTripMutation = useMutation({
    mutationFn: async (data) => {
      if (!user?.organizer_code) {
        throw new Error("You must be linked to an Organizer profile to create trips");
      }
      return await base44.entities.HikingTrip.create({
        ...data,
        organizer_code: user.organizer_code,
        status: "upcoming"
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
    if (!dataToSubmit.max_participants || dataToSubmit.max_participants === 0) {
      dataToSubmit.max_participants = dataToSubmit.total_slots;
    }
    
    await createTripMutation.mutateAsync(dataToSubmit);
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

  const handleGalleryImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || tripData.gallery_images.length >= 5) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setTripData({
        ...tripData,
        gallery_images: [...tripData.gallery_images, file_url]
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeGalleryImage = (index) => {
    setTripData({
      ...tripData,
      gallery_images: tripData.gallery_images.filter((_, i) => i !== index)
    });
  };

  const handleGPXUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setTripData({ ...tripData, gpx_file_url: file_url });
    } finally {
      setUploadingImage(false);
    }
  };

  const addMeetingPoint = () => {
    if (newMeetingPoint.name.trim() && newMeetingPoint.location.trim()) {
      setTripData({
        ...tripData,
        meeting_points: [...tripData.meeting_points, newMeetingPoint]
      });
      setNewMeetingPoint({ name: "", location: "", time: "" });
    }
  };

  const removeMeetingPoint = (index) => {
    setTripData({
      ...tripData,
      meeting_points: tripData.meeting_points.filter((_, i) => i !== index)
    });
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
                <Label htmlFor="end_date">{t('create_trip.end_date')}</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={tripData.end_date}
                  min={tripData.start_date}
                  onChange={(e) => setTripData({...tripData, end_date: e.target.value})}
                />
                 <p className="text-xs text-stone-500 mt-1">{t('create_trip.end_date_note')}</p>
              </div>
            </div>

            <div>
                <Label htmlFor="time">{t('create_trip.start_time')}</Label>
                <Input
                  id="time"
                  type="time"
                  value={tripData.start_time}
                  onChange={(e) => setTripData({...tripData, start_time: e.target.value})}
                />
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
              <Label>{t('create_trip.meeting_points')}</Label>
              <p className="text-xs text-stone-500 mb-3">{t('create_trip.meeting_points_description')}</p>
              
              {tripData.meeting_points.length > 0 && (
                <div className="space-y-2 mb-4">
                  {tripData.meeting_points.map((point, index) => (
                    <div key={index} className="bg-stone-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4 text-emerald-600" />
                            <p className="font-medium text-stone-900">{point.name}</p>
                          </div>
                          <p className="text-sm text-stone-600 ml-6">{point.location}</p>
                          {point.time && (
                            <div className="flex items-center gap-2 mt-1 ml-6">
                              <Clock className="w-3 h-3 text-stone-500" />
                              <p className="text-sm text-stone-600">{point.time}</p>
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMeetingPoint(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 border rounded-lg p-4 bg-white">
                <Input
                  placeholder={t('create_trip.meeting_point_name_placeholder')}
                  value={newMeetingPoint.name}
                  onChange={(e) => setNewMeetingPoint({ ...newMeetingPoint, name: e.target.value })}
                />
                <Input
                  placeholder={t('create_trip.meeting_point_location_placeholder')}
                  value={newMeetingPoint.location}
                  onChange={(e) => setNewMeetingPoint({ ...newMeetingPoint, location: e.target.value })}
                />
                <Input
                  type="time"
                  placeholder={t('create_trip.meeting_point_time')}
                  value={newMeetingPoint.time}
                  onChange={(e) => setNewMeetingPoint({ ...newMeetingPoint, time: e.target.value })}
                />
                <Button
                  type="button"
                  onClick={addMeetingPoint}
                  variant="outline"
                  className="w-full"
                  disabled={!newMeetingPoint.name.trim() || !newMeetingPoint.location.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('create_trip.add_meeting_point')}
                </Button>
              </div>
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

              <div>
                <Label htmlFor="duration">{t('create_trip.duration_hours')}</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  step="0.5"
                  value={tripData.duration_hours}
                  onChange={(e) => setTripData({...tripData, duration_hours: parseFloat(e.target.value)})}
                />
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

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="min">{t('create_trip.min_participants')}</Label>
                <Input
                  id="min"
                  type="number"
                  min="1"
                  value={tripData.min_participants}
                  onChange={(e) => setTripData({...tripData, min_participants: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <Label htmlFor="max">{t('create_trip.max_participants')}</Label>
                <Input
                  id="max"
                  type="number"
                  min="1"
                  value={tripData.max_participants}
                  onChange={(e) => setTripData({...tripData, max_participants: parseInt(e.target.value)})}
                  placeholder={t('create_trip.max_participants_note')}
                />
              </div>

              <div>
                <Label htmlFor="slots">{t('create_trip.total_slots')} *</Label>
                <Input
                  id="slots"
                  type="number"
                  min="1"
                  value={tripData.total_slots}
                  onChange={(e) => setTripData({...tripData, total_slots: parseInt(e.target.value)})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="price">{t('create_trip.price_per_person')}</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={tripData.price}
                onChange={(e) => setTripData({...tripData, price: parseFloat(e.target.value)})}
              />
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
              <Label htmlFor="organizer_notes">{t('create_trip.organizer_notes')}</Label>
              <Textarea
                id="organizer_notes"
                value={tripData.organizer_notes}
                onChange={(e) => setTripData({...tripData, organizer_notes: e.target.value})}
                placeholder={t('create_trip.organizer_notes_placeholder')}
                rows={3}
              />
              <p className="text-xs text-stone-500 mt-1">{t('create_trip.organizer_notes_description')}</p>
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
              <Label>{t('create_trip.gallery_images')}</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleGalleryImageUpload}
                disabled={uploadingImage || tripData.gallery_images.length >= 5}
              />
              {tripData.gallery_images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {tripData.gallery_images.map((url, index) => (
                    <div key={index} className="relative">
                      <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-24 object-cover rounded" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1"
                        onClick={() => removeGalleryImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="gpx">{t('create_trip.gpx_file')}</Label>
              <Input
                id="gpx"
                type="file"
                accept=".gpx"
                onChange={handleGPXUpload}
                disabled={uploadingImage}
              />
              {tripData.gpx_file_url && (
                <p className="text-sm text-emerald-600 mt-1">✓ {t('create_trip.gpx_uploaded')}</p>
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

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(createPageUrl("MyTrips"))}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={createTripMutation.isPending}
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