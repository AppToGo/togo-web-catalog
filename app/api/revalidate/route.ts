/**
 * API Route: /api/revalidate
 * 
 * Recibe webhooks del backend para revalidar el HTML del catálogo.
 * Al usar cache: 'no-store' en el fetch, cada revalidación hará
 * una petición fresca al backend.
 */

import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || "dev-secret-change-in-production";

export async function POST(request: NextRequest) {
  try {
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

    console.log(`[REVALIDATE] Revalidando: ${token}`);

    // Revalidar el path - esto regenerará el HTML haciendo fetch fresco al backend
    const path = `/catalog/${token}`;
    revalidatePath(path);

    console.log(`[REVALIDATE] ✅ Revalidado: ${path}`);

    return NextResponse.json({
      success: true,
      message: "Catalog revalidated",
      path,
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
