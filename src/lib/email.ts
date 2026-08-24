import nodemailer from "nodemailer";
import { bookingQrPng } from "./qr";

function transporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

async function send(options: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer; cid?: string }[];
}) {
  const from = process.env.EMAIL_FROM || "TicketBox <noreply@localhost>";
  const tx = transporter();
  if (!tx) {
    console.log("[email:console]", { to: options.to, subject: options.subject });
    return { delivered: false, mode: "console" as const };
  }
  await tx.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments,
  });
  return { delivered: true, mode: "smtp" as const };
}

export async function sendBookingEmail(params: {
  to: string;
  name: string;
  eventTitle: string;
  startsAt: Date;
  venue: string;
  seats: string[];
  reference: string;
  total: number;
}) {
  const png = await bookingQrPng(params.reference);
  const when = params.startsAt.toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" });
  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1208">
      <h1 style="color:#7c2d12">Your TicketBox ticket</h1>
      <p>Hi ${params.name}, your booking is confirmed.</p>
      <p><strong>${params.eventTitle}</strong><br/>${when}<br/>${params.venue}</p>
      <p>Seats: ${params.seats.join(", ")}</p>
      <p>Reference: <strong>${params.reference}</strong></p>
      <p>Show this QR code at the entrance.</p>
      <img src="cid:ticketqr" alt="QR ticket" width="220" />
    </div>
  `;
  return send({
    to: params.to,
    subject: `Ticket confirmed · ${params.reference}`,
    html,
    attachments: [{ filename: `${params.reference}.png`, content: png, cid: "ticketqr" }],
  });
}

export async function sendWaitlistOfferEmail(params: {
  to: string;
  name: string;
  eventTitle: string;
  seats: string[];
  link: string;
  expiresAt: Date;
}) {
  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto">
      <h1 style="color:#7c2d12">A seat opened up</h1>
      <p>Hi ${params.name}, seats are available for <strong>${params.eventTitle}</strong>.</p>
      <p>Offered seats: ${params.seats.join(", ")}</p>
      <p>Complete booking before ${params.expiresAt.toLocaleString("en-IN")} or the seats go to the next person on the waitlist.</p>
      <p><a href="${params.link}" style="display:inline-block;padding:12px 18px;background:#7c2d12;color:white;text-decoration:none;border-radius:8px">Complete booking</a></p>
    </div>
  `;
  return send({
    to: params.to,
    subject: `Waitlist offer · ${params.eventTitle}`,
    html,
  });
}
export async function sendCancellationEmail(params: {
  to: string;
  name: string;
  eventTitle: string;
  seats: string[];
  reference: string;
}) {
  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1208">
      <h1 style="color:#7c2d12">Your TicketBox booking was cancelled</h1>

      <p>Hi ${params.name},</p>

      <p>Your ticket booking has been successfully cancelled.</p>

      <p>
        <strong>${params.eventTitle}</strong><br/>
        Seats: ${params.seats.join(", ")}<br/>
        Reference: <strong>${params.reference}</strong>
      </p>

      <p>The seats have been released successfully.</p>

      <p>Thank you for using TicketBox.</p>
    </div>
  `;

  return send({
    to: params.to,
    subject: `Booking cancelled · ${params.reference}`,
    html,
  });
}