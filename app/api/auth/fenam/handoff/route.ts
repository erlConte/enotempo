/**
 * POST /api/auth/fenam/handoff
 * Riceve POST da FeNAM (HTML autosubmit). Body: token (HMAC firmato), redirect in query.
 * Usa helper unificato per evitare duplicazione di logica con /callback.
 */

import { NextRequest, NextResponse } from "next/server";
import { processFenamAuth } from "@/lib/fenam-auth-helper";

export async function POST(req: NextRequest) {
  let body: { token?: string };
  const contentType = req.headers.get("content-type") || "";
  
  try {
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const token = formData.get("token");
      body = { token: typeof token === "string" ? token : undefined };
    } else {
      return NextResponse.json(
        { error: "Content-Type non supportato. Usa application/json o form." },
        { status: 400 }
      );
    }

    const token = body?.token;
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token mancante" },
        { status: 400 }
      );
    }

    const result = await processFenamAuth(token, req, "POST");
    return result.response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Handoff fallito";
    return NextResponse.json(
      { error: message },
      { status: 401 }
    );
  }
}
