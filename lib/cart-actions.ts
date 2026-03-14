/**
 * Cart Server Actions
 * 
 * Server Actions para operaciones del carrito con rate limiting.
 * Usa sessionId para identificar el carrito del usuario.
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
  getOrderStatus 
} from './api';
import type { Cart, CartItem, CustomerOrigin } from './types';
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
  options: { sessionId: string }
): Promise<CartActionResult> {
  try {
    const rateKey = await getCartRateLimitKey(businessSlug, 'update');
    if (!checkRateLimit(rateKey, RATE_LIMITS.updateItem)) {
      return { success: false, error: 'Demasiadas solicitudes. Intenta más tarde.' };
    }

    if (!businessSlug || !productId) {
      return { success: false, error: 'Datos inválidos' };
    }

    const cart = await updateCartItem(businessSlug, productId, quantity, options);
    
    // @ts-ignore - Next.js 16 types requieren 2 args pero runtime funciona con 1
    revalidateTag(`catalog-${businessSlug}`, {});
    
    return { success: true, cart };
  } catch (error) {
    console.error('Error en updateCartItemAction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al actualizar item' 
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
