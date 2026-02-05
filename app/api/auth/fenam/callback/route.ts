/**
 * GET /api/auth/fenam/callback
 * Callback dopo login FENAM: FENAM redirige qui con token in query (fenamToken primario, token fallback).
 * Usa helper unificato per evitare duplicazione di logica con /handoff.
 */

import { NextRequest, NextResponse } from "next/server";
import { processFenamAuth } from "@/lib/fenam-auth-helper";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
} as const;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("fenamToken") ?? searchParams.get("token");

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token mancante" }, { status: 400, headers: NO_CACHE_HEADERS });
  }

  const result = await processFenamAuth(token, req, "GET");
  return result.response;
}
