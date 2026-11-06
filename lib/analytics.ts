/**
 * Analítica del catálogo (flag CATALOG_ANALYTICS) — solo navegador.
 *
 * Junta los eventos en memoria y los envía en lote a `/api/catalog-events`
 * cada 5 s y al ocultar la página. Sin datos personales: la sesión es el
 * id aleatorio del carrito. No envía nada hasta que `configureCatalogAnalytics`
 * lo activa (negocio con el flag y fuera del modo operador).
 */

import type { CustomerOrigin } from "@/src/types/catalog.types";

export type CatalogEventType =
  | "CATALOG_VISIT"
  | "CATEGORY_VIEW"
  | "PRODUCT_VIEW"
  | "ADD_TO_CART"
  | "CHECKOUT_START"
  | "ORDER_PLACED"
  | "SEARCH"
  | "FEATURED_CLICK"
  | "RECOMMENDATION_CLICK";

interface CatalogEvent {
  type: CatalogEventType;
  productId?: string;
  categoryId?: string;
  orderId?: string;
  query?: string;
  resultCount?: number;
  at: string;
}

export interface CatalogAnalyticsConfig {
  businessSlug: string;
  sessionId: string;
  origin?: CustomerOrigin;
  branchId?: string;
  token?: string;
}

const FLUSH_INTERVAL_MS = 5_000;
/** El servidor acepta hasta 20 eventos por envío. */
const MAX_BATCH = 20;
/** Tope de la cola: si el envío falla, no crece sin límite. */
const MAX_QUEUE = 100;
/** Ver el mismo producto otra vez dentro de este lapso no cuenta. */
const PRODUCT_VIEW_DEDUPE_MS = 30 * 60 * 1000;

let config: CatalogAnalyticsConfig | null = null;
let queue: CatalogEvent[] = [];
let timer: ReturnType<typeof setInterval> | null = null;
const lastProductView = new Map<string, number>();

/** Activa el envío con los datos de la sesión, o lo apaga con `null`. */
export function configureCatalogAnalytics(
  next: CatalogAnalyticsConfig | null,
): void {
  if (typeof window === "undefined") return;
  if (!next) {
    flush();
    config = null;
    queue = [];
    stopTimer();
    return;
  }
  config = next;
  if (!timer) {
    timer = setInterval(flush, FLUSH_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flush);
  }
  trackVisitOncePerDay(next.businessSlug);
}

/** Registra un evento. Sin configuración activa, no hace nada. */
export function trackCatalogEvent(
  type: CatalogEventType,
  data: Omit<CatalogEvent, "type" | "at"> = {},
): void {
  if (!config) return;
  if (type === "PRODUCT_VIEW" && data.productId) {
    const now = Date.now();
    const last = lastProductView.get(data.productId);
    if (last && now - last < PRODUCT_VIEW_DEDUPE_MS) return;
    lastProductView.set(data.productId, now);
  }
  queue.push({ type, ...data, at: new Date().toISOString() });
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
}

function trackVisitOncePerDay(businessSlug: string): void {
  const key = `catalog-visit-${businessSlug}`;
  const today = new Date().toISOString().slice(0, 10);
  try {
    if (localStorage.getItem(key) === today) return;
    localStorage.setItem(key, today);
  } catch {
    // Sin localStorage (modo privado): se cuenta igual.
  }
  trackCatalogEvent("CATALOG_VISIT");
}

function onVisibilityChange(): void {
  if (document.visibilityState === "hidden") flush();
}

function stopTimer(): void {
  if (timer) clearInterval(timer);
  timer = null;
  document.removeEventListener("visibilitychange", onVisibilityChange);
  window.removeEventListener("pagehide", flush);
}

function flush(): void {
  if (!config || queue.length === 0) return;
  const { businessSlug, ...session } = config;
  while (queue.length > 0) {
    const events = queue.splice(0, MAX_BATCH);
    const body = JSON.stringify({ ...session, events });
    const url = `/api/catalog-events?slug=${encodeURIComponent(businessSlug)}`;
    // sendBeacon sobrevive al cierre de la pestaña; si no está, fetch keepalive.
    const sent =
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    if (!sent) {
      fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => undefined);
    }
  }
}
