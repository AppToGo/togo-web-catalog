/**
 * Cart Server Actions
 * 
 * Server Actions para operaciones del carrito con rate limiting.
 * Usa sessionId para identificar el carrito del usuario.
 * 
 * Updated for normalized catalog:
 * - Uses BusinessProduct IDs for cart operations
 * - Endpoints at /api/v1/web-catalog/:businessSlug/cart/*
 */

'use server';

import { revalidateTag } from 'next/cache';
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItem,
  createOrder,
  updateOrder,
  getOrderStatus,
  addToCartPublic,
  getCartPublic,
  removeFromCartPublic,
  updateCartItemPublic,
  createOrderPublic,
} from './api';
import type { Cart, CartItem, CustomerOrigin } from '@/src/types/catalog.types';
import { checkRateLimit, getCartRateLimitKey, RATE_LIMITS } from './rate-limit';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface CartActionResult {
  success: boolean;
  cart?: Cart;
  error?: string;
}

interface OrderActionResult {
  success: boolean;
  order?: {
    orderId: string;
    orderNumber: string;
    status: string;
    total: number;
    waMeUrl?: string;
  };
  error?: string;
}

// ═══════════════════════════════════════════════════════════
// ADD ITEM
// ═══════════════════════════════════════════════════════════

export async function addToCartAction(
  businessSlug: string,
  item: CartItem,
  options: { sessionId: string }
): Promise<CartActionResult> {
  try {
    const rateKey = await getCartRateLimitKey(businessSlug, 'add');
    if (!checkRateLimit(rateKey, RATE_LIMITS.addItem)) {
      return { success: false, error: 'Demasiadas solicitudes. Intenta más tarde.' };
    }

    if (!businessSlug || !item.productId) {
      return { success: false, error: 'Datos inválidos' };
    }

    // Note: productId should be the BusinessProduct ID from normalized catalog
    const cart = await addToCart(businessSlug, item, options);
    
    // @ts-ignore - Next.js 16 types requieren 2 args pero runtime funciona con 1
    revalidateTag(`catalog-${businessSlug}`, {});
    
    return { success: true, cart };
  } catch (error) {
    console.error('Error en addToCartAction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al agregar item' 
    };
  }
}

// ═══════════════════════════════════════════════════════════
// UPDATE ITEM
// ═══════════════════════════════════════════════════════════

export async function updateCartItemAction(
  businessSlug: string,
  productId: string,
  quantity: number,
  options: { sessionId: string },
  notes?: string,
): Promise<CartActionResult> {
  try {
    const rateKey = await getCartRateLimitKey(businessSlug, 'update');
    if (!checkRateLimit(rateKey, RATE_LIMITS.updateItem)) {
      return { success: false, error: 'Demasiadas solicitudes. Intenta más tarde.' };
    }

    if (!businessSlug || !productId) {
      return { success: false, error: 'Datos inválidos' };
    }

    const cart = await updateCartItem(businessSlug, productId, quantity, options, notes);

    // @ts-ignore - Next.js 16 types requieren 2 args pero runtime funciona con 1
    revalidateTag(`catalog-${businessSlug}`, {});

    return { success: true, cart };
  } catch (error) {
    console.error('Error en updateCartItemAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar item',
    };
  }
}

// ═══════════════════════════════════════════════════════════
// REMOVE ITEM
// ═══════════════════════════════════════════════════════════

export async function removeFromCartAction(
  businessSlug: string,
  productId: string,
  options: { sessionId: string }
): Promise<CartActionResult> {
  try {
    const rateKey = await getCartRateLimitKey(businessSlug, 'remove');
    if (!checkRateLimit(rateKey, RATE_LIMITS.removeItem)) {
      return { success: false, error: 'Demasiadas solicitudes. Intenta más tarde.' };
    }

    if (!businessSlug || !productId) {
      return { success: false, error: 'Datos inválidos' };
    }

    const cart = await removeFromCart(businessSlug, productId, options);
    
    // @ts-ignore - Next.js 16 types requieren 2 args pero runtime funciona con 1
    revalidateTag(`catalog-${businessSlug}`, {});
    
    return { success: true, cart };
  } catch (error) {
    console.error('Error en removeFromCartAction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al eliminar item' 
    };
  }
}

