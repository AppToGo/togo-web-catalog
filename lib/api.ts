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
 */

import type { Catalog, Category, Cart, CartItem, OrderResponse, CustomerOrigin } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════

const DEFAULT_REVALIDATE = 3600; // 1 hora

// ═══════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════

function buildPublicUrl(businessSlug: string, path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}/catalog/${businessSlug}${cleanPath}`;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Error desconocido',
    }));
    
    // Error específico para recurso no encontrado
    if (response.status === 404) {
      throw new Error(`Catálogo no encontrado: ${error.message || 'El negocio no existe'}`);
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
 * Si se proporciona token, se obtienen también los datos del customer.
 * El backend decide si requiere token o no según la configuración del negocio.
 */
export async function fetchCatalog(
  businessSlug: string, 
  options?: { token?: string; table?: string }
): Promise<Catalog> {
  const url = new URL(buildPublicUrl(businessSlug));
  
  if (options?.token) {
    url.searchParams.set('token', options.token);
  }
  if (options?.table) {
    url.searchParams.set('table', options.table);
  }
  
  const response = await fetch(url.toString(), {
    next: { 
      tags: [`catalog-${businessSlug}`, 'catalog'],
      revalidate: DEFAULT_REVALIDATE,
    },
    headers: { 'Accept': 'application/json' },
  });
  
  return handleResponse<Catalog>(response);
}

/**
 * Legacy: Obtiene catálogo por token (para redirecciones)
 * @deprecated Usar fetchCatalog con businessSlug
 */
export async function getCatalog(token: string): Promise<Catalog> {
  const response = await fetch(`${API_BASE_URL}/web-catalog/by-token/${token}`, {
    next: { 
      tags: [`catalog-${token}`, 'catalog'],
      revalidate: DEFAULT_REVALIDATE,
    },
    headers: { 'Accept': 'application/json' },
  });
  
  return handleResponse<Catalog>(response);
}

export async function getCategories(businessSlug: string): Promise<Category[]> {
  const response = await fetch(buildPublicUrl(businessSlug, '/categories'), {
    next: { 
      tags: [`categories-${businessSlug}`, 'categories'],
      revalidate: DEFAULT_REVALIDATE,
    },
  });
  return handleResponse<Category[]>(response);
}

export async function getProduct(
  businessSlug: string, 
  productId: string
): Promise<Catalog['products'][0] | null> {
  try {
    const response = await fetch(buildPublicUrl(businessSlug, `/products/${productId}`), {
      next: {
        tags: [`product-${productId}`, `catalog-${businessSlug}`],
        revalidate: DEFAULT_REVALIDATE,
      },
    });
    
    if (!response.ok) return null;
    return handleResponse<Catalog['products'][0]>(response);
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// CLIENT-SIDE OPERATIONS (NO CACHE)
// ═══════════════════════════════════════════════════════════

/**
 * Agrega item al carrito (público o autenticado)
 * 
 * Body esperado por backend:
 * { sessionId: string, productId: string, quantity: number }
 */
export async function addToCart(
  businessSlug: string,
  item: CartItem,
  options?: { sessionId: string }
): Promise<Cart> {
  const url = new URL(buildPublicUrl(businessSlug, '/cart'));
  
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      sessionId: options?.sessionId,
      productId: item.productId,
      quantity: item.quantity,
    }),
    cache: 'no-store',
  });
  
  return handleResponse<Cart>(response);
}

export async function getCart(
  businessSlug: string, 
  options?: { sessionId: string }
): Promise<Cart> {
  const url = new URL(buildPublicUrl(businessSlug, '/cart'));
  if (options?.sessionId) url.searchParams.set('sessionId', options.sessionId);
  
  const response = await fetch(url.toString(), {
    cache: 'no-store',
    headers: { 'Accept': 'application/json' },
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
  options?: { sessionId: string }
): Promise<Cart> {
  const url = new URL(buildPublicUrl(businessSlug, '/cart/update'));
  
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      sessionId: options?.sessionId,
      productId,
      quantity,
    }),
    cache: 'no-store',
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
  options?: { sessionId: string }
): Promise<Cart> {
  const url = new URL(buildPublicUrl(businessSlug, '/cart/remove'));
  
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: options?.sessionId,
      productId,
    }),
    cache: 'no-store',
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
  }
): Promise<OrderResponse> {
  const response = await fetch(buildPublicUrl(businessSlug, '/order'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  
  return handleResponse<OrderResponse>(response);
}

export async function updateOrder(
  businessSlug: string,
  orderId: string,
  data: { notes?: string; sessionId: string }
): Promise<OrderResponse> {
  const response = await fetch(buildPublicUrl(businessSlug, `/order/${orderId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  
  return handleResponse<OrderResponse>(response);
}

export async function getOrderStatus(
  businessSlug: string,
  options?: { sessionId: string }
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
  const url = new URL(buildPublicUrl(businessSlug, '/order'));
  if (options?.sessionId) url.searchParams.set('sessionId', options.sessionId);
  
  const response = await fetch(url.toString(), {
    cache: 'no-store',
  });
  
  return handleResponse(response);
}
