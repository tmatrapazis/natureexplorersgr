import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HikingTrip, Booking } from '@/api/db';
import { useAuth } from '@/lib/AuthContext';
import { useOrganizerPlan } from '@/lib/useOrganizerPlan';
import useSEO from '@/components/seo/useSEO';
import PageWrapper from '@/components/layout/PageWrapper';
import UpgradePrompt from '@/components/upgrade/UpgradePrompt';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Loader2, TrendingUp, Users, Euro, Target, Plus } from 'lucide-react';
import { useLanguage } from '@/components/contexts/LanguageContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const STATUS_BADGE = {
  draft:           'bg-muted-foreground',
  upcoming:        'bg-emerald-600',
  'happening now': 'bg-blue-600',
  completed:       'bg-violet-600',
  cancelled:       'bg-red-600',
  'almost soldout':'bg-orange-500',
};

const PIE_COLORS = {
  upcoming:        '#10b981',
  draft:           '#6b7280',
  'happening now': '#3b82f6',
  completed:       '#8b5cf6',
  cancelled:       '#ef4444',
  'almost soldout':'#f59e0b',
};

const FUNNEL_COLORS = {
  paid:      '#10b981',
  confirmed: '#3b82f6',
  pending:   '#f59e0b',
  declined:  '#ef4444',
  cancelled: '#6b7280',
};

