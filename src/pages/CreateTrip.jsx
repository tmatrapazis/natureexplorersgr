/**
 * CreateTrip.jsx — legacy route redirect
 *
 * The authoritative create/edit page is pages/TripForm.jsx (/tripform).
 * This file exists solely to forward any old bookmark or deep-link that still
 * points to /createtrip, preserving navigation state (e.g. re-create flow).
 */
import { Navigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CreateTripRedirect() {
  const location = useLocation();
  // Forward location.state so the re-create flow (tripData in state) still works
  return (
    <Navigate
      to={createPageUrl("TripForm")}
      state={location.state ?? null}
      replace
    />
  );
}
