import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MobileSelect from "@/components/ui/MobileSelect";
import { MapPin, Users, ListOrdered, Edit, XCircle, Trash2, Plus, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatDateRange } from "../helpers/dateHelpers";
import { getTripImage, handleImageError } from "../helpers/imageHelpers";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { getTripInsights } from "../helpers/bookingHelpers";

const STATUS_BADGE = {
  draft: "bg-stone-400",
  upcoming: "bg-emerald-600",
  "happening now": "bg-blue-600",
  completed: "bg-stone-600",
  cancelled: "bg-red-600",
  "almost soldout": "bg-orange-500",
};

function OrganizerTripCard({
  trip,
  allBookings,
  language,
  t,
  today,
  onStatusChange,
  onCancel,
  onDelete,
  onRecreate,
  cancelMutationPending,
  cancelMutationTripId,
  deleteMutationPending,
  showCancel = false,
  showRecreate = false,
  showDelete = true,
  showEdit = true,
  showStatusChange = true,
  isRequiredFieldsFilled = undefined,
}) {
  const plainDescription = trip.description
    ? trip.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    : '';

  const confirmedBookings = allBookings.filter(b => b.trip_id === trip.id && b.status === "confirmed");
  const bookedSlots = confirmedBookings.reduce((sum, b) => sum + b.number_of_people, 0);
  const pendingBookings = allBookings.filter(b => b.trip_id === trip.id && b.status === "pending").length;
  const insights = getTripInsights(trip.id, allBookings);

  const statusLabel = {
    draft: language === 'el' ? 'Πρόχειρο' : 'Draft',
    upcoming: language === 'el' ? 'Επερχόμενο' : 'Upcoming',
    "happening now": language === 'el' ? 'Σε εξέλιξη' : 'Happening Now',
    completed: language === 'el' ? 'Ολοκληρωμένο' : 'Completed',
    cancelled: language === 'el' ? 'Ακυρωμένο' : 'Cancelled',
    "almost soldout": language === 'el' ? 'Σχεδόν γεμάτο' : 'Almost Soldout',
  };

  const isCancelling = cancelMutationPending && cancelMutationTripId === trip.id;

  return (
    <Card className={`p-6 hover:shadow-lg transition-shadow ${trip.status === 'draft' ? 'border-dashed' : ''}`}>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0">
          <OptimizedImage
            src={getTripImage(trip.image_url, trip.id)}
            alt={trip.title}
            onError={(e) => handleImageError(e, trip.id)}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row justify-between gap-2 mb-3">
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-stone-900 mb-2 break-words">{trip.title}</h3>
              <div className="flex flex-wrap gap-2">
                <Badge className={STATUS_BADGE[trip.status] || "bg-stone-400"}>
                  {statusLabel[trip.status] || trip.status}
                </Badge>
                <Badge variant="outline">{formatDateRange(trip.start_date, trip.end_date)}</Badge>
                {trip.tags && trip.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-4 text-sm text-stone-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>{trip.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>{bookedSlots} / {trip.total_slots} {t('organizer.confirmed_bookings')}</span>
            </div>
            {pendingBookings > 0 && (
              <div className="flex items-center gap-2 text-yellow-600 font-semibold">
                <ListOrdered className="w-4 h-4" />
                <span>{pendingBookings} {t('organizer.pending_requests')}</span>
              </div>
            )}
          </div>

          {insights.total > 0 && (
            <div className="bg-stone-50 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold text-stone-600 mb-2">{t('organizer.booking_insights')}</p>
              <div className="flex gap-4 text-sm">
                <span>{t('organizer.insights_pending')}: <strong>{insights.pending}</strong></span>
                <span>{t('organizer.insights_confirmed')}: <strong className="text-emerald-600">{insights.confirmed}</strong></span>
                <span>{t('organizer.insights_declined')}: <strong className="text-red-600">{insights.declined}</strong></span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              {showEdit && (
                <Link to={`${createPageUrl("TripForm")}?id=${trip.id}`} className="flex-shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="min-h-[44px]"
                    aria-label={`${t('organizer.edit_trip')} ${trip.title}`}
                  >
                    <Edit className="w-4 h-4 mr-2" />{t('organizer.edit_trip')}
                  </Button>
                </Link>
              )}

              {showStatusChange && (
                <MobileSelect
                  value={trip.status}
                  onValueChange={(value) => onStatusChange(trip.id, value)}
                  options={[
                    { value: 'draft', label: language === 'el' ? 'Πρόχειρο' : 'Draft' },
                    { value: 'upcoming', label: language === 'el' ? 'Επερχόμενο' : 'Upcoming' },
                    { value: 'happening now', label: language === 'el' ? 'Σε εξέλιξη' : 'Happening Now' },
                    { value: 'completed', label: language === 'el' ? 'Ολοκληρωμένο' : 'Completed' },
                    { value: 'cancelled', label: language === 'el' ? 'Ακυρωμένο' : 'Cancelled' },
                    { value: 'almost soldout', label: language === 'el' ? 'Σχεδόν γεμάτο' : 'Almost Soldout' },
                  ]}
                  placeholder={language === 'el' ? 'Αλλαγή κατάστασης' : 'Change status'}
                  label={language === 'el' ? 'Κατάσταση Εκδρομής' : 'Trip Status'}
                  disabled={isRequiredFieldsFilled && !isRequiredFieldsFilled(trip)}
                />
              )}

              {showCancel && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onCancel(trip)}
                  disabled={isCancelling}
                  className="flex-shrink-0 min-h-[44px]"
                  aria-label={`${t('organizer.cancel_trip')} ${trip.title}`}
                >
                  {isCancelling ? (
                    <span className="flex items-center gap-2">{t('organizer.cancelling')}</span>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      {t('organizer.cancel_trip')}
                    </>
                  )}
                </Button>
              )}

              {showRecreate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRecreate(trip)}
                  className="flex-shrink-0 min-h-[44px]"
                  aria-label={`${language === 'el' ? 'Αναδημιουργία' : 'Recreate'} ${trip.title}`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {language === 'el' ? 'Αναδημιουργία' : 'Recreate'}
                </Button>
              )}

              {showDelete && (!trip.end_date || new Date(trip.end_date) >= today) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(trip.id)}
                  disabled={deleteMutationPending}
                  className="text-red-600 hover:text-red-700 flex-shrink-0 min-h-[44px]"
                  aria-label={`${language === 'el' ? 'Διαγραφή' : 'Delete'} ${trip.title}`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {language === 'el' ? 'Διαγραφή' : 'Delete'}
                </Button>
              )}
            </div>
            {isRequiredFieldsFilled && !isRequiredFieldsFilled(trip) && (
              <span className="text-xs text-red-600">
                {language === 'el' ? 'Συμπληρώστε τα υποχρεωτικά πεδία για να δημοσιεύσετε' : 'Fill required fields to publish'}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default React.memo(OrganizerTripCard);