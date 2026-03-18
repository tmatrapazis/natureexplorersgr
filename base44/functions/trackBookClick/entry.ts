import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Require authenticated user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trip_id } = await req.json();
    if (!trip_id) {
      return Response.json({ error: 'trip_id is required' }, { status: 400 });
    }

    // Skip tracking for admins
    if (user.role === 'admin') {
      return Response.json({ tracked: false, reason: 'admin' });
    }

    // Fetch the trip to check organizer ownership
    const trips = await base44.asServiceRole.entities.HikingTrip.filter({ id: trip_id });
    const trip = trips?.[0];

    if (!trip) {
      return Response.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Skip tracking if the user is the organizer of this trip
    if (user.organizer_code && user.organizer_code === trip.organizer_code) {
      return Response.json({ tracked: false, reason: 'organizer' });
    }

    // Atomically increment booked_clicks
    const currentClicks = typeof trip.booked_clicks === 'number' ? trip.booked_clicks : 0;
    await base44.asServiceRole.entities.HikingTrip.update(trip_id, {
      booked_clicks: currentClicks + 1,
    });

    return Response.json({ tracked: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});