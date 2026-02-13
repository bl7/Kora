import nodemailer from "nodemailer";

/**
 * Gmail SMTP transport for development / early stage.
 *
 * Required env vars:
 *   GMAIL_USER     – your Gmail address (e.g. kora.app.dev@gmail.com)
 *   GMAIL_APP_PASS – a 16-char App Password (NOT your normal password)
 *
 * To generate an App Password:
 *   1. Enable 2-Step Verification on the Google account
 *   2. Go to https://myaccount.google.com/apppasswords
 *   3. Create an app password for "Mail" → "Other (Kora)"
 *   4. Copy the 16-char code into GMAIL_APP_PASS env var
 */

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASS;

  if (!user || !pass) {
    console.warn("[mail] GMAIL_USER or GMAIL_APP_PASS not set – emails will be logged to console only");
    return null;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  return transporter;
}

type SendMailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendMail(options: SendMailOptions) {
  const t = getTransporter();

  const from = process.env.GMAIL_USER ?? "noreply@kora.app";

  if (!t) {
    // Dev fallback: log to console
    console.log("─── EMAIL (console fallback) ───");
    console.log(`To:      ${options.to}`);
    console.log(`From:    ${from}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body:\n${options.text}`);
    console.log("────────────────────────────────");
    return;
  }

  await t.sendMail({
    from: `"Kora" <${from}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

/* ── Specific email templates ── */

export async function sendEmailVerification(to: string, fullName: string, verifyUrl: string) {
  await sendMail({
    to,
    subject: "Verify your Kora account",
    text: `Hi ${fullName},\n\nPlease verify your email by clicking the link below:\n\n${verifyUrl}\n\nThis link expires in 24 hours.\n\n— Kora`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="font-size:20px;margin:0 0 16px;">Verify your email</h2>
        <p>Hi ${fullName},</p>
        <p>Click the button below to verify your email address:</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#18181b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">Verify Email</a>
        <p style="font-size:13px;color:#71717a;">This link expires in 24 hours. If you didn't create a Kora account, you can safely ignore this.</p>
        <p style="margin-top:24px;color:#a1a1aa;font-size:12px;">— Kora</p>
      </div>
    `,
  });
}

export async function sendPasswordReset(to: string, fullName: string, resetUrl: string) {
  await sendMail({
    to,
    subject: "Reset your Kora password",
    text: `Hi ${fullName},\n\nYou requested a password reset. Click the link below:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.\n\n— Kora`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="font-size:20px;margin:0 0 16px;">Reset your password</h2>
        <p>Hi ${fullName},</p>
        <p>Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display:inline-block;background:#18181b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">Reset Password</a>
        <p style="font-size:13px;color:#71717a;">This link expires in 1 hour. If you didn't request a reset, you can safely ignore this.</p>
        <p style="margin-top:24px;color:#a1a1aa;font-size:12px;">— Kora</p>
      </div>
    `,
  });
}

export async function sendStaffCredentials(
  to: string,
  fullName: string,
  companyName: string,
  password: string,
  loginUrl: string
) {
  await sendMail({
    to,
    subject: `You've been added to ${companyName} on Kora`,
    text: `Hi ${fullName},\n\nYou've been added as a team member at ${companyName} on Kora.\n\nYour login credentials:\nEmail: ${to}\nPassword: ${password}\n\nLog in at: ${loginUrl}\n\nPlease change your password after your first login.\n\n— Kora`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="font-size:20px;margin:0 0 16px;">Welcome to Kora 👋</h2>
        <p>Hi ${fullName},</p>
        <p>You've been added to <strong>${companyName}</strong>. Here are your login credentials:</p>
        <div style="background:#f4f4f5;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0 0 8px;"><strong>Email:</strong> ${to}</p>
          <p style="margin:0;"><strong>Password:</strong> <code style="background:#e4e4e7;padding:2px 6px;border-radius:4px;">${password}</code></p>
        </div>
        <a href="${loginUrl}" style="display:inline-block;background:#18181b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:8px 0;">Log in to Kora</a>
        <p style="font-size:13px;color:#71717a;">Please change your password after your first login.</p>
        <p style="margin-top:24px;color:#a1a1aa;font-size:12px;">— Kora</p>
      </div>
    `,
  });
}

export async function sendContactFormNotification(
  to: string,
  name: string,
  company: string,
  email: string,
  phone: string,
  teamSize: string,
  message: string
) {
  await sendMail({
    to,
    subject: `New demo request from ${name} at ${company}`,
    text: `New demo request:\n\nName: ${name}\nCompany: ${company}\nEmail: ${email}\nPhone: ${phone}\nTeam Size: ${teamSize}\n\nMessage:\n${message}\n\n— Kora Demo Request`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;">
        <h2 style="font-size:20px;margin:0 0 16px;">New Demo Request</h2>
        <div style="background:#f4f4f5;padding:20px;border-radius:8px;margin:16px 0;">
          <p style="margin:0 0 8px;"><strong>Name:</strong> ${name}</p>
          <p style="margin:0 0 8px;"><strong>Company:</strong> ${company}</p>
          <p style="margin:0 0 8px;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p style="margin:0 0 8px;"><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
          <p style="margin:0;"><strong>Team Size:</strong> ${teamSize}</p>
        </div>
        <div style="background:#f4f4f5;padding:20px;border-radius:8px;margin:16px 0;">
          <p style="margin:0 0 8px;"><strong>Message:</strong></p>
          <p style="margin:0;white-space:pre-wrap;">${message.replace(/\n/g, "<br>")}</p>
        </div>
        <p style="margin-top:24px;color:#a1a1aa;font-size:12px;">— Kora Demo Request</p>
      </div>
    `,
  });
}

export async function sendContactFormConfirmation(to: string, name: string) {
  await sendMail({
    to,
    subject: "We've received your message",
    text: `Hi ${name},\n\nThank you for reaching out to Kora. We've received your message and will get back to you as soon as possible.\n\n— Kora Team`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="font-size:20px;margin:0 0 16px;">Thank you for reaching out!</h2>
        <p>Hi ${name},</p>
        <p>We've received your message and will get back to you as soon as possible.</p>
        <p style="margin-top:24px;color:#a1a1aa;font-size:12px;">— Kora Team</p>
      </div>
    `,
  });
}

