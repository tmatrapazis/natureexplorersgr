import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HikingTrip } from '@/api/db';
import { useAuth } from '@/lib/AuthContext';
import { useOrganizerPlan } from '@/lib/useOrganizerPlan';
import BookingList from '@/components/bookings/BookingList';
import UpgradePrompt from '@/components/upgrade/UpgradePrompt';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ClipboardList, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/contexts/LanguageContext';
import PageWrapper from '@/components/layout/PageWrapper';
import useSEO from '@/components/seo/useSEO';
import MobileSelect from '@/components/ui/MobileSelect';

export default function ManageBookingsPage() {
  const { user } = useAuth();
  const { isPremium, isExpired, organizer: organizerData, isLoading: planLoading } = useOrganizerPlan();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [tripFilter, setTripFilter] = useState('active');

  useSEO({ title: 'Manage Bookings', noindex: true });

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['my-trips', user?.organizer_code],
    queryFn: () => HikingTrip.filter({ organizer_code: user.organizer_code }, '-start_date'),
    enabled: !!user?.organizer_code,
    staleTime: 2 * 60 * 1000,
  });

  if (planLoading || tripsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!isPremium && !isExpired) {
    return (
      <PageWrapper>
        <div className="max-w-2xl mx-auto pt-12">
          <UpgradePrompt
            feature={language === 'el' ? 'Διαχείριση Κρατήσεων' : 'Booking Management'}
            description={language === 'el'
              ? 'Αναβαθμίστε σε Premium για να διαχειρίζεστε κρατήσεις απευθείας μέσα στην πλατφόρμα.'
              : 'Upgrade to Premium to manage booking requests directly inside the platform.'}
          />
        </div>
      </PageWrapper>
    );
  }

  const activeTrips = trips.filter(t => t.status !== 'cancelled' && t.status !== 'completed');
  const allTrips = trips;
  const displayedTrips = tripFilter === 'active' ? activeTrips : allTrips;

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to={createPageUrl('MyTrips')}>
            <Button variant="outline" size="sm" className="min-h-[44px]">
              <ArrowLeft className="w-4 h-4 mr-1" />
              {language === 'el' ? 'Οι Εκδρομές μου' : 'My Trips'}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-foreground">
              {language === 'el' ? 'Διαχείριση Κρατήσεων' : 'Manage Bookings'}
            </h1>
          </div>
        </div>

        {/* Expiry banner */}
        {isExpired && (
          <div className="mb-4 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">
                {language === 'el' ? 'Το Premium πλάνο σας έχει λήξει' : 'Your Premium plan has expired'}
              </p>
              <p className="text-sm text-amber-700 mt-0.5">
                {language === 'el'
                  ? 'Μπορείτε να διαχειριστείτε τις υπάρχουσες κρατήσεις. Νέες κρατήσεις παύουν έως ότου ανανεώσετε.'
                  : 'You can still manage your existing bookings. New booking requests are paused until you renew.'}
              </p>
            </div>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0"
              onClick={() => navigate(createPageUrl('OrganizerPlans'))}
            >
              {language === 'el' ? 'Ανανέωση' : 'Renew'}
            </Button>
          </div>
        )}

        {/* Trip filter */}
        <div className="mb-4">
          <MobileSelect
            value={tripFilter}
            onValueChange={setTripFilter}
            options={[
              { value: 'active', label: language === 'el' ? 'Ενεργές εκδρομές' : 'Active trips' },
              { value: 'all',    label: language === 'el' ? 'Όλες οι εκδρομές' : 'All trips' },
            ]}
            label={language === 'el' ? 'Φίλτρο εκδρομών' : 'Filter trips'}
          />
        </div>

        {displayedTrips.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {language === 'el' ? 'Δεν υπάρχουν εκδρομές.' : 'No trips found.'}
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {displayedTrips.map(trip => (
              <Card key={trip.id} className="p-4">
                <div className="mb-3">
                  <h2 className="font-semibold text-base text-foreground">{trip.title}</h2>
                  {trip.start_date && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(trip.start_date).toLocaleDateString(language === 'el' ? 'el-GR' : 'en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  )}
                </div>
                <BookingList
                  tripId={trip.id}
                  paymentInstructions={organizerData?.payment_instructions || null}
                />
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
