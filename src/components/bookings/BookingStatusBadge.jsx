import React from 'react';
import { Badge } from '@/components/ui/badge';

const statusConfig = {
  paid: { 
    color: "bg-green-100 text-green-800 border-green-300", 
    label: "Paid" 
  },
  confirmed: { 
    color: "bg-yellow-100 text-yellow-800 border-yellow-300", 
    label: "Confirmed - Awaiting Payment" 
  },
  pending: { 
    color: "bg-blue-100 text-blue-800 border-blue-300", 
    label: "Pending Review" 
  },
  declined: { 
    color: "bg-red-100 text-red-800 border-red-300", 
    label: "Declined" 
  },
  cancelled: {
    color: "bg-muted text-foreground border-border",
    label: "Cancelled"
  }
};

export default function BookingStatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending;
  
  return (
    <Badge className={`${config.color} border`}>
      {config.label}
    </Badge>
  );
}