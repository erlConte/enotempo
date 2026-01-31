// NOTE: I dati FENAM vengono salvati nella tabella FenamMember
// tramite Prisma. Non usiamo sessioni o cookie: la membership
// viene verificata di volta in volta via API partendo dall'email.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fenamRegisterSchema, type FenamRegisterInput } from "@/lib/validation";
import { handleApiError } from "@/lib/api-error";
import { sanitizeTextFields } from "@/lib/sanitize";
import { withRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    // Rate limiting
    const rateLimitCheck = withRateLimit(5, 60000); // 5 richieste al minuto
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
    const validationResult = fenamRegisterSchema.safeParse(body);
    if (!validationResult.success) {
      return handleApiError(validationResult.error);
    }

    const data: FenamRegisterInput = validationResult.data;

    // Sanitizzazione input
    const sanitizedData = sanitizeTextFields({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase().trim(),
      phone: data.phone,
    });

    logger.info("FENAM registration attempt", {
      email: sanitizedData.email,
      hasDataConsent: data.dataConsent,
    });

    const member = await prisma.fenamMember.upsert({
      where: { email: sanitizedData.email },
      update: {
        firstName: sanitizedData.firstName,
        lastName: sanitizedData.lastName,
        phone: sanitizedData.phone,
      },
      create: {
        firstName: sanitizedData.firstName,
        lastName: sanitizedData.lastName,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
      },
    });

    logger.info("FENAM member registered/updated", {
      memberId: member.id,
      email: member.email,
    });

    return NextResponse.json(
      { success: true, memberId: member.id },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
