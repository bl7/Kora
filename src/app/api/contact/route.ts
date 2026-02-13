import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/http";
import { sendContactFormNotification, sendContactFormConfirmation } from "@/lib/mail";

const contactSchema = z.object({
  name: z.string().min(2).max(120),
  company: z.string().min(2).max(200),
  email: z.string().email().max(255),
  phone: z.string().regex(/^\+977\d{10}$/, "Phone must be in +977XXXXXXXXXX format"),
  teamSize: z.string().min(1),
  message: z.string().min(10).max(2000),
});

export async function POST(request: Request) {
  const parseResult = contactSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return jsonError(400, parseResult.error.issues[0]?.message ?? "Invalid form data");
  }

  const { name, company, email, phone, teamSize, message } = parseResult.data;

  // Get company email from env (fallback to GMAIL_USER if not set)
  const companyEmail = process.env.CONTACT_EMAIL ?? process.env.GMAIL_USER;

  if (!companyEmail) {
    console.error("[contact] CONTACT_EMAIL or GMAIL_USER not set");
    return jsonError(500, "Contact form is not configured. Please try again later.");
  }

  try {
    // Send notification to company (fire-and-forget)
    sendContactFormNotification(companyEmail, name, company, email, phone, teamSize, message).catch((err) =>
      console.error("[mail] Failed to send contact notification:", err)
    );

    // Send confirmation to user (fire-and-forget)
    sendContactFormConfirmation(email, name).catch((err) =>
      console.error("[mail] Failed to send contact confirmation:", err)
    );

    return jsonOk({ message: "Your message has been sent successfully." });
  } catch (error) {
    console.error("[contact] Error processing contact form:", error);
    return jsonError(500, "Failed to send message. Please try again later.");
  }
}

