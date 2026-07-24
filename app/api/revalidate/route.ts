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
    // Without a configured secret the endpoint stays disabled (never accept a default)
    if (!REVALIDATE_SECRET) {
      return NextResponse.json(
        { success: false, message: "Revalidation disabled: REVALIDATE_SECRET not set" },
        { status: 503 },
      );
    }

    const body = await request.json();
    const { token, secret } = body;

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

    console.log(`[REVALIDATE] Revalidando catalog: ${token}`);

    // Revalidar por tag - esto regenera el HTML en la próxima visita.
    // Solo existe el tag "catalog-<slug>" (ver lib/api.ts): el emisor
    // (CatalogCacheService en el backend) siempre manda este tipo, así que
    // no hay ningún otro tag real que revalidar.
    const tag = `catalog-${token}`;
    // @ts-ignore - Next.js 16 types requieren 2 args pero runtime funciona con 1
    revalidateTag(tag);

    console.log(`[REVALIDATE] ✅ Revalidado tag: ${tag}`);

    return NextResponse.json({
      success: true,
      message: "Revalidation triggered",
      tag,
      token,
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
