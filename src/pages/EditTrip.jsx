/**
 * EditTrip.jsx — legacy route redirect
 *
 * The authoritative create/edit page is pages/TripForm.jsx (/tripform).
 * This file exists solely to forward any old bookmark or deep-link that still
 * points to /edittrip?id=xxx, preserving the trip ID query parameter.
 */
import { Navigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function EditTripRedirect() {
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('id');
  const destination = tripId
    ? `${createPageUrl("TripForm")}?id=${tripId}`
    : createPageUrl("TripForm");
  return <Navigate to={destination} replace />;
}
