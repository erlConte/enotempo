// NOTE: I dati FENAM vengono salvati nella tabella FenamMember
// tramite Prisma. Non usiamo sessioni o cookie: la membership
// viene verificata di volta in volta via API partendo dall'email.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fenamCheckSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/api-error";
import { withRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    // Rate limiting
    const rateLimitCheck = withRateLimit(20, 60000); // 20 richieste al minuto
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
    const validationResult = fenamCheckSchema.safeParse(body);
    if (!validationResult.success) {
      return handleApiError(validationResult.error);
    }

    const { email } = validationResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const member = await prisma.fenamMember.findUnique({
      where: { email: normalizedEmail },
    });

    logger.debug("FENAM check", {
      email: normalizedEmail,
      isMember: !!member,
    });

    return NextResponse.json(
      { isMember: !!member },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
