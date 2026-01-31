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

// Schema per registrazione FENAM
export const fenamRegisterSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  taxCode: z.string().max(20, "Tax code too long").optional(),
  locale: z.enum(["it", "en", "es"]).optional(),
  dataConsent: z.boolean().refine((val) => val === true, {
    message: "Data consent is required",
  }),
});

// Schema per check FENAM
export const fenamCheckSchema = z.object({
  email: emailSchema,
});

// Schema per prenotazione evento
export const reservationSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  participants: z
    .string()
    .or(z.number())
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
    .pipe(z.number().int().min(1, "At least 1 participant").max(20, "Maximum 20 participants")),
  notes: z.string().max(1000, "Notes too long").optional().nullable(),
  eventSlug: z.string().min(1, "Event slug is required"),
  fenamConfirmed: z.boolean().refine((val) => val === true, {
    message: "FENAM membership confirmation is required",
  }),
  dataConsent: z.boolean().refine((val) => val === true, {
    message: "Data consent is required",
  }),
});

// Type inference dagli schemi
export type FenamRegisterInput = z.infer<typeof fenamRegisterSchema>;
export type FenamCheckInput = z.infer<typeof fenamCheckSchema>;
export type ReservationInput = z.infer<typeof reservationSchema>;
