import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function VerifiedBadge({ className = "", showText = true }) {
  return (
    <Badge variant="secondary" className={`bg-[#f0e3c7]/40 text-[#0c281c] border-[#0c281c]/20 ${className}`}>
      <ShieldCheck className="w-3 h-3 mr-1" />
      {showText && "Verified"}
    </Badge>
  );
}
export default React.memo(VerifiedBadge);
