/**
 * API Route: /api/catalog-events
 *
 * Reenvía a la API los eventos de analítica del catálogo (flag
 * CATALOG_ANALYTICS). El navegador no puede llamar a la API directo
 * (CSP `connect-src 'self'`), así que pasa por acá. Siempre responde 204:
 * el catálogo no espera nada de esta llamada.
 */

import { NextRequest } from "next/server";

const API_BASE_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000/v1";

/** Tope del cuerpo: 20 eventos ocupan bastante menos. */
const MAX_BODY_BYTES = 16_000;
const SLUG = /^[a-z0-9-]{1,100}$/;

export async function POST(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  if (!SLUG.test(slug)) return new Response(null, { status: 204 });

  const body = await request.text();
  if (!body || body.length > MAX_BODY_BYTES) {
    return new Response(null, { status: 204 });
  }

  try {
    await fetch(`${API_BASE_URL}/catalog/${slug}/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // La API descarta bots por user-agent: se pasa el del visitante.
        "user-agent": request.headers.get("user-agent") ?? "",
      },
      body,
      cache: "no-store",
    });
  } catch {
    // Un evento perdido no afecta al catálogo.
  }
  return new Response(null, { status: 204 });
}
