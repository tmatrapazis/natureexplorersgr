// emailNotifications.js
// Calls the send-booking-email Supabase Edge Function.
// Failures are silently swallowed — email is non-critical.

import { supabase } from './supabaseClient';

async function sendEmail({ to, subject, html }) {
  if (!to) return;
  try {
    await supabase.functions.invoke('send-booking-email', {
      body: { to, subject, html },
    });
  } catch {
    // non-critical — do not throw
  }
}

// ─── Booking status emails ────────────────────────────────────────────────────

export async function sendBookingConfirmedEmail({ hikerEmail, hikerName, tripTitle, paymentInstructions }) {
  await sendEmail({
    to: hikerEmail,
    subject: `Booking confirmed: ${tripTitle}`,
    html: `
      <p>Hi ${hikerName || 'there'},</p>
      <p>Great news! Your booking request for <strong>${tripTitle}</strong> has been <strong>confirmed</strong>.</p>
      ${paymentInstructions
        ? `<p><strong>Payment instructions:</strong></p><p style="white-space:pre-line">${paymentInstructions}</p>`
        : '<p>The organizer will contact you with payment details soon.</p>'
      }
      <p>You can view your bookings at <a href="https://natureexplorers.gr/mybookings">My Bookings</a>.</p>
      <p>See you on the trail!<br/>Nature Explorers</p>
    `,
  });
}

export async function sendBookingDeclinedEmail({ hikerEmail, hikerName, tripTitle, reason }) {
  await sendEmail({
    to: hikerEmail,
    subject: `Booking update: ${tripTitle}`,
    html: `
      <p>Hi ${hikerName || 'there'},</p>
      <p>Unfortunately your booking request for <strong>${tripTitle}</strong> was not accepted.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>You can browse other upcoming trips at <a href="https://natureexplorers.gr">Nature Explorers</a>.</p>
      <p>Nature Explorers</p>
    `,
  });
}

export async function sendBookingPaidEmail({ hikerEmail, hikerName, tripTitle }) {
  await sendEmail({
    to: hikerEmail,
    subject: `Payment received: ${tripTitle}`,
    html: `
      <p>Hi ${hikerName || 'there'},</p>
      <p>We've received your payment for <strong>${tripTitle}</strong>. You're all set!</p>
      <p>View your booking details at <a href="https://natureexplorers.gr/mybookings">My Bookings</a>.</p>
      <p>See you on the trail!<br/>Nature Explorers</p>
    `,
  });
}

export async function sendBookingCancelledByHikerEmail({ organizerEmail, organizerName, hikerName, tripTitle, numberOfPeople }) {
  if (!organizerEmail) return;
  await sendEmail({
    to: organizerEmail,
    subject: `Booking cancelled: ${tripTitle}`,
    html: `
      <p>Hi ${organizerName || 'there'},</p>
      <p><strong>${hikerName || 'A hiker'}</strong> cancelled their booking request for <strong>${tripTitle}</strong> (${numberOfPeople} ${numberOfPeople === 1 ? 'person' : 'people'}).</p>
      <p>Manage your bookings at <a href="https://natureexplorers.gr/managebookings">Manage Bookings</a>.</p>
      <p>Nature Explorers</p>
    `,
  });
}
