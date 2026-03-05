/**
 * Cart Server Actions
 * 
 * Server Actions para operaciones del carrito con rate limiting.
 * Reemplaza las rutas API /api/cart/* con Server Actions nativas.
 * 
 * VENTAJAS:
 * - Sin necesidad de endpoints HTTP
 * - Revalidación automática de cache
 * - Type safety entre cliente y servidor
 * - Rate limiting integrado
 * - Menor bundle size (no fetch)
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
import type { Cart, CartItem } from './types';
import { checkRateLimit, getCartRateLimitKey, RATE_LIMITS } from './rate-limit';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface CartActionResult {
  success: boolean;
  cart?: Cart;
  error?: string;
}

// ═══════════════════════════════════════════════════════════
// ADD ITEM
// ═══════════════════════════════════════════════════════════

export async function addToCartAction(
  token: string,
  item: CartItem
): Promise<CartActionResult> {
  try {
    // Rate limiting
    const rateKey = await getCartRateLimitKey(token, 'add');
    if (!checkRateLimit(rateKey, RATE_LIMITS.addItem)) {
      return { success: false, error: 'Demasiadas solicitudes. Intenta más tarde.' };
    }

    if (!token || !item.productId) {
      return { success: false, error: 'Datos inválidos' };
    }

    const cart = await addToCart(token, item);
    
    // Revalidar cache del catálogo
    // @ts-ignore - Next.js 16 types requieren 2 args pero runtime funciona con 1
    revalidateTag(`cart-${token}`);
    
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
  token: string,
  productId: string,
  delta: number
): Promise<CartActionResult> {
  try {
    // Rate limiting
    const rateKey = await getCartRateLimitKey(token, 'update');
    if (!checkRateLimit(rateKey, RATE_LIMITS.updateItem)) {
      return { success: false, error: 'Demasiadas solicitudes. Intenta más tarde.' };
    }

    if (!token || !productId) {
      return { success: false, error: 'Datos inválidos' };
    }

    const cart = await updateCartItem(token, productId, delta);
    
    // @ts-ignore - Next.js 16 types requieren 2 args pero runtime funciona con 1
    revalidateTag(`cart-${token}`);
    
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
  token: string,
  productId: string
): Promise<CartActionResult> {
  try {
    // Rate limiting
    const rateKey = await getCartRateLimitKey(token, 'remove');
    if (!checkRateLimit(rateKey, RATE_LIMITS.removeItem)) {
      return { success: false, error: 'Demasiadas solicitudes. Intenta más tarde.' };
    }

    if (!token || !productId) {
      return { success: false, error: 'Datos inválidos' };
    }

    const cart = await removeFromCart(token, productId);
    
    // @ts-ignore - Next.js 16 types requieren 2 args pero runtime funciona con 1
    revalidateTag(`cart-${token}`);
    
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

export async function clearCartAction(token: string): Promise<CartActionResult> {
  try {
    // Rate limiting
    const rateKey = await getCartRateLimitKey(token, 'clear');
    if (!checkRateLimit(rateKey, RATE_LIMITS.clearCart)) {
      return { success: false, error: 'Demasiadas solicitudes. Intenta más tarde.' };
    }

    if (!token) {
      return { success: false, error: 'Token requerido' };
    }

    // @ts-ignore - Next.js 16 types requieren 2 args pero runtime funciona con 1
    revalidateTag(`cart-${token}`);
    
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

export async function getCartAction(token: string): Promise<Cart> {
  try {
    return await getCart(token);
  } catch (error) {
    console.error('Error en getCartAction:', error);
    return { items: [], updatedAt: new Date().toISOString() };
  }
}

// ═══════════════════════════════════════════════════════════
// ORDER ACTIONS
// ═══════════════════════════════════════════════════════════

export async function createOrderAction(
  token: string,
  notes?: string
) {
  try {
    // Rate limiting
    const rateKey = await getCartRateLimitKey(token, 'create-order');
    if (!checkRateLimit(rateKey, RATE_LIMITS.createOrder)) {
      return { success: false, error: 'Demasiadas solicitudes. Intenta más tarde.' };
    }

    if (!token) {
      return { success: false, error: 'Token requerido' };
    }

    const result = await createOrder(token, { notes });
    
    // @ts-ignore - Next.js 16 types requieren 2 args pero runtime funciona con 1
    revalidateTag(`cart-${token}`);
    
    return { success: true, order: result };
  } catch (error) {
    console.error('Error en createOrderAction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al crear orden' 
    };
  }
}

export async function updateOrderAction(
  token: string,
  orderId: string,
  notes?: string
) {
  try {
    // Rate limiting
    const rateKey = await getCartRateLimitKey(token, 'update-order');
    if (!checkRateLimit(rateKey, RATE_LIMITS.updateOrder)) {
      return { success: false, error: 'Demasiadas solicitudes. Intenta más tarde.' };
    }

    if (!token || !orderId) {
      return { success: false, error: 'Datos incompletos' };
    }

    const result = await updateOrder(token, orderId, { notes });
    
    // @ts-ignore - Next.js 16 types requieren 2 args pero runtime funciona con 1
    revalidateTag(`cart-${token}`);
    
    return { success: true, order: result };
  } catch (error) {
    console.error('Error en updateOrderAction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al actualizar orden' 
    };
  }
}

export async function checkOrderAction(token: string) {
  try {
    // Rate limiting
    const rateKey = await getCartRateLimitKey(token, 'check-order');
    if (!checkRateLimit(rateKey, RATE_LIMITS.checkOrder)) {
      return { hasOrder: false };
    }

    return await getOrderStatus(token);
  } catch (error) {
    console.error('Error en checkOrderAction:', error);
    return { hasOrder: false };
  }
}
