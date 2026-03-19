import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

export default function DeclineBookingDialog({ open, onOpenChange, onConfirm, isPending }) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason);
    setReason("");
  };

  const handleCancel = () => {
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <DialogTitle>Decline Booking</DialogTitle>
              <DialogDescription>Provide a reason for declining this booking</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="decline-reason" className="mb-2 block">
            Reason for declining (optional)
          </Label>
          <Textarea
            id="decline-reason"
            placeholder="Let the hiker know why their booking was declined..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel} 
            disabled={isPending}
            className="min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
            className="min-h-[44px]"
          >
            {isPending ? "Declining..." : "Decline Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}