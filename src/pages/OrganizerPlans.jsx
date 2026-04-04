import { Check, X, Sparkles, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/AuthContext';
import { useOrganizerPlan } from '@/lib/useOrganizerPlan';
import PageWrapper from '@/components/layout/PageWrapper';
import { useLanguage } from '../components/contexts/LanguageContext';
import { useTranslation } from '../components/translations/useTranslations';

const CONTACT_EMAIL = 'hello@natureexplorers.gr';

export default function OrganizerPlans() {
  const { user } = useAuth();
  const { isPremium, isLoading } = useOrganizerPlan();
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const FEATURES = [
    { key: 'feature_create_trips',      free: true,  premium: true },
    { key: 'feature_public_profile',    free: true,  premium: true },
    { key: 'feature_external_link',     free: true,  premium: false },
    { key: 'feature_inapp_booking',     free: false, premium: true },
    { key: 'feature_booking_dashboard', free: false, premium: true },
    { key: 'feature_slot_limits',       free: false, premium: true },
    { key: 'feature_analytics',         free: false, premium: true },
    { key: 'feature_notifications',     free: false, premium: true },
    { key: 'feature_priority',          free: false, premium: true },
  ];

  const handleUpgradeContact = () => {
    const subject = encodeURIComponent('Premium Plan Upgrade Request');
    const body = encodeURIComponent(
      `Hi,\n\nI'd like to upgrade my organizer account to the Premium plan.\n\nOrganizer code: ${user?.organizer_code ?? ''}\nName: ${user?.full_name ?? ''}\nEmail: ${user?.email ?? ''}\n\nThank you!`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const faqs = [
    {
      q: t('organizer_plans.faq_1_q'),
      a: t('organizer_plans.faq_1_a').replace('{email}', CONTACT_EMAIL),
    },
    { q: t('organizer_plans.faq_2_q'), a: t('organizer_plans.faq_2_a') },
    { q: t('organizer_plans.faq_3_q'), a: t('organizer_plans.faq_3_a') },
    { q: t('organizer_plans.faq_4_q'), a: t('organizer_plans.faq_4_a') },
  ];

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto pb-20 pt-8 px-4">
        {/* Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            {t('organizer_plans.badge')}
          </div>
          <h1 className="text-3xl font-bold">{t('organizer_plans.heading')}</h1>
          <p className="text-muted-foreground">{t('organizer_plans.subtitle')}</p>
        </div>

        {/* Current plan banner */}
        {!isLoading && (
          <div className={`mb-6 flex items-center justify-between p-4 rounded-lg border ${
            isPremium ? 'bg-emerald-50 border-emerald-200' : 'bg-muted/50 border-border'
          }`}>
            <div>
              <p className="text-sm font-medium">
                {t('organizer_plans.current_plan')}{' '}
                <span className={isPremium ? 'text-emerald-700' : 'text-foreground'}>
                  {isPremium ? t('organizer_plans.premium_plan') : t('organizer_plans.free_plan')}
                </span>
              </p>
              {isPremium && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('organizer_plans.premium_active_message')}
                </p>
              )}
            </div>
            {isPremium && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                <Sparkles className="w-3 h-3 mr-1" />
                {t('organizer_plans.active')}
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
                <span>{t('organizer_plans.free_plan')}</span>
                {!isPremium && <Badge variant="secondary">{t('organizer_plans.current')}</Badge>}
              </CardTitle>
              <div className="mt-1">
                <span className="text-3xl font-bold">€0</span>
                <span className="text-muted-foreground text-sm"> {t('organizer_plans.per_month')}</span>
              </div>
              <p className="text-sm text-muted-foreground">{t('organizer_plans.free_description')}</p>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {FEATURES.map((f) => (
                <div key={f.key} className="flex items-center gap-2.5 text-sm">
                  {f.free
                    ? <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    : <X className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                  }
                  <span className={f.free ? '' : 'text-muted-foreground'}>{t(`organizer_plans.${f.key}`)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Premium */}
          <Card className={`border-2 ${isPremium ? 'border-emerald-500' : 'border-amber-400'} relative overflow-hidden`}>
            {!isPremium && (
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                {t('organizer_plans.recommended')}
              </div>
            )}
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  {t('organizer_plans.premium_plan')}
                </span>
                {isPremium && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    {t('organizer_plans.active')}
                  </Badge>
                )}
              </CardTitle>
              <div className="mt-1">
                <span className="text-3xl font-bold">€29</span>
                <span className="text-muted-foreground text-sm"> {t('organizer_plans.per_month')}</span>
              </div>
              <p className="text-sm text-muted-foreground">{t('organizer_plans.premium_description')}</p>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {FEATURES.map((f) => (
                <div key={f.key} className="flex items-center gap-2.5 text-sm">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{t(`organizer_plans.${f.key}`)}</span>
                </div>
              ))}

              {!isPremium && (
                <div className="pt-4">
                  <Button
                    onClick={handleUpgradeContact}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {t('organizer_plans.request_upgrade')}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    {t('organizer_plans.upgrade_help')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('organizer_plans.faq_title')}</h2>
          <div className="space-y-3">
            {faqs.map(({ q, a }) => (
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
