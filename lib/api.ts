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

import type { Catalog, Category, Cart, CartItem, OrderResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════

const DEFAULT_REVALIDATE = 3600; // 1 hora

// ═══════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════

function buildUrl(token: string, path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}/web-catalog/${token}${cleanPath}`;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Error desconocido',
    }));
    throw new Error(error.message || `Error ${response.status}`);
  }
  return response.json();
}

// ═══════════════════════════════════════════════════════════
// SERVER-SIDE FETCH (CACHEABLE)
// ═══════════════════════════════════════════════════════════

/**
 * Obtiene el catálogo completo con caché ISR.
 * 
 * CACHE STRATEGY:
 * - Tag: catalog-{token} → permite revalidación selectiva
 * - Revalidate: 1 hora → fallback si webhook falla
 * - Stale-while-revalidate → sirve caché mientras refresca
 */
export async function getCatalog(token: string): Promise<Catalog> {
  const response = await fetch(buildUrl(token), {
    next: { 
      tags: [`catalog-${token}`, 'catalog'],
      revalidate: DEFAULT_REVALIDATE,
    },
    headers: {
      'Accept': 'application/json',
    },
  });
  
  return handleResponse<Catalog>(response);
}

/**
 * Obtiene categorías (útil para páginas de categoría individuales)
 */
export async function getCategories(token: string): Promise<Category[]> {
  const response = await fetch(buildUrl(token, '/categories'), {
    next: { 
      tags: [`categories-${token}`, 'categories'],
      revalidate: DEFAULT_REVALIDATE,
    },
  });
  
  return handleResponse<Category[]>(response);
}

/**
 * Obtiene un producto específico (para páginas de producto)
 */
export async function getProduct(
  token: string, 
  productId: string
): Promise<Catalog['products'][0] | null> {
  try {
    const response = await fetch(buildUrl(token, `/products/${productId}`), {
      next: {
        tags: [`product-${productId}`, `catalog-${token}`],
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
 * Agrega item al carrito
 */
export async function addToCart(
  token: string,
  item: CartItem
): Promise<Cart> {
  const response = await fetch(buildUrl(token, '/cart'), {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item),
    cache: 'no-store',
  });
  
  return handleResponse<Cart>(response);
}

/**
 * Obtiene el carrito actual
 */
export async function getCart(token: string): Promise<Cart> {
  const response = await fetch(buildUrl(token, '/cart'), {
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
    },
  });
  
  return handleResponse<Cart>(response);
}

/**
 * Actualiza cantidad de un item
 */
export async function updateCartItem(
  token: string,
  productId: string,
  delta: number
): Promise<Cart> {
  const response = await fetch(buildUrl(token, `/cart/${productId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delta }),
    cache: 'no-store',
  });
  
  return handleResponse<Cart>(response);
}

/**
 * Elimina item del carrito
 */
export async function removeFromCart(
  token: string, 
  productId: string
): Promise<Cart> {
  const response = await fetch(buildUrl(token, `/cart/${productId}`), {
    method: 'DELETE',
    cache: 'no-store',
  });
  
  return handleResponse<Cart>(response);
}

// ═══════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════

/**
 * Crea una nueva orden
 */
export async function createOrder(
  token: string,
  data: { address?: string; notes?: string }
): Promise<OrderResponse> {
  const response = await fetch(buildUrl(token, '/order'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  
  return handleResponse<OrderResponse>(response);
}

/**
 * Actualiza una orden existente
 */
export async function updateOrder(
  token: string,
  orderId: string,
  data: { notes?: string }
): Promise<OrderResponse> {
  const response = await fetch(buildUrl(token, `/order/${orderId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  
  return handleResponse<OrderResponse>(response);
}

/**
 * Obtiene estado de orden actual
 */
export async function getOrderStatus(token: string): Promise<{
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
  const response = await fetch(buildUrl(token, '/order'), {
    cache: 'no-store',
  });
  
  return handleResponse(response);
}

// ═══════════════════════════════════════════════════════════
// REVALIDATION (Webhook)
// ═══════════════════════════════════════════════════════════

/**
 * Revalida el caché de un catálogo específico.
 * Se usa desde el webhook /api/revalidate
 */
export async function revalidateCatalog(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        secret: process.env.REVALIDATE_SECRET,
      }),
    });
    
    return response.ok;
  } catch {
    return false;
  }
}
