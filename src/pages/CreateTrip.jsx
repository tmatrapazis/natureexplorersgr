
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
import { useLanguage } from '../components/language-provider';
import { useTranslation } from 'react-i18next';

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
      return await base44.entities.HikingTrip.create({
        ...data,
        organizer_id: user.id,
        organizer_name: user.username || user.full_name,
        organizer_is_verified: user.is_verified_organizer || false,
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
    const dataToSubmit = { ...tripData };
    if (!dataToSubmit.end_date) {
      dataToSubmit.end_date = dataToSubmit.start_date;
    }
    if (!dataToSubmit.max_participants || dataToSubmit.max_participants === 0) {
      dataToSubmit.max_participants = dataToSubmit.total_slots;
    }
    
    // Add organizer email for notifications
    dataToSubmit.organizer_email = user.email;
    
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
            Back to My Trips
          </Button>
        </Link>

        <Card className="p-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-6">Create New Hiking Trip</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Trip Title *</Label>
              <Input
                id="title"
                value={tripData.title}
                onChange={(e) => setTripData({...tripData, title: e.target.value})}
                placeholder="e.g., Sunset Peak Trail Adventure"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={tripData.description}
                onChange={(e) => setTripData({...tripData, description: e.target.value})}
                placeholder="Describe the trail, what to expect, highlights..."
                rows={4}
              />
            </div>

            <div>
              <Label>Trip Tags</Label>
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
              <p className="text-xs text-stone-500 mt-2">Click tags to add them to your trip</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={tripData.start_date}
                  onChange={(e) => setTripData({...tripData, start_date: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={tripData.end_date}
                  min={tripData.start_date}
                  onChange={(e) => setTripData({...tripData, end_date: e.target.value})}
                />
                 <p className="text-xs text-stone-500 mt-1">Leave blank for single-day trips.</p>
              </div>
            </div>

            <div>
                <Label htmlFor="time">Start Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={tripData.start_time}
                  onChange={(e) => setTripData({...tripData, start_time: e.target.value})}
                />
            </div>

            <div>
              <Label htmlFor="location">General Location/Region *</Label>
              <Input
                id="location"
                value={tripData.location}
                onChange={(e) => setTripData({...tripData, location: e.target.value})}
                placeholder="e.g., Mount Olympus, Crete"
                required
              />
              <p className="text-xs text-stone-500 mt-1">The general area/region for this trip</p>
            </div>

            <div>
              <Label>Meeting Points</Label>
              <p className="text-xs text-stone-500 mb-3">Add one or more meeting points where hikers can join the trip</p>
              
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
                  placeholder="Meeting point name (e.g., Trailhead Parking Lot)"
                  value={newMeetingPoint.name}
                  onChange={(e) => setNewMeetingPoint({ ...newMeetingPoint, name: e.target.value })}
                />
                <Input
                  placeholder="Location (address or coordinates)"
                  value={newMeetingPoint.location}
                  onChange={(e) => setNewMeetingPoint({ ...newMeetingPoint, location: e.target.value })}
                />
                <Input
                  type="time"
                  placeholder="Meeting time (optional)"
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
                  Add Meeting Point
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={tripData.difficulty}
                  onValueChange={(value) => setTripData({...tripData, difficulty: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="challenging">Challenging</SelectItem>
                    <SelectItem value="difficult">Difficult</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration">Duration (hours)</Label>
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
                <Label htmlFor="distance">Distance (km)</Label>
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
                <Label htmlFor="elevation">Elevation Gain (m)</Label>
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
                <Label htmlFor="min">Min Participants</Label>
                <Input
                  id="min"
                  type="number"
                  min="1"
                  value={tripData.min_participants}
                  onChange={(e) => setTripData({...tripData, min_participants: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <Label htmlFor="max">Max Participants</Label>
                <Input
                  id="max"
                  type="number"
                  min="1"
                  value={tripData.max_participants}
                  onChange={(e) => setTripData({...tripData, max_participants: parseInt(e.target.value)})}
                  placeholder="Leave 0 for total slots"
                />
              </div>

              <div>
                <Label htmlFor="slots">Total Slots *</Label>
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
              <Label htmlFor="price">Price per Person ($)</Label>
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
              <Label htmlFor="cancel_policy">Cancellation Policy</Label>
              <Textarea
                id="cancel_policy"
                value={tripData.cancel_policy}
                onChange={(e) => setTripData({...tripData, cancel_policy: e.target.value})}
                placeholder="e.g., Full refund if cancelled 48h before trip start..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="organizer_notes">Organizer Notes (Private)</Label>
              <Textarea
                id="organizer_notes"
                value={tripData.organizer_notes}
                onChange={(e) => setTripData({...tripData, organizer_notes: e.target.value})}
                placeholder="Notes visible only to hikers with accepted bookings..."
                rows={3}
              />
              <p className="text-xs text-stone-500 mt-1">This will only be shown to confirmed participants</p>
            </div>

            <div>
              <Label htmlFor="external">External Link (Optional)</Label>
              <Input
                id="external"
                type="url"
                value={tripData.external_link}
                onChange={(e) => setTripData({...tripData, external_link: e.target.value})}
                placeholder="https://example.com or Facebook event link"
              />
            </div>

            <div>
              <Label htmlFor="image-upload">Upload Primary Image</Label>
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
                  {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate AI Image'}
                </Button>
              </div>
              {uploadingImage && <p className="text-sm text-stone-500">Uploading...</p>}
              {tripData.image_url && (
                <img 
                  src={tripData.image_url} 
                  alt="Preview" 
                  className="mt-2 w-full h-48 object-cover rounded-lg"
                />
              )}
            </div>

            <div>
              <Label>Gallery Images (Max 5)</Label>
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
              <Label htmlFor="gpx">GPX Route File (Optional)</Label>
              <Input
                id="gpx"
                type="file"
                accept=".gpx"
                onChange={handleGPXUpload}
                disabled={uploadingImage}
              />
              {tripData.gpx_file_url && (
                <p className="text-sm text-emerald-600 mt-1">✓ GPX file uploaded</p>
              )}
            </div>

            <div>
              <Label>What to Bring</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={currentRequirement}
                  onChange={(e) => setCurrentRequirement(e.target.value)}
                  placeholder="e.g., Water bottle, Hiking boots"
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
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={createTripMutation.isPending}
              >
                {createTripMutation.isPending ? "Creating..." : "Create Trip"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
