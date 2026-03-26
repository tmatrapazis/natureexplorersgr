import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate the request
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the event payload
    const payload = await req.json();
    const { event, data } = payload;

    // Only proceed if it's a create event for HikingTrip
    if (event.type !== 'create' || event.entity_name !== 'HikingTrip') {
      return Response.json({ message: 'Event ignored - not a new trip' });
    }

    const trip = data;

    // Skip if trip is in draft status
    if (trip.status === 'draft') {
      console.log(`Skipping notifications for draft trip: ${trip.id}`);
      return Response.json({ message: 'Draft trip - notifications skipped' });
    }

    // Get all followers for this organizer
    const followers = await base44.asServiceRole.entities.OrganizerFollow.filter({
      organizer_code: trip.organizer_code
    });

    if (!followers || followers.length === 0) {
      console.log(`No followers found for organizer: ${trip.organizer_code}`);
      return Response.json({ message: 'No followers to notify' });
    }

    console.log(`Found ${followers.length} followers to notify for trip: ${trip.title}`);

    // Create in-app notifications and send emails
    const notificationPromises = [];
    const emailPromises = [];

    for (const follower of followers) {
      // Create in-app notification
      notificationPromises.push(
        base44.asServiceRole.entities.Notification.create({
          user_id: follower.user_id,
          title: `New Trip from ${follower.organizer_name}`,
          message: `${follower.organizer_name} just published a new hiking trip: "${trip.title}". Check it out!`,
          link: `/tripdetails?id=${trip.id}`,
          is_read: false
        })
      );

      // Send email notification
      emailPromises.push(
        base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'Nature Explorers',
          to: follower.user_email,
          subject: `New Trip from ${follower.organizer_name} - ${trip.title}`,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #059669;">New Hiking Trip Available!</h2>
              
              <p>Hi there,</p>
              
              <p><strong>${follower.organizer_name}</strong> just published a new hiking trip you might be interested in:</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1f2937;">${trip.title}</h3>
                <p style="color: #6b7280; margin-bottom: 10px;">${trip.description || 'Check out the details for this exciting new adventure!'}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(trip.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p style="margin: 5px 0;"><strong>Location:</strong> ${trip.location}</p>
                ${trip.difficulty ? `<p style="margin: 5px 0;"><strong>Difficulty:</strong> ${trip.difficulty}</p>` : ''}
              </div>
              
              <a href="https://natureexplorers.gr/tripdetails?id=${trip.id}" 
                 style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                View Trip Details
              </a>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              
              <p style="color: #6b7280; font-size: 14px;">
                You're receiving this email because you follow ${follower.organizer_name} on Nature Explorers.
                <br>
                To unfollow, visit their <a href="https://natureexplorers.gr/organizerprofile/${follower.organizer_username}" style="color: #059669;">profile page</a>.
              </p>
            </div>
          `
        })
      );
    }

    // Execute all notifications in parallel
    await Promise.all([...notificationPromises, ...emailPromises]);

    console.log(`Successfully notified ${followers.length} followers about new trip: ${trip.title}`);

    return Response.json({
      success: true,
      message: `Notified ${followers.length} followers`,
      trip_id: trip.id,
      trip_title: trip.title
    });

  } catch (error) {
    console.error('Error in notifyFollowersNewTrip:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});