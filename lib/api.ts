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

const DEFAULT_REVALIDATE = 3600; // 1 hora

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

    // Error específico para recurso no encontrado
    if (response.status === 404) {
      throw new Error(
        `Catálogo no encontrado: ${error.message || "El negocio no existe"}`,
      );
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
 * { sessionId: string, productId: string, quantity: number }
 */
export async function updateCartItem(
  businessSlug: string,
  productId: string,
  quantity: number,
  options?: { sessionId: string },
  notes?: string,
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
    }),
    cache: "no-store",
  });

  return handleResponse<Cart>(response);
}

/**
 * Elimina item del carrito
 *
 * Body esperado por backend:
 * { sessionId: string, productId: string }
 */
export async function removeFromCart(
  businessSlug: string,
  productId: string,
  options?: { sessionId: string },
): Promise<Cart> {
  const url = new URL(buildWebCatalogUrl(businessSlug, "/cart/remove"));

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: options?.sessionId,
      productId,
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
  },
): Promise<OrderResponse> {
  const response = await fetch(buildWebCatalogUrl(businessSlug, "/order"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    cache: "no-store",
  });

  return handleResponse<OrderResponse>(response);
}

export async function updateOrder(
  businessSlug: string,
  orderId: string,
  data: { notes?: string; sessionId: string },
): Promise<OrderResponse> {
  const response = await fetch(
    buildWebCatalogUrl(businessSlug, `/order/${orderId}`),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
    },
  );

  return handleResponse<OrderResponse>(response);
}

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
  const url = new URL(buildWebCatalogUrl(businessSlug, "/order"));
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
): Promise<CatalogResponse> {
  const url = `${API_BASE_URL}/catalog/${businessSlug}/branch/${branchSlug}`;
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
      }),
      cache: "no-store",
    },
  );
  return handleResponse<Cart>(response);
}

export async function createOrderPublic(
  businessSlug: string,
  data: {
    items: CartItem[];
    branchId: string;
    notes?: string;
    source: CustomerOrigin;
    sessionId: string;
    customerPhone?: string;
    customerName?: string;
  },
): Promise<OrderResponse> {
  const response = await fetch(buildPublicCatalogUrl(businessSlug, "/order"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
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