// ═══════════════════════════════════════════════════════════
// CLEAR CART
// ═══════════════════════════════════════════════════════════

export async function clearCartAction(
  businessSlug: string,
  options: { sessionId: string }
): Promise<CartActionResult> {
  try {
    const rateKey = await getCartRateLimitKey(businessSlug, 'clear');
    if (!checkRateLimit(rateKey, RATE_LIMITS.clearCart)) {
      return { success: false, error: 'Demasiadas solicitudes. Intenta más tarde.' };
    }

    if (!businessSlug) {
      return { success: false, error: 'Slug requerido' };
    }

    // TODO: The backend does not expose a /cart/clear endpoint yet.
    // The Redis cart expires automatically after 30 minutes (CartSessionService TTL).
    // After order creation the user is redirected to WhatsApp, so the stale cart
    // is unlikely to be re-synced. Track backend endpoint addition in a follow-up ticket.

    // @ts-ignore - Next.js 16 types requieren 2 args pero runtime funciona con 1
    revalidateTag(`catalog-${businessSlug}`, {});

    return { success: true };
  } catch (error) {
    console.error('Error en clearCartAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al limpiar carrito'
    };
  }
}

// ═══════════════════════════════════════════════════════════
// GET CART
// ═══════════════════════════════════════════════════════════

export async function getCartAction(
  businessSlug: string,
  options: { sessionId: string }
): Promise<Cart> {
  try {
    return await getCart(businessSlug, options);
  } catch (error) {
    console.error('Error en getCartAction:', error);
    return { items: [], updatedAt: new Date().toISOString() };
  }
}

// ═══════════════════════════════════════════════════════════
// ORDER ACTIONS
// ═══════════════════════════════════════════════════════════

export async function createOrderAction(
  businessSlug: string,
  data: {
    items: CartItem[];
    notes?: string;
    source: CustomerOrigin;
    sessionId: string;
    customerPhone?: string;
    customerName?: string;
  }
): Promise<OrderActionResult> {
  try {
    const rateKey = await getCartRateLimitKey(businessSlug, 'create-order');
    if (!checkRateLimit(rateKey, RATE_LIMITS.createOrder)) {
      return { success: false, error: 'Demasiadas solicitudes. Intenta más tarde.' };
    }

    if (!businessSlug) {
      return { success: false, error: 'Slug requerido' };
    }

    const result = await createOrder(businessSlug, data);
    
    // @ts-ignore - Next.js 16 types requieren 2 args pero runtime funciona con 1
    revalidateTag(`catalog-${businessSlug}`, {});
    
    return { 
      success: true, 
      order: {
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        status: result.status,
        total: result.total,
        waMeUrl: result.waMeUrl,
      }
    };
  } catch (error) {
    console.error('Error en createOrderAction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al crear orden' 
    };
  }
}

export async function updateOrderAction(
  businessSlug: string,
  orderId: string,
  data: { notes?: string; sessionId: string }
): Promise<OrderActionResult> {
  try {
    const rateKey = await getCartRateLimitKey(businessSlug, 'update-order');
    if (!checkRateLimit(rateKey, RATE_LIMITS.updateOrder)) {
      return { success: false, error: 'Demasiadas solicitudes. Intenta más tarde.' };
    }

    if (!businessSlug || !orderId) {
      return { success: false, error: 'Datos incompletos' };
    }

    const result = await updateOrder(businessSlug, orderId, data);
    
    // @ts-ignore - Next.js 16 types requieren 2 args pero runtime funciona con 1
    revalidateTag(`catalog-${businessSlug}`, {});
    
    return { 
      success: true, 
      order: {
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        status: result.status,
        total: result.total,
      }
    };
  } catch (error) {
    console.error('Error en updateOrderAction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al actualizar orden' 
    };
  }
}

