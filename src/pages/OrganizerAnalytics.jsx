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
import { useTranslation } from '@/components/translations/useTranslations';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const STATUS_BADGE = {
  draft:           'bg-muted-foreground',
  upcoming:        'bg-[#0c281c]',
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
  const { t } = useTranslation(language);

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
      { label: t('analytics.funnel_paid'),      key: 'paid',      count: paidBookings.length },
      { label: t('analytics.funnel_confirmed'), key: 'confirmed', count: confirmedBookings.length },
      { label: t('analytics.funnel_pending'),   key: 'pending',   count: pendingBookings.length },
      { label: t('analytics.funnel_declined'),  key: 'declined',  count: bookings.filter(b => b.status === 'declined').length },
      { label: t('analytics.funnel_cancelled'), key: 'cancelled', count: bookings.filter(b => b.status === 'cancelled').length },
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
  }, [trips, bookings, t]);

  if (planLoading || tripsLoading || bookingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0c281c]" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <PageWrapper>
        <div className="max-w-2xl mx-auto pt-12">
          <UpgradePrompt
            feature={t('analytics.upgrade_feature')}
            description={t('analytics.upgrade_description')}
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
            {t('analytics.no_trips')}
          </p>
          <Link to={createPageUrl('TripForm')}>
            <Button className="bg-[#0c281c] hover:bg-[#0c281c]/90">
              <Plus className="w-4 h-4 mr-2" />
              {t('analytics.create_trip')}
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
          {t('analytics.title')}
        </h1>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard
            icon={Euro}
            label={t('analytics.kpi_total_revenue')}
            value={`€${totalRevenue.toLocaleString()}`}
            iconBg="bg-[#f0e3c7]/40"
            iconColor="text-[#0c281c]"
          />
          <KpiCard
            icon={TrendingUp}
            label={t('analytics.kpi_pending_revenue')}
            value={`€${pendingRevenue.toLocaleString()}`}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
          />
          <KpiCard
            icon={Users}
            label={t('analytics.kpi_total_bookings')}
            value={totalBookings}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <KpiCard
            icon={Target}
            label={t('analytics.kpi_fill_rate')}
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
                {t('analytics.monthly_revenue')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={v => `€${v}`} />
                    <Tooltip formatter={(value) => [`€${value}`, t('analytics.revenue_tooltip')]} />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t('analytics.trip_status')}
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
              {t('analytics.booking_breakdown')}
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
                      <Cell key={i} fill={FUNNEL_COLORS[entry.key] ?? '#9ca3af'} />
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
              {t('analytics.top_trips')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                      {t('analytics.col_trip')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                      {t('analytics.col_status')}
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">
                      {t('analytics.col_bookings')}
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">
                      {t('analytics.col_revenue')}
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
                          className="hover:text-[#0c281c] transition-colors line-clamp-1"
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
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-[#0c281c]">
                        €{trip.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {topTrips.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                        {t('analytics.no_data')}
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
