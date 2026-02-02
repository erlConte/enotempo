/**
 * GET /api/payments/paypal/status
 * Ritorna { configured: boolean, missing: string[] } (solo nomi env, mai valori).
 */

import { NextResponse } from "next/server";
import { getPayPalConfigStatus } from "@/lib/paypal";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = getPayPalConfigStatus();
  return NextResponse.json(status);
}