function KpiCard({ icon: Icon, label, value, iconBg, iconColor }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`rounded-full p-2 ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrganizerAnalyticsPage() {
  const { user } = useAuth();
  const { isPremium, isLoading: planLoading } = useOrganizerPlan();
  const { language } = useLanguage();

  useSEO({ title: 'Analytics — Nature Explorers', noindex: true });

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['my-trips', user?.organizer_code],
    queryFn: () => HikingTrip.filter({ organizer_code: user.organizer_code }, '-start_date'),
    enabled: !!user?.organizer_code,
    staleTime: 2 * 60 * 1000,
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['all-bookings', user?.organizer_code],
    queryFn: async () => {
      if (!user?.organizer_code) return [];
      const orgTrips = await HikingTrip.filter({ organizer_code: user.organizer_code });
      if (!orgTrips.length) return [];
      return Booking.filterByTripIds(orgTrips.map(t => t.id));
    },
    enabled: !!user?.organizer_code,
    staleTime: 2 * 60 * 1000,
  });

  const analytics = useMemo(() => {
    const paidBookings      = bookings.filter(b => b.status === 'paid');
    const pendingBookings   = bookings.filter(b => b.status === 'pending');
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');

    const totalRevenue   = paidBookings.reduce((s, b) => s + (b.total_price ?? 0), 0);
    const pendingRevenue = [...pendingBookings, ...confirmedBookings]
      .reduce((s, b) => s + (b.total_price ?? 0), 0);

    const bookedPeople = bookings
      .filter(b => b.status === 'confirmed' || b.status === 'paid')
      .reduce((s, b) => s + (b.number_of_people ?? 0), 0);
    const totalSlots = trips.reduce((s, t) =>
      s + (t.pricing_options ?? []).reduce((ts, opt) => ts + (opt.slots ?? 0), 0), 0);
    const fillRate = totalSlots > 0 ? Math.round((bookedPeople / totalSlots) * 100) : 0;

    // Booking funnel
    const funnelData = [
      { label: 'Paid',      count: paidBookings.length },
      { label: 'Confirmed', count: confirmedBookings.length },
      { label: 'Pending',   count: pendingBookings.length },
      { label: 'Declined',  count: bookings.filter(b => b.status === 'declined').length },
      { label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length },
    ];

    // Monthly revenue — last 6 months
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      };
    });
    const revenueByMonth = {};
    paidBookings.forEach(b => {
      const d = new Date(b.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonth[key] = (revenueByMonth[key] ?? 0) + (b.total_price ?? 0);
    });
    const monthlyRevenueData = months.map(m => ({
      month:   m.label,
      revenue: revenueByMonth[m.key] ?? 0,
    }));

    // Top trips by paid revenue
    const tripRevenueMap   = {};
    const tripBookingCount = {};
    paidBookings.forEach(b => {
      tripRevenueMap[b.trip_id] = (tripRevenueMap[b.trip_id] ?? 0) + (b.total_price ?? 0);
    });
    bookings.forEach(b => {
      tripBookingCount[b.trip_id] = (tripBookingCount[b.trip_id] ?? 0) + 1;
    });
    const topTrips = trips
      .map(t => ({
        id:       t.id,
        title:    t.title,
        status:   t.status,
        revenue:  tripRevenueMap[t.id]   ?? 0,
        bookings: tripBookingCount[t.id] ?? 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Trip status pie
    const statusCounts = trips.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1;
      return acc;
    }, {});
    const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    return { totalRevenue, pendingRevenue, totalBookings: bookings.length, fillRate, funnelData, monthlyRevenueData, topTrips, pieData };
  }, [trips, bookings]);

  if (planLoading || tripsLoading || bookingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <PageWrapper>
        <div className="max-w-2xl mx-auto pt-12">
          <UpgradePrompt
            feature={language === 'el' ? 'Αναλυτικά Στοιχεία' : 'Analytics'}
            description={language === 'el'
              ? 'Αναβαθμίστε σε Premium για να δείτε αναλυτικά στοιχεία κρατήσεων και εσόδων.'
              : 'Upgrade to Premium to view booking analytics, revenue trends, and trip performance.'}
          />
        </div>
      </PageWrapper>
    );
  }

  if (trips.length === 0) {
    return (
      <PageWrapper>
        <div className="max-w-5xl mx-auto pb-20 pt-8 text-center">
          <p className="text-muted-foreground mb-4">
            {language === 'el' ? 'Δεν υπάρχουν ακόμα εκδρομές.' : 'No trips yet. Create your first trip to see analytics.'}
          </p>
          <Link to={createPageUrl('TripForm')}>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              {language === 'el' ? 'Δημιουργία Εκδρομής' : 'Create Trip'}
            </Button>
          </Link>
        </div>
      </PageWrapper>
    );
  }

  const { totalRevenue, pendingRevenue, totalBookings, fillRate, funnelData, monthlyRevenueData, topTrips, pieData } = analytics;

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto pb-20">
        <h1 className="text-3xl font-bold text-foreground mb-6">
          {language === 'el' ? 'Αναλυτικά Στοιχεία' : 'Analytics'}
        </h1>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard
            icon={Euro}
            label={language === 'el' ? 'Συνολικά Έσοδα (Πληρωμένα)' : 'Total Revenue (Paid)'}
            value={`€${totalRevenue.toLocaleString()}`}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
          />
          <KpiCard
            icon={TrendingUp}
            label={language === 'el' ? 'Αναμενόμενα Έσοδα' : 'Pending Revenue'}
            value={`€${pendingRevenue.toLocaleString()}`}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
          />
          <KpiCard
            icon={Users}
            label={language === 'el' ? 'Συνολικές Κρατήσεις' : 'Total Bookings'}
            value={totalBookings}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <KpiCard
            icon={Target}
            label={language === 'el' ? 'Πλήρωση Θέσεων' : 'Slot Fill Rate'}
            value={`${fillRate}%`}
            iconBg="bg-violet-100"
            iconColor="text-violet-600"
          />
        </div>

        {/* Revenue chart + Trip status pie */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {language === 'el' ? 'Έσοδα ανά Μήνα (τελευταίοι 6 μήνες)' : 'Monthly Revenue (last 6 months)'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={v => `€${v}`} />
                    <Tooltip formatter={(value) => [`€${value}`, language === 'el' ? 'Έσοδα' : 'Revenue']} />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {language === 'el' ? 'Κατάσταση Εκδρομών' : 'Trip Status'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={75}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={PIE_COLORS[entry.name] ?? '#9ca3af'} />
                      ))}
                    </Pie>
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ fontSize: 11, textTransform: 'capitalize' }}>{value}</span>
                      )}
                    />
                    <Tooltip formatter={(value, name) => [value, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking funnel */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {language === 'el' ? 'Ανάλυση Κρατήσεων' : 'Booking Breakdown'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={funnelData}
                  layout="vertical"
                  margin={{ top: 0, right: 24, left: 16, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={64} />
                  <Tooltip formatter={(value, _name, props) => [value, props.payload.label]} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry, i) => (
                      <Cell key={i} fill={FUNNEL_COLORS[entry.label.toLowerCase()] ?? '#9ca3af'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top trips table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {language === 'el' ? 'Κορυφαίες Εκδρομές (κατά Έσοδα)' : 'Top Trips by Revenue'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                      {language === 'el' ? 'Εκδρομή' : 'Trip'}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                      {language === 'el' ? 'Κατάσταση' : 'Status'}
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">
                      {language === 'el' ? 'Κρατήσεις' : 'Bookings'}
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">
                      {language === 'el' ? 'Έσοδα' : 'Revenue'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topTrips.map((trip, i) => (
                    <tr key={trip.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-foreground max-w-[200px]">
                        <Link
                          to={`${createPageUrl('TripDetails')}?id=${trip.id}`}
                          className="hover:text-emerald-600 transition-colors line-clamp-1"
                        >
                          {trip.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${STATUS_BADGE[trip.status] ?? 'bg-muted-foreground'} text-xs capitalize`}>
                          {trip.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{trip.bookings}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-emerald-700">
                        €{trip.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {topTrips.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                        {language === 'el' ? 'Δεν υπάρχουν δεδομένα ακόμα.' : 'No data yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
