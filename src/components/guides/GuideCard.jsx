import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

function GuideCard({ guide, organizers = [], language = 'en' }) {
  const primaryCert = guide.certifications?.[0];
  const guideOrganizers = organizers.filter(org => 
    guide.organizer_codes?.includes(org.organizer_code)
  );

  return (
    <Link
      to={`${createPageUrl("GuideProfile")}?id=${guide.id}`}
      aria-label={`${language === 'el' ? 'Προφίλ οδηγού' : 'Guide profile'}: ${guide.full_name}`}
    >
      <Card role="article" aria-label={guide.full_name} className="overflow-hidden hover:shadow-xl transition-all duration-300 group h-full">
        <div className="relative h-48 bg-gradient-to-br from-[#f0e3c7]/40 to-stone-100">
          <img
            src={guide.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(guide.full_name)}&size=400&background=10b981&color=fff`}
            alt={guide.full_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {guide.is_verified && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-[#0c281c] text-white flex items-center gap-1">
                <Shield className="w-3 h-3" aria-hidden="true" />
                {language === 'el' ? 'Πιστοποιημένος' : 'Verified'}
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-5">
          <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-[#0c281c] transition-colors">
            {guide.full_name}
          </h3>
          
          {primaryCert && (
            <Badge variant="outline" className="mb-3">
              {primaryCert}
            </Badge>
          )}

          {guide.years_of_experience && (
            <p className="text-sm text-muted-foreground mb-3">
              {guide.years_of_experience} {language === 'el' ? 'χρόνια εμπειρίας' : 'years experience'}
            </p>
          )}

          {guideOrganizers.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground w-full mb-1">
                {language === 'el' ? 'Συνεργάζεται με:' : 'Works with:'}
              </p>
              {guideOrganizers.slice(0, 3).map(org => (
                <div
                  key={org.organizer_code}
                  className="text-xs px-2 py-1 bg-muted rounded-full text-foreground"
                >
                  {org.username || org.full_name}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
export default React.memo(GuideCard);
