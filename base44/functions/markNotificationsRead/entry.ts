import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { notification_ids } = await req.json();

    if (!notification_ids || !Array.isArray(notification_ids) || notification_ids.length === 0) {
      return Response.json({ updated: 0 });
    }

    // Get all notifications with the given IDs using service role to bypass RLS
    const notifications = await base44.asServiceRole.entities.Notification.filter({
      id: { $in: notification_ids }
    });

    // Update each notification to mark as read
    await Promise.all(
      notifications.map(notification => 
        base44.asServiceRole.entities.Notification.update(notification.id, { is_read: true })
      )
    );

    return Response.json({ updated: notifications.length });
  } catch (error) {
    console.error('[markNotificationsRead] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});