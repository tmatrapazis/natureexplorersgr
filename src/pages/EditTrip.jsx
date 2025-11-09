
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
import { ArrowLeft, Plus, X, Loader2, MapPin, Clock } from "lucide-react";

import useSEO from '../components/seo/useSEO';
import { useLanguage } from "@/providers/language-provider";
import { useTranslation } from "react-i18next";

export default function EditTripPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get("id");

  const [user, setUser] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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
  const [newMeetingPoint, setNewMeetingPoint] = useState({
    name: "",
    location: "",
    time: ""
  });

  useEffect(() => {
    if (trip) {
      setTripData({
        ...trip,
        start_date: trip.start_date ? new Date(trip.start_date).toISOString().split('T')[0] : "",
        end_date: trip.end_date ? new Date(trip.end_date).toISOString().split('T')[0] : "",
        requirements: trip.requirements || [],
        meeting_points: trip.meeting_points || [],
      });
    }
  }, [trip]);

  const updateTripMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.HikingTrip.update(tripId, {
        ...data,
        organizer_name: user?.username || user?.full_name,
        organizer_is_verified: user?.is_verified_organizer || false,
      });
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
    
    const { created_date, updated_date, id, computedStatus, ...dataToSubmit } = tripData;
    
    if (!dataToSubmit.end_date) {
      dataToSubmit.end_date = dataToSubmit.start_date;
    }
    
    if (!dataToSubmit.max_participants || dataToSubmit.max_participants === 0) {
      dataToSubmit.max_participants = dataToSubmit.total_slots;
    }
    
    if (!dataToSubmit.organizer_email && user && user.email) {
      dataToSubmit.organizer_email = user.email;
    }
    
    await updateTripMutation.mutateAsync(dataToSubmit);
  };
  
  const handleInputChange = (key, value) => {
      setTripData(prev => ({...prev, [key]: value}));
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

  const addMeetingPoint = () => {
    if (newMeetingPoint.name.trim() && newMeetingPoint.location.trim()) {
      handleInputChange('meeting_points', [...tripData.meeting_points, newMeetingPoint]);
      setNewMeetingPoint({ name: "", location: "", time: "" });
    }
  };

  const removeMeetingPoint = (index) => {
    handleInputChange('meeting_points', tripData.meeting_points.filter((_, i) => i !== index));
  };
  
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
        <Link to={createPageUrl("MyTrips")}>
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Trips
          </Button>
        </Link>

        <Card className="p-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-6">Edit Hiking Trip</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Trip Title *</Label>
              <Input id="title" value={tripData.title} onChange={(e) => handleInputChange('title', e.target.value)} required />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={tripData.description} onChange={(e) => handleInputChange('description', e.target.value)} rows={4} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input id="start_date" type="date" value={tripData.start_date} onChange={(e) => handleInputChange('start_date', e.target.value)} required />
              </div>

              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input id="end_date" type="date" value={tripData.end_date} min={tripData.start_date} onChange={(e) => handleInputChange('end_date', e.target.value)} />
                 <p className="text-xs text-stone-500 mt-1">Leave blank for single-day trips.</p>
              </div>
            </div>

            <div>
                <Label htmlFor="time">Start Time</Label>
                <Input id="time" type="time" value={tripData.start_time} onChange={(e) => handleInputChange('start_time', e.target.value)} />
            </div>

            <div>
              <Label htmlFor="location">General Location/Region *</Label>
              <Input id="location" value={tripData.location} onChange={(e) => handleInputChange('location', e.target.value)} placeholder="e.g., Mount Olympus, Crete" required />
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
                  placeholder="Meeting time"
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
                <Select value={tripData.difficulty} onValueChange={(value) => handleInputChange('difficulty', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Input id="duration" type="number" min="1" step="0.5" value={tripData.duration_hours} onChange={(e) => handleInputChange('duration_hours', parseFloat(e.target.value))} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="distance">Distance (km)</Label>
                <Input id="distance" type="number" min="0" step="0.1" value={tripData.distance_km} onChange={(e) => handleInputChange('distance_km', parseFloat(e.target.value))} />
              </div>

              <div>
                <Label htmlFor="elevation">Elevation Gain (m)</Label>
                <Input id="elevation" type="number" min="0" value={tripData.elevation_gain_m} onChange={(e) => handleInputChange('elevation_gain_m', parseInt(e.target.value))} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="slots">Total Slots *</Label>
                <Input id="slots" type="number" min="1" value={tripData.total_slots} onChange={(e) => handleInputChange('total_slots', parseInt(e.target.value))} required />
              </div>

              <div>
                <Label htmlFor="price">Price per Person ($)</Label>
                <Input id="price" type="number" min="0" step="0.01" value={tripData.price} onChange={(e) => handleInputChange('price', parseFloat(e.target.value))} />
              </div>
            </div>
            
            <div>
              <Label htmlFor="organizer_email">Organizer Email</Label>
              <Input
                id="organizer_email"
                type="email"
                value={tripData.organizer_email || (user ? user.email : '')}
                onChange={(e) => handleInputChange('organizer_email', e.target.value)}
                placeholder="Email for communication"
              />
              <p className="text-xs text-stone-500 mt-1">This email will be used for trip-related communications.</p>
            </div>

            <div>
              <Label htmlFor="external">External Link (Optional)</Label>
              <Input id="external" type="url" value={tripData.external_link} onChange={(e) => handleInputChange('external_link', e.target.value)} />
            </div>

            <div>
              <Label htmlFor="image-upload">Upload Primary Image</Label>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
              {uploadingImage && (
                <p className="text-sm text-stone-500 mt-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </p>
              )}
              {tripData.image_url && (
                <div className="mt-3">
                  <img src={tripData.image_url} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                </div>
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

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate(createPageUrl("MyTrips"))} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={updateTripMutation.isPending}>
                {updateTripMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
