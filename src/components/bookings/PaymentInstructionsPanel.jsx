import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Info } from 'lucide-react';

export default function PaymentInstructionsPanel({ instructions }) {
  if (!instructions) return null;

  return (
    <Card className="border-[#0c281c]/20 bg-[#f0e3c7]/40/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#0c281c]" />
          Payment Instructions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-card rounded-lg p-4 border border-[#0c281c]/20">
          <div className="flex items-start gap-2 mb-3">
            <Info className="w-4 h-4 text-[#0c281c] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Please complete your payment using the details below. After payment, the organizer will mark your booking as paid.
            </p>
          </div>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-foreground bg-muted/30 p-3 rounded">
              {instructions}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}