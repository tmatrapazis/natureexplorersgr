import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Mountain } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '../contexts/LanguageContext';

export default function WelcomeModal({ user, onClose }) {
  const { language } = useLanguage();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!acceptedTerms) return;
    
    setIsSubmitting(true);
    try {
      await base44.auth.updateMe({
        has_accepted_terms: true,
        newsletter_subscribed: newsletterSubscribed
      });
      onClose();
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      toast.error(language === 'el'
        ? 'Αποτυχία αποθήκευσης προτιμήσεων. Παρακαλώ δοκιμάστε ξανά.'
        : 'Failed to save preferences. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
              <Mountain className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            {language === 'el' ? 'Καλώς ήρθατε στο Nature Explorers!' : 'Welcome to Nature Explorers!'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {language === 'el' 
              ? 'Ετοιμαστείτε να εξερευνήσετε τα πιο εντυπωσιακά μονοπάτια της Ελλάδας'
              : 'Get ready to explore Greece\'s most stunning hiking trails'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
            <Checkbox 
              id="terms" 
              checked={acceptedTerms}
              onCheckedChange={setAcceptedTerms}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                {language === 'el' ? (
                  <>
                    Αποδέχομαι τους{' '}
                    <Link 
                      to={createPageUrl("TermsOfUse")} 
                      target="_blank"
                      className="text-emerald-600 hover:text-emerald-700 underline"
                    >
                      Όρους Χρήσης
                    </Link>
                    {' '}της πλατφόρμας *
                  </>
                ) : (
                  <>
                    I accept the{' '}
                    <Link 
                      to={createPageUrl("TermsOfUse")} 
                      target="_blank"
                      className="text-emerald-600 hover:text-emerald-700 underline"
                    >
                      Terms of Use
                    </Link>
                    {' '}*
                  </>
                )}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'el'
                  ? 'Απαραίτητο για τη χρήση της πλατφόρμας'
                  : 'Required to use the platform'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <Checkbox 
              id="newsletter" 
              checked={newsletterSubscribed}
              onCheckedChange={setNewsletterSubscribed}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label htmlFor="newsletter" className="text-sm font-medium cursor-pointer">
                {language === 'el' 
                  ? 'Θέλω να λαμβάνω ενημερώσεις για νέες εκδρομές'
                  : 'I want to receive updates about new trips'}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'el'
                  ? 'Λάβετε email με τις καλύτερες πεζοπορικές εκδρομές κάθε εβδομάδα'
                  : 'Get weekly emails with the best hiking trips'}
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleContinue}
          disabled={!acceptedTerms || isSubmitting}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          {isSubmitting ? (
            language === 'el' ? 'Παρακαλώ περιμένετε...' : 'Please wait...'
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {language === 'el' ? 'Ξεκινήστε την εξερεύνηση' : 'Start Exploring'}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          {language === 'el'
            ? '* Υποχρεωτικό πεδίο'
            : '* Required field'}
        </p>
      </DialogContent>
    </Dialog>
  );
}