import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse the request body
    const { tripId } = await req.json();

    if (!tripId) {
      return Response.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    // Fetch the current trip to get the current booked_clicks count
    const trips = await base44.entities.HikingTrip.filter({ id: tripId });
    if (!trips || trips.length === 0) {
      return Response.json({ error: 'Trip not found' }, { status: 404 });
    }

    const trip = trips[0];
    const currentCount = trip.booked_clicks || 0;

    // Increment the booked_clicks counter
    await base44.entities.HikingTrip.update(tripId, {
      booked_clicks: currentCount + 1
    });

    return Response.json({ success: true, newCount: currentCount + 1 }, { status: 200 });
  } catch (error) {
    console.error('Error tracking booking click:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});