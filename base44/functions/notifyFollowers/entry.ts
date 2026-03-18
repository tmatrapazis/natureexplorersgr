import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get the trip data from the automation payload
    const { data: trip } = await req.json();
    
    if (!trip || !trip.organizer_code) {
      return Response.json({ 
        error: 'Missing trip or organizer_code' 
      }, { status: 400 });
    }

    // Fetch all followers of this organizer
    const followers = await base44.asServiceRole.entities.OrganizerFollow.filter({
      organizer_code: trip.organizer_code
    });

    if (followers.length === 0) {
      return Response.json({ 
        message: 'No followers to notify',
        follower_count: 0 
      });
    }

    // Prepare notification data
    const tripUrl = `https://natureexplorers.gr/TripDetails?id=${trip.id}`;
    const organizerName = followers[0]?.organizer_name || 'An organizer you follow';

    // Create in-app notifications for all followers
    const notificationPromises = followers.map(follower =>
      base44.asServiceRole.entities.Notification.create({
        user_id: follower.user_id,
        title: `New trip from ${organizerName}`,
        message: `${organizerName} has published a new hiking trip: "${trip.title}". Check it out!`,
        link: tripUrl,
        is_read: false
      })
    );

    // Send email notifications to all followers
    const emailPromises = followers.map(follower =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: follower.user_email,
        from_name: 'Nature Explorers',
        subject: `New Trip from ${organizerName}`,
        body: `
          <h2>New Hiking Trip Available!</h2>
          <p>Hello ${follower.user_name || 'there'},</p>
          <p><strong>${organizerName}</strong>, an organizer you follow, has just published a new hiking trip:</p>
          <h3>${trip.title}</h3>
          <p><strong>Date:</strong> ${trip.start_date}${trip.end_date && trip.end_date !== trip.start_date ? ` - ${trip.end_date}` : ''}</p>
          <p><strong>Location:</strong> ${trip.location}</p>
          <p><strong>Difficulty:</strong> ${trip.difficulty}</p>
          ${trip.price ? `<p><strong>Price:</strong> €${trip.price}</p>` : ''}
          <p><a href="${tripUrl}" style="background-color: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">View Trip Details</a></p>
          <p>Don't miss out on this adventure!</p>
          <p>Best regards,<br>Nature Explorers Team</p>
          <hr>
          <p style="font-size: 12px; color: #666;">You received this email because you follow ${organizerName} on Nature Explorers. To unfollow, visit their profile page.</p>
        `
      })
    );

    // Execute all notifications and emails in parallel
    await Promise.all([...notificationPromises, ...emailPromises]);

    return Response.json({
      success: true,
      message: `Notified ${followers.length} followers`,
      follower_count: followers.length,
      trip_title: trip.title,
      organizer_code: trip.organizer_code
    });

  } catch (error) {
    console.error('Error in notifyFollowers:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});