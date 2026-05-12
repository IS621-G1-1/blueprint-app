import nodemailer from "nodemailer";

const emailProvider = process.env.EMAIL_PROVIDER; // "mailpit" | undefined (defaults to gmail)
const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
const emailFrom =
  process.env.EMAIL_FROM ||
  (emailProvider === "mailpit"
    ? "BlueprintT <noreply@blueprint.local>"
    : `BlueprintT <${gmailUser}>`);

const transporter =
  emailProvider === "mailpit"
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST ?? "mailpit",
        port: Number(process.env.SMTP_PORT ?? 1025),
        secure: false,
        ignoreTLS: true,
      })
    : gmailUser && gmailAppPassword
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailAppPassword,
        },
      })
    : null;

export async function sendVerificationEmail(
  email: string,
  code: string,
  name: string
): Promise<void> {
  if (!transporter) {
    // Development mode: log to console
    console.log(`\nDevelopment Mode - Verification Code for ${name} (${email}):`);
    console.log(`Code: ${code}`);
    console.log(`Valid for 15 minutes\n`);
    return;
  }

  try {
    await transporter.sendMail({
      from: emailFrom,
      to: email,
      subject: "BlueprintT - Email Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>Welcome to BlueprintT, ${name}!</h2>
          <p>Thank you for signing up. Please verify your email address using the code below:</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="letter-spacing: 8px; color: #333;">${code}</h1>
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw new Error("Failed to send verification email");
  }
}
