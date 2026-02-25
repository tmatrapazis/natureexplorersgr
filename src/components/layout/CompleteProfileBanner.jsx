import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AlertCircle, X } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function CompleteProfileBanner({ onDismiss }) {
  const { language } = useLanguage();

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-amber-800 text-sm">
        <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-500" />
        <span>
          {language === 'el'
            ? 'Το προφίλ σας δεν είναι πλήρες. '
            : 'Your profile is incomplete. '}
          <Link
            to={createPageUrl("EditProfile")}
            className="font-semibold underline hover:text-amber-900"
          >
            {language === 'el' ? 'Συμπληρώστε το εδώ' : 'Complete it here'}
          </Link>
        </span>
      </div>
      <button
        onClick={onDismiss}
        className="text-amber-500 hover:text-amber-700 flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}