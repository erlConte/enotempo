// API route per gestire i messaggi di contatto

import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api-error";
import { sanitizeTextFields } from "@/lib/sanitize";
import { withRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { emailSchema, nameSchema } from "@/lib/validation";

const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message too long"),
});

export async function POST(req: Request) {
  try {
    // Rate limiting
    const rateLimitCheck = withRateLimit(3, 60000); // 3 richieste al minuto
    const { allowed, retryAfter } = rateLimitCheck(req);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter || 60),
          },
        }
      );
    }

    const body = await req.json();

    // Validazione con Zod
    const validationResult = contactSchema.safeParse(body);
    if (!validationResult.success) {
      return handleApiError(validationResult.error);
    }

    const data = validationResult.data;

    // Sanitizzazione input
    const sanitizedData = sanitizeTextFields({
      name: data.name,
      email: data.email.toLowerCase().trim(),
      message: data.message,
    });

    logger.info("Contact form submission", { messageLength: sanitizedData.message.length });

    // TODO: In futuro, qui si può:
    // - Salvare nel database (creare modello ContactMessage in Prisma)
    // - Inviare email di notifica
    // - Integrare con servizio di email (Resend, SendGrid, ecc.)

    return NextResponse.json(
      { success: true, message: "Message received successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
