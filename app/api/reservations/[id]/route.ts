/**
 * PATCH /api/reservations/:id
 * Aggiorna dati prenotazione (checkout: nome/cognome/telefono/email su FenamMember, note su reservation).
 * Solo proprietario, solo status pending_payment. Email: aggiorna solo se attuale è placeholder e arriva reale.
 * P2002 (unique email) → 409 EMAIL_ALREADY_IN_USE. Nessun PII nei log.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { patchReservationSchema, type PatchReservationInput } from "@/lib/validation";
import { handleApiError } from "@/lib/api-error";
import { sanitizeTextFields } from "@/lib/sanitize";
import { verifySessionToken, FENAM_SESSION_COOKIE, isPlaceholderEmail } from "@/lib/fenam-handoff";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(FENAM_SESSION_COOKIE)?.value;
    const session = verifySessionToken(cookieValue);
    if (!session) {
      return NextResponse.json(
        { error: "Sessione non valida. Accedi con FENAM." },
        { status: 401 }
      );
    }

    const { id: reservationId } = await params;
    const body = await req.json();
    const validationResult = patchReservationSchema.safeParse(body);
    if (!validationResult.success) {
      return handleApiError(validationResult.error);
    }
    const data: PatchReservationInput = validationResult.data;

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { fenamMember: true },
    });
    if (!reservation || reservation.fenamMemberId !== session.fenamMemberId) {
      return NextResponse.json(
        { error: "Prenotazione non trovata" },
        { status: 404 }
      );
    }
    if (reservation.status !== "pending_payment") {
      return NextResponse.json(
        { error: "Questa prenotazione non è in attesa di pagamento." },
        { status: 400 }
      );
    }

    const memberData: { firstName?: string; lastName?: string; phone?: string | null; email?: string } = {};
    if (data.firstName != null) memberData.firstName = sanitizeTextFields({ firstName: data.firstName }).firstName;
    if (data.lastName != null) memberData.lastName = sanitizeTextFields({ lastName: data.lastName }).lastName;
    if (data.phone !== undefined) memberData.phone = data.phone ? sanitizeTextFields({ phone: data.phone }).phone : null;

    const rawEmail = data.email != null && typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    const newEmail = rawEmail && rawEmail.length > 0 ? rawEmail : null;
    const currentEmail = reservation.fenamMember.email;
    if (newEmail != null) {
      if (isPlaceholderEmail(currentEmail) || !currentEmail?.trim()) {
        memberData.email = newEmail;
      }
    }

    if (Object.keys(memberData).length > 0) {
      try {
        await prisma.fenamMember.update({
          where: { id: reservation.fenamMemberId },
          data: {
            ...(memberData.firstName !== undefined && { firstName: memberData.firstName }),
            ...(memberData.lastName !== undefined && { lastName: memberData.lastName }),
            ...(memberData.phone !== undefined && { phone: memberData.phone }),
            ...(memberData.email !== undefined && { email: memberData.email }),
          },
        });
      } catch (e: unknown) {
        const code = e && typeof e === "object" && "code" in e ? (e as { code?: string }).code : null;
        if (code === "P2002") {
          return NextResponse.json(
            { error: "EMAIL_ALREADY_IN_USE" },
            { status: 409 }
          );
        }
        throw e;
      }
    }

    if (data.notes !== undefined) {
      const notes = data.notes ? sanitizeTextFields({ notes: data.notes }).notes : null;
      await prisma.reservation.update({
        where: { id: reservationId },
        data: { notes },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
