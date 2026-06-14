import { Resend } from 'resend';
import { CalendarEvent } from '@/lib/types';

// ===========================================================================
// Election reminder emails via Resend (https://resend.com).
//
// Setup:
//   1. Create a free Resend account and get an API key.
//   2. Add RESEND_API_KEY to your environment variables.
//   3. Verify a sending domain (or use Resend's shared onboarding domain for
//      testing) and set EMAIL_FROM_ADDRESS accordingly.
//
// If RESEND_API_KEY isn't set, sendReminderEmail() is a no-op that logs to
// the console — useful for local development without sending real email.
// ===========================================================================

const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || 'Plainly <onboarding@resend.dev>';

interface ReminderEmailParams {
  to: string;
  locationLabel: string;
  upcomingEvents: CalendarEvent[];
}

export async function sendReminderEmail({ to, locationLabel, upcomingEvents }: ReminderEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;

  const subject =
    upcomingEvents.length === 1
      ? `Reminder: ${upcomingEvents[0].title} coming up`
      : `${upcomingEvents.length} upcoming election dates for ${locationLabel}`;

  const html = buildEmailHtml(locationLabel, upcomingEvents);

  if (!apiKey) {
    console.log('[reminders] RESEND_API_KEY not set — would send email:', { to, subject });
    return { skipped: true };
  }

  const resend = new Resend(apiKey);
  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  });
}

function buildEmailHtml(locationLabel: string, events: CalendarEvent[]): string {
  const rows = events
    .map((e) => {
      const date = new Date(e.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      return `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #E8E2D4;">
            <div style="font-weight:700;color:#1A2B3D;">${e.title}</div>
            <div style="color:#5D6B78;font-size:14px;">${date}</div>
            <div style="color:#5D6B78;font-size:14px;margin-top:4px;">${e.sub}</div>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
        <span style="display:inline-flex;width:28px;height:28px;border-radius:8px;background:#D9663E;align-items:center;justify-content:center;">
          <svg width="16" height="16" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M 195 130 C 195 110, 210 100, 235 103 C 300 110, 340 142, 340 182 C 340 222, 300 248, 243 242 C 222 240, 208 235, 199 230 L 199 410 C 199 432, 186 445, 164 447 C 154 448, 145 447, 140 445" fill="none" stroke="#F7F4ED" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        <span style="font-weight:600;font-size:18px;color:#1A2B3D;letter-spacing:1px;">Plainly</span>
      </div>
      <h2 style="color:#1A2B3D;">Upcoming election dates for ${locationLabel}</h2>
      <p style="color:#5D6B78;">Here's what's coming up so you can plan ahead.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        ${rows}
      </table>
      <p style="color:#9aa5ad;font-size:12px;margin-top:24px;">
        You're receiving this because election reminders are turned on in your
        Plainly settings. You can turn them off any time from the menu.
      </p>
    </div>
  `;
}
