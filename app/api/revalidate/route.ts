/**
 * API Route: /api/revalidate
 * 
 * Recibe webhooks del backend para revalidar el HTML del catálogo.
 * Usa revalidateTag para invalidar la caché ISR de forma precisa.
 */

import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Sin secret configurado el endpoint queda deshabilitado (nunca aceptar un default)
    if (!REVALIDATE_SECRET) {
      return NextResponse.json(
        { success: false, message: "Revalidation disabled: REVALIDATE_SECRET not set" },
        { status: 503 },
      );
    }

    const body = await request.json();
    const { token, secret, type = "catalog" } = body;

    // Validar secret
    if (!secret || secret !== REVALIDATE_SECRET) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invalid secret" },
        { status: 401 },
      );
    }

    if (!token || typeof token !== "string" || token.length < 10) {
      return NextResponse.json(
        { success: false, message: "Bad Request: Invalid token" },
        { status: 400 },
      );
    }

    console.log(`[REVALIDATE] Revalidando ${type}: ${token}`);

    // Revalidar por tag - esto regenera el HTML en la próxima visita
    const tag = type === "categories" ? `categories-${token}` : `catalog-${token}`;
    // @ts-ignore - Next.js 16 types requieren 2 args pero runtime funciona con 1
    revalidateTag(tag);

    console.log(`[REVALIDATE] ✅ Revalidado tag: ${tag}`);

    return NextResponse.json({
      success: true,
      message: "Revalidation triggered",
      tag,
      token,
      type,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[REVALIDATE] ❌ Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal error", error: String(error) },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ success: false, message: "Use POST" }, { status: 405 });
}
