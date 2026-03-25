import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function VerifiedBadge({ className = "", showText = true }) {
  return (
    <Badge variant="secondary" className={`bg-emerald-100 text-emerald-700 border-emerald-200 ${className}`}>
      <ShieldCheck className="w-3 h-3 mr-1" />
      {showText && "Verified"}
    </Badge>
  );
}
export default React.memo(VerifiedBadge);
