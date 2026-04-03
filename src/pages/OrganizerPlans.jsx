import { Check, X, Sparkles, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/AuthContext';
import { useOrganizerPlan } from '@/lib/useOrganizerPlan';
import PageWrapper from '@/components/layout/PageWrapper';

const FEATURES = [
  { label: 'Create & publish trips',          free: true,  premium: true },
  { label: 'Public organizer profile',         free: true,  premium: true },
  { label: 'External booking link',            free: true,  premium: false },
  { label: 'In-app booking system',            free: false, premium: true },
  { label: 'Booking management dashboard',     free: false, premium: true },
  { label: 'Per-tier slot limits & tracking',  free: false, premium: true },
  { label: 'Analytics & revenue reports',      free: false, premium: true },
  { label: 'Hiker notifications',              free: false, premium: true },
  { label: 'Priority listing placement',       free: false, premium: true },
];

const CONTACT_EMAIL = 'hello@natureexplorers.gr';

export default function OrganizerPlans() {
  const { user } = useAuth();
  const { isPremium, plan, isLoading } = useOrganizerPlan();

  const handleUpgradeContact = () => {
    const subject = encodeURIComponent('Premium Plan Upgrade Request');
    const body = encodeURIComponent(
      `Hi,\n\nI'd like to upgrade my organizer account to the Premium plan.\n\nOrganizer code: ${user?.organizer_code ?? ''}\nName: ${user?.full_name ?? ''}\nEmail: ${user?.email ?? ''}\n\nThank you!`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto pb-20 pt-8 px-4">
        {/* Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Organizer Plans
          </div>
          <h1 className="text-3xl font-bold">Choose the right plan</h1>
          <p className="text-muted-foreground">
            Start for free. Upgrade when you're ready to manage bookings professionally.
          </p>
        </div>

        {/* Current plan banner */}
        {!isLoading && (
          <div className={`mb-6 flex items-center justify-between p-4 rounded-lg border ${
            isPremium
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-muted/50 border-border'
          }`}>
            <div>
              <p className="text-sm font-medium">
                Your current plan:{' '}
                <span className={isPremium ? 'text-emerald-700' : 'text-foreground'}>
                  {isPremium ? 'Premium' : 'Free'}
                </span>
              </p>
              {isPremium && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your bookings system is active. All premium features are enabled.
                </p>
              )}
            </div>
            {isPremium && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                <Sparkles className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          {/* Free */}
          <Card className={`border-2 ${!isPremium ? 'border-foreground' : 'border-border'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Free</span>
                {!isPremium && <Badge variant="secondary">Current</Badge>}
              </CardTitle>
              <div className="mt-1">
                <span className="text-3xl font-bold">€0</span>
                <span className="text-muted-foreground text-sm"> / month</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Perfect for getting started and listing your trips.
              </p>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-2.5 text-sm">
                  {f.free
                    ? <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    : <X className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                  }
                  <span className={f.free ? '' : 'text-muted-foreground'}>{f.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Premium */}
          <Card className={`border-2 ${isPremium ? 'border-emerald-500' : 'border-amber-400'} relative overflow-hidden`}>
            {!isPremium && (
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                RECOMMENDED
              </div>
            )}
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Premium
                </span>
                {isPremium && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>
                )}
              </CardTitle>
              <div className="mt-1">
                <span className="text-3xl font-bold">€29</span>
                <span className="text-muted-foreground text-sm"> / month</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Full booking management for professional organizers.
              </p>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-2.5 text-sm">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{f.label}</span>
                </div>
              ))}

              {!isPremium && (
                <div className="pt-4">
                  <Button
                    onClick={handleUpgradeContact}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Request upgrade
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Send us an email — we'll set up your account within 24 hours.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Frequently asked questions</h2>
          <div className="space-y-3">
            {[
              {
                q: 'How do I upgrade?',
                a: `Click "Request upgrade" above. It opens a pre-filled email to ${CONTACT_EMAIL}. We'll activate your Premium plan within 24 hours.`,
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. Email us and we\'ll downgrade your account. Existing bookings remain intact; the booking system will stop accepting new requests.',
              },
              {
                q: 'What happens to my trips if I downgrade?',
                a: 'Your trips stay published. Hikers will no longer see the in-app booking button and you can add an external booking link instead.',
              },
              {
                q: 'Is VAT included in the €29?',
                a: 'The €29 is exclusive of VAT. Applicable taxes will be shown in the invoice we send you.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="p-4 bg-muted/40 rounded-lg">
                <p className="font-medium text-sm">{q}</p>
                <p className="text-sm text-muted-foreground mt-1">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
