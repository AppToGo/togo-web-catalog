/**
 * API Client - Ultra Optimizado
 *
 * FETCH ESTRATEGY:
 * - Server Components: cache con tags para revalidación
 * - Client Components: no-store para datos en tiempo real
 * - ISR: revalidate on-demand via webhook
 *
 * PERFORMANCE:
 * - Connection pooling (keep-alive)
 * - Compression automática
 * - Retry con backoff exponencial
 *
 * MIGRATION NOTE:
 * This file now uses the normalized catalog endpoints (BusinessProduct + GlobalProduct)
 * via the new web-catalog API at /api/v1/web-catalog/:businessSlug
 */

import type {
  CatalogResponse,
  CatalogProduct,
  Category,
  Cart,
  CartItem,
  OrderResponse,
  CustomerOrigin,
} from "@/src/types/catalog.types";

// Re-export legacy types for backward compatibility during migration
export type {
  CatalogResponse as Catalog,
  CatalogProduct as Product,
  Category,
  Cart,
  CartItem,
  OrderResponse,
  CustomerOrigin,
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/v1";

// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════

const DEFAULT_REVALIDATE = 86400; // 24 horas — red de seguridad; la revalidación on-demand cubre el caso normal

// ═══════════════════════════════════════════════════════════
// ERRORS
// ═══════════════════════════════════════════════════════════

export class NotFoundError extends Error {
  readonly status = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error {
  readonly status = 429;
  constructor() {
    super('Too Many Requests');
    this.name = 'RateLimitError';
  }
}

export class InvalidTokenError extends Error {
  readonly status = 401;
  constructor(message?: string) {
    super(message || 'Token inválido o expirado');
    this.name = 'InvalidTokenError';
  }
}

// ═══════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════

function buildWebCatalogUrl(businessSlug: string, path: string = ""): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}/web-catalog/${businessSlug}${cleanPath}`;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "Error desconocido",
    }));

    if (response.status === 404) {
      throw new NotFoundError(error.message || "El negocio no existe");
    }

    if (response.status === 429) {
      throw new RateLimitError();
    }

    if (response.status === 401 || response.status === 403) {
      throw new InvalidTokenError(error.message);
    }

    throw new Error(error.message || `Error ${response.status}`);
  }
  return response.json();
}

// ═══════════════════════════════════════════════════════════
// SERVER-SIDE FETCH (CACHEABLE) - CATÁLOGO PÚBLICO
// ═══════════════════════════════════════════════════════════

/**
 * Obtiene el catálogo público por businessSlug.
 *
 * Uses normalized catalog endpoint: GET /api/v1/web-catalog/:businessSlug
 * Returns BusinessProduct + GlobalProduct combined data.
 *
 * Si se proporciona token, se obtienen también los datos del customer.
 * El backend decide si requiere token o no según la configuración del negocio.
 */
export async function fetchCatalog(
  businessSlug: string,
  options?: { token?: string; table?: string },
): Promise<CatalogResponse> {
  const url = new URL(buildWebCatalogUrl(businessSlug));

  if (options?.token) {
    url.searchParams.set("token", options.token);
  }
  if (options?.table) {
    url.searchParams.set("table", options.table);
  }

  const response = await fetch(url.toString(), {
    next: {
      tags: [`catalog-${businessSlug}`, "catalog"],
      revalidate: DEFAULT_REVALIDATE,
    },
    headers: { Accept: "application/json" },
  });

  return handleResponse<CatalogResponse>(response);
}

/**
 * Legacy: Obtiene catálogo por token (para redirecciones)
 * @deprecated Usar fetchCatalog con businessSlug
 */
export async function getCatalog(token: string): Promise<CatalogResponse> {
  const response = await fetch(
    `${API_BASE_URL}/web-catalog/by-token/${token}`,
    {
      next: {
        tags: [`catalog-${token}`, "catalog"],
        revalidate: DEFAULT_REVALIDATE,
      },
      headers: { Accept: "application/json" },
    },
  );

  return handleResponse<CatalogResponse>(response);
}

export async function getCategories(businessSlug: string): Promise<Category[]> {
  const response = await fetch(
    buildWebCatalogUrl(businessSlug, "/categories"),
    {
      next: {
        tags: [`categories-${businessSlug}`, "categories"],
        revalidate: DEFAULT_REVALIDATE,
      },
    },
  );
  return handleResponse<Category[]>(response);
}

export async function getProduct(
  businessSlug: string,
  productId: string,
): Promise<CatalogProduct | null> {
  try {
    const response = await fetch(
      buildWebCatalogUrl(businessSlug, `/products/${productId}`),
      {
        next: {
          tags: [`product-${productId}`, `catalog-${businessSlug}`],
          revalidate: DEFAULT_REVALIDATE,
        },
      },
    );

    if (!response.ok) return null;
    return handleResponse<CatalogProduct>(response);
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// CLIENT-SIDE OPERATIONS (NO CACHE)
// ═══════════════════════════════════════════════════════════

/**
 * Search products
 * Uses normalized catalog search endpoint
 */
export async function searchProducts(
  businessSlug: string,
  query: string,
): Promise<CatalogProduct[]> {
  const url = new URL(buildWebCatalogUrl(businessSlug, "/search"));
  url.searchParams.set("q", query);

  const response = await fetch(url.toString(), {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  const result = await handleResponse<{ products: CatalogProduct[] }>(response);
  return result.products;
}

/**
 * Agrega item al carrito (público o autenticado)
 *
 * Body esperado por backend:
 * { sessionId: string, productId: string, quantity: number }
 *
 * Note: productId should be the BusinessProduct ID from normalized catalog
 */
export async function addToCart(
  businessSlug: string,
  item: CartItem,
  options?: { sessionId: string },
): Promise<Cart> {
  const url = new URL(buildWebCatalogUrl(businessSlug, "/cart"));

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: options?.sessionId,
      productId: item.productId,
      quantity: item.quantity,
      notes: item.notes,
      ...(item.variantId !== undefined ? { variantId: item.variantId } : {}),
    }),
    cache: "no-store",
  });

  return handleResponse<Cart>(response);
}

export async function getCart(
  businessSlug: string,
  options?: { sessionId: string },
): Promise<Cart> {
  const url = new URL(buildWebCatalogUrl(businessSlug, "/cart"));
  if (options?.sessionId) url.searchParams.set("sessionId", options.sessionId);

  const response = await fetch(url.toString(), {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  return handleResponse<Cart>(response);
}

/**
 * Actualiza cantidad de un item
 *
 * Body esperado por backend:
 * { sessionId: string, productId: string, quantity: number, variantId?: string }
 */
export async function updateCartItem(
  businessSlug: string,
  productId: string,
  quantity: number,
  options?: { sessionId: string },
  notes?: string,
  variantId?: string,
): Promise<Cart> {
  const url = new URL(buildWebCatalogUrl(businessSlug, "/cart/update"));

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: options?.sessionId,
      productId,
      quantity,
      ...(notes !== undefined ? { notes } : {}),
      ...(variantId !== undefined ? { variantId } : {}),
    }),
    cache: "no-store",
  });

  return handleResponse<Cart>(response);
}

/**
 * Elimina item del carrito
 *
 * Body esperado por backend:
 * { sessionId: string, productId: string, variantId?: string }
 */
export async function removeFromCart(
  businessSlug: string,
  productId: string,
  options?: { sessionId: string },
  variantId?: string,
): Promise<Cart> {
  const url = new URL(buildWebCatalogUrl(businessSlug, "/cart/remove"));

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: options?.sessionId,
      productId,
      ...(variantId !== undefined ? { variantId } : {}),
    }),
    cache: "no-store",
  });

  return handleResponse<Cart>(response);
}

// ═══════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════

/**
 * Crea una orden
 *
 * Body esperado por backend:
 * { sessionId: string, items: CartItem[], notes?: string, source: CustomerOrigin }
 */
export async function createOrder(
  businessSlug: string,
  data: {
    items: CartItem[];
    notes?: string;
    source: CustomerOrigin;
    sessionId: string;
    customerPhone?: string;
    customerName?: string;
  },
): Promise<OrderResponse> {
  const sanitizedData = {
    ...data,
    items: data.items.map(({ variantLabel, variantAttributes, image, ...rest }) => rest),
  };
  const response = await fetch(buildWebCatalogUrl(businessSlug, "/order"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sanitizedData),
    cache: "no-store",
  });

  return handleResponse<OrderResponse>(response);
}

/**
 * Actualiza una orden DRAFT anónima (sin token) con el carrito actual de la
 * sesión — reemplaza todos los items, no solo las notas.
 * Pega a /catalog/:businessSlug/order (PublicOrderService.updateOrder), NO a
 * /web-catalog/:businessSlug/order/:orderId (esa ruta no existe — es
 * token-only y no matchea ningún endpoint para un slug real).
 */
export async function updateOrder(
  businessSlug: string,
  orderId: string,
  data: { notes?: string; sessionId: string; branchId: string },
): Promise<OrderResponse> {
  const response = await fetch(buildPublicCatalogUrl(businessSlug, "/order"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, ...data }),
    cache: "no-store",
  });

  return handleResponse<OrderResponse>(response);
}

// ═══════════════════════════════════════════════════════════
// TOKEN-BASED OPERATIONS (WhatsApp token flow)
// Usados cuando la URL lleva ?t=TOKEN y el usuario viene de WhatsApp.
// Endpoints: /api/v1/web-catalog/:token/*
// ═══════════════════════════════════════════════════════════

function buildTokenUrl(token: string, path: string = ""): string {
  const cleanPath = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `${API_BASE_URL}/web-catalog/${token}${cleanPath}`;
}

/** GET /api/v1/web-catalog/:token/cart */
export async function getCartByToken(token: string): Promise<Cart> {
  const response = await fetch(buildTokenUrl(token, "/cart"), {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  return handleResponse<Cart>(response);
}

/**
 * POST /api/v1/web-catalog/:token/cart
 *
 * quantity is a delta, not an absolute value:
 *   positive → add units to the product's current quantity
 *   negative → remove units (backend rejects if result goes below 1)
 *   0        → update notes only, quantity unchanged
 */
export async function addToCartByToken(
  token: string,
  item: CartItem,
): Promise<Cart> {
  const response = await fetch(buildTokenUrl(token, "/cart"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes,
      ...(item.variantId !== undefined ? { variantId: item.variantId } : {}),
    }),
    cache: "no-store",
  });
  return handleResponse<Cart>(response);
}

/** DELETE /api/v1/web-catalog/:token/cart/:productId */
export async function removeFromCartByToken(
  token: string,
  productId: string,
): Promise<Cart> {
  const response = await fetch(buildTokenUrl(token, `/cart/${productId}`), {
    method: "DELETE",
    cache: "no-store",
  });
  return handleResponse<Cart>(response);
}

/**
 * PATCH /api/v1/web-catalog/:token/order
 * orderId va en el BODY, no en el path.
 */
export async function updateOrderByToken(
  token: string,
  orderId: string,
  data: { notes?: string },
): Promise<OrderResponse> {
  const response = await fetch(buildTokenUrl(token, "/order"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, notes: data.notes }),
    cache: "no-store",
  });
  return handleResponse<OrderResponse>(response);
}

/**
 * Busca la orden DRAFT (u otro estado) asociada a un sessionId anónimo.
 * Pega a /catalog/:businessSlug/order (PublicOrderService.getOrderBySessionId),
 * NO a /web-catalog/:businessSlug/order — esa ruta es token-only, siempre
 * 401ea con un slug real e ignora el sessionId.
 */
export async function getOrderStatus(
  businessSlug: string,
  options?: { sessionId: string },
): Promise<{
  hasOrder: boolean;
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    itemCount: number;
    notes?: string;
  };
}> {
  const url = new URL(buildPublicCatalogUrl(businessSlug, "/order"));
  if (options?.sessionId) url.searchParams.set("sessionId", options.sessionId);

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  return handleResponse(response);
}

// ═══════════════════════════════════════════════════════════
// PUBLIC CATALOG — Slug-based endpoints (/catalog/:slug/...)
// Usados cuando la URL lleva sede explícita: /{businessSlug}/{branchSlug}
// ═══════════════════════════════════════════════════════════

function buildPublicCatalogUrl(
  businessSlug: string,
  path: string = "",
): string {
  const cleanPath = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `${API_BASE_URL}/catalog/${businessSlug}${cleanPath}`;
}

export async function fetchCatalogByBranch(
  businessSlug: string,
  branchSlug: string,
  options?: { token?: string },
): Promise<CatalogResponse> {
  const baseUrl = `${API_BASE_URL}/catalog/${businessSlug}/branch/${branchSlug}`;
  const url = options?.token
    ? `${baseUrl}?token=${encodeURIComponent(options.token)}`
    : baseUrl;
  const response = await fetch(url, {
    next: {
      tags: [
        `catalog-${businessSlug}-${branchSlug}`,
        `catalog-${businessSlug}`,
        "catalog",
      ],
      revalidate: DEFAULT_REVALIDATE,
    },
    headers: { Accept: "application/json" },
  });
  return handleResponse<CatalogResponse>(response);
}

export async function getCartPublic(
  businessSlug: string,
  options: { sessionId: string; branchId?: string },
): Promise<Cart> {
  const url = new URL(buildPublicCatalogUrl(businessSlug, "/cart"));
  url.searchParams.set("sessionId", options.sessionId);
  if (options.branchId) url.searchParams.set("branch", options.branchId);

  const response = await fetch(url.toString(), {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  return handleResponse<Cart>(response);
}

export async function addToCartPublic(
  businessSlug: string,
  item: CartItem & { branchId?: string },
  options: { sessionId: string },
): Promise<Cart> {
  const response = await fetch(buildPublicCatalogUrl(businessSlug, "/cart"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: options.sessionId,
      item: {
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes,
        branchId: item.branchId,
        ...(item.variantId !== undefined ? { variantId: item.variantId } : {}),
      },
    }),
    cache: "no-store",
  });
  return handleResponse<Cart>(response);
}

export async function removeFromCartPublic(
  businessSlug: string,
  productId: string,
  options: { sessionId: string; branchId?: string },
  variantId?: string,
): Promise<Cart> {
  const response = await fetch(
    buildPublicCatalogUrl(businessSlug, "/cart/remove"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: options.sessionId,
        productId,
        branchId: options.branchId,
        ...(variantId !== undefined ? { variantId } : {}),
      }),
      cache: "no-store",
    },
  );
  return handleResponse<Cart>(response);
}

export async function updateCartItemPublic(
  businessSlug: string,
  productId: string,
  quantity: number,
  options: { sessionId: string; branchId?: string },
  notes?: string,
  variantId?: string,
): Promise<Cart> {
  const response = await fetch(
    buildPublicCatalogUrl(businessSlug, "/cart/update"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: options.sessionId,
        productId,
        quantity,
        branchId: options.branchId,
        ...(notes !== undefined ? { notes } : {}),
        ...(variantId !== undefined ? { variantId } : {}),
      }),
      cache: "no-store",
    },
  );
  return handleResponse<Cart>(response);
}

export async function createOrderPublic(
  businessSlug: string,
  data: {
    items: (CartItem & { branchId: string })[];
    notes?: string;
    sessionId: string;
    phoneNumber: string;
    fromWhatsApp?: boolean;
  },
): Promise<OrderResponse> {
  const sanitizedData = {
    ...data,
    items: data.items.map(({ variantLabel, variantAttributes, image, ...rest }) => rest),
  };
  const response = await fetch(buildPublicCatalogUrl(businessSlug, "/order"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sanitizedData),
    cache: "no-store",
  });
  return handleResponse<OrderResponse>(response);
}

// ═══════════════════════════════════════════════════════════
// STATIC GENERATION (Next.js)
// ═══════════════════════════════════════════════════════════

/**
 * Get all business slugs for static generation
 */
export async function generateStaticParams() {
  try {
    const response = await fetch(`${API_BASE_URL}/public/businesses`, {
      next: {
        tags: ["businesses"],
        revalidate: DEFAULT_REVALIDATE,
      },
    });

    if (!response.ok) return [];

    const businesses = await handleResponse<{ slug: string }[]>(response);
    return businesses.map((b) => ({
      businessSlug: b.slug,
    }));
  } catch {
    return [];
  }
}
