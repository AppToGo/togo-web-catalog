/**
 * API Client
 * Ultra ligero - solo fetch nativo
 */

import type { Catalog, Category, Cart, CartItem, OrderResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

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
// Server-side fetch (ISR cacheable)
// ═══════════════════════════════════════════════════════════

/**
 * Obtiene el catálogo con caché ISR.
 * El tag permite revalidación on-demand vía webhook.
 */
export async function getCatalog(token: string): Promise<Catalog> {
  const response = await fetch(buildUrl(token), {
    next: { 
      tags: [`catalog-${token}`],
      // Revalidar cada hora como fallback (si el webhook falla)
      revalidate: 3600,
    },
  });
  
  return handleResponse<Catalog>(response);
}

export async function getCategories(token: string): Promise<Category[]> {
  const response = await fetch(buildUrl(token, '/categories'), {
    next: { tags: [`categories-${token}`] },
  });
  return handleResponse<Category[]>(response);
}

// ═══════════════════════════════════════════════════════════
// Client-side operations (no cache)
// ═══════════════════════════════════════════════════════════

export async function addToCart(
  token: string,
  item: CartItem
): Promise<Cart> {
  const response = await fetch(buildUrl(token, '/cart'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
    cache: 'no-store',
  });
  return handleResponse<Cart>(response);
}

export async function getCart(token: string): Promise<Cart> {
  const response = await fetch(buildUrl(token, '/cart'), {
    cache: 'no-store',
  });
  return handleResponse<Cart>(response);
}

export async function removeFromCart(token: string, productId: string): Promise<Cart> {
  const response = await fetch(buildUrl(token, `/cart/${productId}`), {
    method: 'DELETE',
    cache: 'no-store',
  });
  return handleResponse<Cart>(response);
}

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

export async function getOrder(token: string): Promise<{ 
  hasOrder: boolean; 
  order?: { 
    id: string; 
    orderNumber: string; 
    status: string; 
    total: number; 
    itemCount: number;
    notes?: string;
  };
  orderStatus?: string;
}> {
  const response = await fetch(buildUrl(token, '/order'), {
    cache: 'no-store',
  });
  return handleResponse(response);
}
