import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MobileHeader({ title, onBack }) {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header 
      className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border"
      style={{ 
        paddingTop: 'max(env(safe-area-inset-top), 0.5rem)'
      }}
    >
      <div className="flex items-center h-14 px-4" style={{ paddingLeft: 'max(env(safe-area-inset-left), 1rem)', paddingRight: 'max(env(safe-area-inset-right), 1rem)' }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="mr-2 min-h-[44px] min-w-[44px] select-none"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground truncate flex-1">
          {title}
        </h1>
      </div>
    </header>
  );
}