
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Users, CheckCircle, MapPin, Loader2 } from 'lucide-react';
import useSEO from '../components/seo/useSEO';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage'; // Assuming useLanguage is defined here or similar

export default function MyProfilePage() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  // Prevent indexing - this is an authenticated page
  useSEO({
    title: t('navigation.profile'),
    description: 'User profile',
    noindex: true
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: rawBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['user-bookings-data', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.Booking.filter({ user_id: user.id });
    },
    enabled: !!user,
    initialData: [],
  });

  if (userLoading || bookingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  const myBookings = rawBookings;
  const confirmedBookings = myBookings.filter(b => b.status === 'confirmed');
  const upcomingBookings = myBookings.filter(b =>
    (b.status === 'confirmed' || b.status === 'pending') && new Date(b.trip_start_date) >= new Date()
  );
  const completedBookings = myBookings.filter(b =>
    b.status === 'confirmed' && new Date(b.trip_start_date) < new Date()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link to={createPageUrl("Calendar")}>
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-2">My Hiking Stats</h1>
          <p className="text-stone-600">Track your hiking adventures</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-stone-600">Total Bookings</CardTitle>
              <Calendar className="w-4 h-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-stone-900">{myBookings.length}</div>
              <p className="text-xs text-stone-500 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-stone-600">Trips Completed</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-stone-900">{completedBookings.length}</div>
              <p className="text-xs text-stone-500 mt-1">Past adventures</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-stone-600">Upcoming Trips</CardTitle>
              <MapPin className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-stone-900">{upcomingBookings.length}</div>
              <p className="text-xs text-stone-500 mt-1">Adventures ahead</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-stone-600">Confirmed</CardTitle>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-stone-900">{confirmedBookings.length}</div>
              <p className="text-xs text-stone-500 mt-1">Ready to go</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to={createPageUrl("Calendar")}>
                <Button className="w-full" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Browse New Trips
                </Button>
              </Link>
              <Link to={createPageUrl("MyBookings")}>
                <Button className="w-full" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  View My Bookings
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-stone-600">Confirmed</span>
                  <span className="font-bold text-green-600">{confirmedBookings.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-600">Pending</span>
                  <span className="font-bold text-yellow-600">
                    {myBookings.filter(b => b.status === 'pending').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-600">Declined</span>
                  <span className="font-bold text-red-600">
                    {myBookings.filter(b => b.status === 'declined').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
