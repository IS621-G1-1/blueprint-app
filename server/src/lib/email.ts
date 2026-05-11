import nodemailer, { type Transporter } from "nodemailer";

// Configured at module load. EMAIL_PROVIDER picks the SMTP target:
//   - mailpit  → mailpit:1025, no auth (local dev)
//   - sendgrid → smtp.sendgrid.net:587, login=apikey + SENDGRID_API_KEY (live demo)
// Same SendGrid creds work in both Mailpit and live; switching is just the flag.

const provider = (process.env.EMAIL_PROVIDER ?? "mailpit").toLowerCase();

let transporter: Transporter;
let senderEmail: string;

if (provider === "sendgrid") {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("SENDGRID_API_KEY and SENDGRID_FROM_EMAIL required when EMAIL_PROVIDER=sendgrid");
  }
  transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    secure: false, // STARTTLS upgrade
    auth: { user: "apikey", pass: apiKey },
  });
  senderEmail = from;
} else if (provider === "mailpit") {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "mailpit",
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false,
    ignoreTLS: true,
  });
  senderEmail = process.env.SMTP_FROM_EMAIL ?? "noreply@blueprint.local";
} else {
  throw new Error(`Unknown EMAIL_PROVIDER: ${provider}`);
}

export async function sendOtpEmail(to: string, name: string, code: string): Promise<void> {
  const subject = "Your Blueprint verification code";
  const text =
    `Hi ${name},\n\n` +
    `Your verification code is: ${code}\n\n` +
    `Enter this code on the verification screen to activate your account.\n` +
    `This code expires in 15 minutes.\n\n` +
    `If you didn't request this, you can ignore this email.\n\n— Blueprint`;
  const html = `
    <div style="font-family: -apple-system, Segoe UI, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1e293b;">Verify your Blueprint account</h2>
      <p>Hi ${escapeHtml(name)},</p>
      <p>Your verification code is:</p>
      <div style="font-size: 32px; font-weight: 600; letter-spacing: 8px; padding: 20px; background: #f1f5f9; border-radius: 8px; text-align: center; color: #1e293b; margin: 20px 0;">
        ${code}
      </div>
      <p style="color: #64748b; font-size: 14px;">This code expires in 15 minutes.</p>
      <p style="color: #64748b; font-size: 14px;">If you didn't request this, you can ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: { name: "Blueprint", address: senderEmail },
    to,
    subject,
    text,
    html,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
