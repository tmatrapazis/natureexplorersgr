import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    console.log('[notifyFollowersOnTrip] Triggered for event:', event?.type, 'trip:', data?.id);

    // Only process create events or updates that publish a draft
    if (!data || !data.id) {
      return Response.json({ success: false, error: 'No trip data' }, { status: 400 });
    }

    // Skip if trip is draft
    if (data.status === 'draft') {
      console.log('[notifyFollowersOnTrip] Trip is draft, skipping notifications');
      return Response.json({ success: true, skipped: 'draft' });
    }

    const { organizer_code, id: trip_id, title, location, start_date, difficulty } = data;

    if (!organizer_code) {
      console.log('[notifyFollowersOnTrip] No organizer_code, skipping');
      return Response.json({ success: true, skipped: 'no_organizer' });
    }

    // Get all followers of this organizer
    const followers = await base44.asServiceRole.entities.OrganizerFollow.filter({
      organizer_code: organizer_code
    });

    console.log('[notifyFollowersOnTrip] Found followers:', followers.length);

    if (!followers || followers.length === 0) {
      return Response.json({ success: true, followers: 0 });
    }

    const organizer_name = followers[0]?.organizer_name || 'Organizer';
    const tripLink = `/tripdetails?trip_id=${trip_id}`;
    const fullTripUrl = `https://www.natureexplorers.gr${tripLink}`;

    // Format date nicely
    const formattedDate = start_date ? new Date(start_date).toLocaleDateString('el-GR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '';

    // Create notifications for all followers
    const notificationsPayload = followers.map(follower => ({
      user_id: follower.user_id,
      title: `Νέα εκδρομή από ${organizer_name}!`,
      message: `${title} — ${location}${formattedDate ? ', ' + formattedDate : ''}`,
      link: tripLink,
      is_read: false
    }));

    await base44.asServiceRole.entities.Notification.bulkCreate(notificationsPayload);
    console.log('[notifyFollowersOnTrip] Created', notificationsPayload.length, 'notifications');

    // Send email to each follower
    const emailPromises = followers.map(follower => {
      const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .trip-title { font-size: 24px; font-weight: bold; color: #059669; margin: 20px 0; }
    .trip-details { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .detail-row { margin: 8px 0; }
    .detail-label { font-weight: 600; color: #6b7280; }
    .cta-button { display: inline-block; background: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🏔️ Nature Explorers</h1>
    </div>
    <div class="content">
      <p>Γεια σου ${follower.user_name || 'φίλε'},</p>
      <p>Ο/Η <strong>${organizer_name}</strong> που ακολουθείς ανάρτησε μια νέα εκδρομή!</p>
      
      <div class="trip-title">${title}</div>
      
      <div class="trip-details">
        <div class="detail-row"><span class="detail-label">📍 Τοποθεσία:</span> ${location}</div>
        ${start_date ? `<div class="detail-row"><span class="detail-label">📅 Ημερομηνία:</span> ${formattedDate}</div>` : ''}
        ${difficulty ? `<div class="detail-row"><span class="detail-label">⚡ Δυσκολία:</span> ${difficulty}</div>` : ''}
      </div>
      
      <center>
        <a href="${fullTripUrl}" class="cta-button">Δες την εκδρομή</a>
      </center>
      
      <div class="footer">
        <p>Λαμβάνεις αυτό το email γιατί ακολουθείς τον/την ${organizer_name} στο NatureExplorers.gr</p>
      </div>
    </div>
  </div>
</body>
</html>
      `;

      return base44.asServiceRole.integrations.Core.SendEmail({
        to: follower.user_email,
        subject: `Νέα εκδρομή από ${organizer_name}: ${title}`,
        body: emailBody
      });
    });

    const emailResults = await Promise.allSettled(emailPromises);
    const emailsSent = emailResults.filter(r => r.status === 'fulfilled').length;
    console.log('[notifyFollowersOnTrip] Emails sent:', emailsSent, '/', followers.length);

    return Response.json({
      success: true,
      followers: followers.length,
      notifications_created: notificationsPayload.length,
      emails_sent: emailsSent
    });

  } catch (error) {
    console.error('[notifyFollowersOnTrip] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});