/**
 * Rate Limiting para Server Actions
 * 
 * Protege contra ataques de fuerza bruta y spam.
 * Usa LRU cache en memoria (para múltiples instancias usar Redis).
 */

import { LRUCache } from 'lru-cache';
import { headers } from 'next/headers';

// Cache de rate limiting: max 500 entradas, TTL 1 minuto
const rateLimitCache = new LRUCache<string, number>({
  max: 500,
  ttl: 1000 * 60, // 1 minuto
});

/**
 * Verifica si el cliente ha excedido el límite de requests
 * @param key - Identificador único (ej: 'cart-{ip}')
 * @param maxRequests - Máximo de requests permitidos (default: 10)
 * @returns true si está permitido, false si excedió el límite
 */
export function checkRateLimit(key: string, maxRequests: number = 10): boolean {
  const current = rateLimitCache.get(key) || 0;
  if (current >= maxRequests) return false;
  rateLimitCache.set(key, current + 1);
  return true;
}

/**
 * Obtiene el client IP desde los headers
 * Considera x-forwarded-for para proxies/CDN
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for');
  if (forwarded) {
    // Tomar el primer IP si hay múltiples (chain de proxies)
    return forwarded.split(',')[0].trim();
  }
  return headersList.get('x-real-ip') || 'anonymous';
}

/**
 * Genera una clave de rate limit para acciones de carrito
 */
export async function getCartRateLimitKey(businessSlug: string, action: string): Promise<string> {
  const ip = await getClientIP();
  return `cart:${action}:${ip}:${businessSlug}`;
}

/**
 * Rate limits por tipo de acción
 */
export const RATE_LIMITS = {
  addItem: 30,      // 30 items por minuto
  updateItem: 30,   // 30 updates por minuto
  removeItem: 20,   // 20 removes por minuto
  clearCart: 5,     // 5 clears por minuto
  createOrder: 5,   // 5 órdenes por minuto
  updateOrder: 5,   // 5 updates por minuto
  checkOrder: 20,   // 20 checks por minuto
} as const;
