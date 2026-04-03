import { Sparkles, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Shown when a free-tier organizer tries to access a premium feature.
 *
 * Props:
 *   feature  — short name of the locked feature (e.g. "Booking System")
 *   description — one sentence explaining the value
 *   compact  — if true, renders a smaller inline version
 */
export default function UpgradePrompt({ feature, description, compact = false }) {
  const navigate = useNavigate();
  const plansUrl = createPageUrl('OrganizerPlans');

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800 flex-1">
          <span className="font-semibold">{feature}</span> is a Premium feature.
        </p>
        <Button
          size="sm"
          className="bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0"
          onClick={() => navigate(plansUrl)}
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardContent className="p-6 text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-foreground">{feature}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {description || 'This feature is available on the Premium plan.'}
          </p>
        </div>
        <div className="space-y-2">
          <Button
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => navigate(plansUrl)}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to Premium
          </Button>
          <p className="text-xs text-muted-foreground">
            €29/month · Cancel anytime
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
