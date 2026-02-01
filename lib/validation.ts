/**
 * Schemi di validazione Zod per le API routes
 */

import { z } from "zod";

// Schema per validazione email
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .min(1, "Email is required")
  .max(255, "Email too long");

// Schema per validazione telefono (formato flessibile)
export const phoneSchema = z
  .string()
  .min(1, "Phone is required")
  .max(50, "Phone number too long")
  .regex(/^[\d\s\+\-\(\)]+$/, "Invalid phone format");

// Schema per validazione nome/cognome
export const nameSchema = z
  .string()
  .min(1, "This field is required")
  .max(100, "Name too long")
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Invalid characters in name");

// Schema per prenotazione evento: 1 persona, server usa email del membro; firstName/lastName opzionali (per membri con nome vuoto)
export const reservationSchema = z.object({
  eventSlug: z.string().min(1, "Event slug is required"),
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  notes: z.string().max(1000, "Notes too long").optional().nullable(),
  rulesAccepted: z.boolean().refine((val) => val === true, {
    message: "Acceptance of rules is required",
  }),
  dataConsent: z.boolean().refine((val) => val === true, {
    message: "Data consent is required",
  }),
});

export type ReservationInput = z.infer<typeof reservationSchema>;
