/**
 * Gestione errori standardizzata per le API routes
 */

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { logger } from "./logger";

export interface ApiErrorResponse {
  error: string;
  details?: string;
}

/**
 * Mappa codici errore Prisma a messaggi user-friendly
 */
const PRISMA_ERROR_MESSAGES: Record<string, string> = {
  P2002: "A record with this value already exists",
  P2003: "Invalid reference to related record",
  P1001: "Database connection error",
  P2025: "Record not found",
};

/**
 * Gestisce errori e restituisce risposta standardizzata
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  // Errore di validazione Zod
  if (error instanceof ZodError) {
    const firstError = error.errors[0];
    logger.warn("Validation error", { errors: error.errors });
    return NextResponse.json(
      {
        error: firstError?.message || "Validation error",
        details: process.env.NODE_ENV === "development" ? JSON.stringify(error.errors) : undefined,
      },
      { status: 400 }
    );
  }

  // Errore Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const errorMessage = PRISMA_ERROR_MESSAGES[error.code] || "Database error";
    logger.error("Prisma error", error, { code: error.code, meta: error.meta });
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }

  // Errore Prisma generico
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    logger.error("Prisma unknown error", error);
    return NextResponse.json(
      {
        error: "Database connection error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }

  // Errore standard
  if (error instanceof Error) {
    logger.error("API error", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }

  // Errore sconosciuto
  logger.error("Unknown error", error);
  return NextResponse.json(
    {
      error: "Internal server error",
    },
    { status: 500 }
  );
}

/**
 * Wrapper per gestire errori nelle API routes
 */
export function withErrorHandling<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiErrorResponse>> {
  return handler().catch((error) => handleApiError(error) as NextResponse<T | ApiErrorResponse>);
}