export async function checkOrderAction(
  businessSlug: string,
  options: { sessionId: string }
) {
  try {
    const rateKey = await getCartRateLimitKey(businessSlug, 'check-order');
    if (!checkRateLimit(rateKey, RATE_LIMITS.checkOrder)) {
      return { hasOrder: false };
    }

    return await getOrderStatus(businessSlug, options);
  } catch (error) {
    console.error('Error en checkOrderAction:', error);
    return { hasOrder: false };
  }
}

// ═══════════════════════════════════════════════════════════
// PUBLIC CATALOG ACTIONS — Sede explícita en URL
// ═══════════════════════════════════════════════════════════

export async function getCartPublicAction(
  businessSlug: string,
  options: { sessionId: string; branchId?: string },
): Promise<Cart> {
  try {
    return await getCartPublic(businessSlug, options);
  } catch {
    return { items: [], updatedAt: new Date().toISOString() };
  }
}

export async function addToCartPublicAction(
  businessSlug: string,
  item: CartItem & { branchId?: string },
  options: { sessionId: string },
): Promise<CartActionResult> {
  try {
    const rateKey = await getCartRateLimitKey(businessSlug, 'add');
    if (!checkRateLimit(rateKey, RATE_LIMITS.addItem)) {
      return { success: false, error: 'Demasiadas solicitudes. Intenta más tarde.' };
    }
    if (!businessSlug || !item.productId) {
      return { success: false, error: 'Datos inválidos' };
    }
    const cart = await addToCartPublic(businessSlug, item, options);
    // @ts-ignore
    revalidateTag(`catalog-${businessSlug}`, {});
    return { success: true, cart };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al agregar item' };
  }
}

export async function removeFromCartPublicAction(
  businessSlug: string,
  productId: string,
  options: { sessionId: string; branchId?: string },
): Promise<CartActionResult> {
  try {
    const rateKey = await getCartRateLimitKey(businessSlug, 'remove');
    if (!checkRateLimit(rateKey, RATE_LIMITS.removeItem)) {
      return { success: false, error: 'Demasiadas solicitudes. Intenta más tarde.' };
    }
    const cart = await removeFromCartPublic(businessSlug, productId, options);
    // @ts-ignore
    revalidateTag(`catalog-${businessSlug}`, {});
    return { success: true, cart };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al eliminar item' };
  }
}

export async function updateCartItemPublicAction(
  businessSlug: string,
  productId: string,
  quantity: number,
  options: { sessionId: string; branchId?: string },
  notes?: string,
): Promise<CartActionResult> {
  try {
    const rateKey = await getCartRateLimitKey(businessSlug, 'update');
    if (!checkRateLimit(rateKey, RATE_LIMITS.updateItem)) {
      return { success: false, error: 'Demasiadas solicitudes. Intenta más tarde.' };
    }
    const cart = await updateCartItemPublic(businessSlug, productId, quantity, options, notes);
    // @ts-ignore
    revalidateTag(`catalog-${businessSlug}`, {});
    return { success: true, cart };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al actualizar item' };
  }
}

export async function createOrderPublicAction(
  businessSlug: string,
  data: {
    items: (CartItem & { branchId: string })[];
    notes?: string;
    sessionId: string;
    phoneNumber: string;
  },
): Promise<OrderActionResult> {
  try {
    const rateKey = await getCartRateLimitKey(businessSlug, 'create-order');
    if (!checkRateLimit(rateKey, RATE_LIMITS.createOrder)) {
      return { success: false, error: 'Demasiadas solicitudes. Intenta más tarde.' };
    }
    const result = await createOrderPublic(businessSlug, data);
    // @ts-ignore
    revalidateTag(`catalog-${businessSlug}`, {});
    return {
      success: true,
      order: {
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        status: result.status,
        total: result.total,
        waMeUrl: result.waMeUrl,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al crear orden' };
  }
}
