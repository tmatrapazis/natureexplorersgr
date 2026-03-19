import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Multi-step account deletion dialog with mandatory confirmations
 * - Step 1: Warning and acknowledgment checkboxes
 * - Step 2: Type DELETE to confirm
 * - Step 3: Final confirmation before permanent deletion
 */
export default function DeleteAccountDialog({ user, language = 'en' }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [acknowledgments, setAcknowledgments] = useState({
    dataLoss: false,
    noUndo: false,
    bookingsLost: false,
  });

  const handleClose = () => {
    setOpen(false);
    setStep(1);
    setConfirmText('');
    setAcknowledgments({ dataLoss: false, noUndo: false, bookingsLost: false });
  };

  const allAcknowledged = Object.values(acknowledgments).every(v => v === true);
  const confirmTextValid = confirmText.trim().toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await base44.entities.User.delete(user.id);
      toast.success(language === 'el' 
        ? 'Ο λογαριασμός διαγράφηκε επιτυχώς' 
        : 'Account deleted successfully');
      await base44.auth.logout();
    } catch (error) {
      console.error('Account deletion failed:', error);
      toast.error(language === 'el' 
        ? 'Αποτυχία διαγραφής λογαριασμού' 
        : 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="destructive" 
          className="w-full min-h-[44px]" 
          type="button"
          aria-label={language === 'el' ? 'Διαγραφή λογαριασμού' : 'Delete account'}
        >
          {language === 'el' ? 'Διαγραφή Λογαριασμού' : 'Delete Account'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        {/* Step 1: Warning and Acknowledgments */}
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                {language === 'el' ? 'Διαγραφή Λογαριασμού' : 'Delete Account'}
              </DialogTitle>
              <DialogDescription>
                {language === 'el'
                  ? 'Αυτή η ενέργεια ΔΕΝ μπορεί να αναιρεθεί. Παρακαλώ διαβάστε προσεκτικά:'
                  : 'This action CANNOT be undone. Please read carefully:'}
              </DialogDescription>
            </DialogHeader>

            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {language === 'el'
                  ? 'Όλα τα δεδομένα σας θα διαγραφούν οριστικά και δεν θα μπορούν να ανακτηθούν.'
                  : 'All your data will be permanently deleted and cannot be recovered.'}
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Label className="text-base font-semibold">
                {language === 'el' ? 'Επιβεβαιώστε ότι καταλαβαίνετε:' : 'Confirm you understand:'}
              </Label>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="dataLoss"
                    checked={acknowledgments.dataLoss}
                    onCheckedChange={(checked) =>
                      setAcknowledgments(prev => ({ ...prev, dataLoss: !!checked }))
                    }
                    className="mt-1 min-h-[44px] min-w-[44px]"
                    aria-label={language === 'el' 
                      ? 'Επιβεβαίωση απώλειας δεδομένων' 
                      : 'Confirm data loss'}
                  />
                  <Label htmlFor="dataLoss" className="font-normal cursor-pointer leading-relaxed">
                    {language === 'el'
                      ? 'Το προφίλ μου, οι κρατήσεις, και όλα τα δεδομένα θα διαγραφούν οριστικά.'
                      : 'My profile, bookings, and all data will be permanently deleted.'}
                  </Label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="noUndo"
                    checked={acknowledgments.noUndo}
                    onCheckedChange={(checked) =>
                      setAcknowledgments(prev => ({ ...prev, noUndo: !!checked }))
                    }
                    className="mt-1 min-h-[44px] min-w-[44px]"
                    aria-label={language === 'el' 
                      ? 'Επιβεβαίωση μη αναστρέψιμης ενέργειας' 
                      : 'Confirm irreversible action'}
                  />
                  <Label htmlFor="noUndo" className="font-normal cursor-pointer leading-relaxed">
                    {language === 'el'
                      ? 'Αυτή η ενέργεια ΔΕΝ μπορεί να αναιρεθεί και δεν υπάρχει επαναφορά.'
                      : 'This action CANNOT be undone and there is no recovery option.'}
                  </Label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="bookingsLost"
                    checked={acknowledgments.bookingsLost}
                    onCheckedChange={(checked) =>
                      setAcknowledgments(prev => ({ ...prev, bookingsLost: !!checked }))
                    }
                    className="mt-1 min-h-[44px] min-w-[44px]"
                    aria-label={language === 'el' 
                      ? 'Επιβεβαίωση απώλειας κρατήσεων' 
                      : 'Confirm loss of bookings'}
                  />
                  <Label htmlFor="bookingsLost" className="font-normal cursor-pointer leading-relaxed">
                    {language === 'el'
                      ? 'Θα χάσω την πρόσβαση σε όλες τις ενεργές κρατήσεις και το ιστορικό μου.'
                      : 'I will lose access to all active bookings and my history.'}
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="min-h-[44px]"
                aria-label={language === 'el' ? 'Ακύρωση' : 'Cancel'}
              >
                {language === 'el' ? 'Ακύρωση' : 'Cancel'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setStep(2)}
                disabled={!allAcknowledged}
                className="min-h-[44px]"
                aria-label={language === 'el' ? 'Συνέχεια' : 'Continue'}
              >
                {language === 'el' ? 'Συνέχεια' : 'Continue'}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2: Type DELETE to confirm */}
        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-destructive">
                {language === 'el' ? 'Πληκτρολογήστε DELETE για επιβεβαίωση' : 'Type DELETE to confirm'}
              </DialogTitle>
              <DialogDescription>
                {language === 'el'
                  ? 'Για να συνεχίσετε, πληκτρολογήστε DELETE με κεφαλαία γράμματα στο παρακάτω πεδίο.'
                  : 'To continue, type DELETE in capital letters in the field below.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="confirm-text" className="sr-only">
                  {language === 'el' ? 'Πληκτρολογήστε DELETE' : 'Type DELETE'}
                </Label>
                <Input
                  id="confirm-text"
                  placeholder="DELETE"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="font-mono text-center min-h-[44px]"
                  autoComplete="off"
                  aria-label={language === 'el' 
                    ? 'Πληκτρολογήστε DELETE για επιβεβαίωση' 
                    : 'Type DELETE to confirm'}
                />
                {confirmText && !confirmTextValid && (
                  <p className="text-xs text-destructive mt-2">
                    {language === 'el' 
                      ? 'Πρέπει να πληκτρολογήσετε DELETE με κεφαλαία' 
                      : 'You must type DELETE in capital letters'}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="min-h-[44px]"
                aria-label={language === 'el' ? 'Πίσω' : 'Back'}
              >
                {language === 'el' ? 'Πίσω' : 'Back'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setStep(3)}
                disabled={!confirmTextValid}
                className="min-h-[44px]"
                aria-label={language === 'el' ? 'Συνέχεια' : 'Continue'}
              >
                {language === 'el' ? 'Συνέχεια' : 'Continue'}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 3: Final confirmation */}
        {step === 3 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-destructive">
                {language === 'el' ? 'Τελική Επιβεβαίωση' : 'Final Confirmation'}
              </DialogTitle>
              <DialogDescription>
                {language === 'el'
                  ? 'Αυτό είναι το τελευταίο βήμα. Μετά από αυτό, ο λογαριασμός σας θα διαγραφεί αμέσως.'
                  : 'This is the final step. After this, your account will be deleted immediately.'}
              </DialogDescription>
            </DialogHeader>

            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-semibold">
                {language === 'el'
                  ? 'Είστε απόλυτα σίγουροι ότι θέλετε να διαγράψετε οριστικά τον λογαριασμό σας;'
                  : 'Are you absolutely sure you want to permanently delete your account?'}
              </AlertDescription>
            </Alert>

            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep(2)}
                disabled={isDeleting}
                className="min-h-[44px]"
                aria-label={language === 'el' ? 'Πίσω' : 'Back'}
              >
                {language === 'el' ? 'Πίσω' : 'Back'}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="min-h-[44px]"
                aria-label={language === 'el' 
                  ? 'Οριστική Διαγραφή Λογαριασμού' 
                  : 'Permanently Delete Account'}
              >
                {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {language === 'el' ? 'Οριστική Διαγραφή' : 'Delete Permanently'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}