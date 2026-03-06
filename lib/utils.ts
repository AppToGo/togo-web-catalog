/**
 * Utilidades del Catálogo
 * 
 * Funciones puras que pueden ejecutarse en server y client.
 */

// ═══════════════════════════════════════════════════════════
// FORMATO
// ═══════════════════════════════════════════════════════════

/**
 * Formatea un precio en pesos colombianos
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-CO').format(num);
}

// ═══════════════════════════════════════════════════════════
// VALIDACIÓN
// ═══════════════════════════════════════════════════════════

/**
 * Valida si un string es un token válido
 */
export function isValidToken(token: string): boolean {
  return token.length >= 10 && /^[a-zA-Z0-9-_]+$/.test(token);
}

/**
 * Valida si un string es un slug de negocio válido
 * Solo letras minúsculas, números y guiones
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 2 && slug.length <= 50;
}

/**
 * Sanitiza un string de búsqueda
 */
export function sanitizeSearchQuery(query: string): string {
  return query.trim().slice(0, 100).toLowerCase();
}

// ═══════════════════════════════════════════════════════════
// URLS
// ═══════════════════════════════════════════════════════════

/**
 * Construye URL de catálogo
 */
export function buildCatalogUrl(token: string, params?: Record<string, string>): string {
  const url = new URL(`/catalog/${token}`, process.env.NEXT_PUBLIC_APP_URL);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }
  
  return url.toString();
}

// ═══════════════════════════════════════════════════════════
// COLORES
// ═══════════════════════════════════════════════════════════

/**
 * Determina si un color es oscuro (para elegir texto blanco o negro)
 */
export function isDarkColor(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
}

/**
 * Aclara un color hexadecimal
 */
export function lightenColor(hexColor: string, percent: number): string {
  const hex = hexColor.replace('#', '');
  const num = parseInt(hex, 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  )
    .toString(16)
    .slice(1);
}

// ═══════════════════════════════════════════════════════════
// ARRAYS
// ═══════════════════════════════════════════════════════════

/**
 * Agrupa un array por una key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    result[groupKey] = result[groupKey] || [];
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Ordena productos por múltiples criterios
 */
export function sortProducts<T extends { name: string; price: number }>(
  products: T[],
  sortBy: 'name' | 'price' | 'price-desc' = 'name'
): T[] {
  const sorted = [...products];
  
  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'price':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
    default:
      return sorted;
  }
}

// ═══════════════════════════════════════════════════════════
// DEBOUNCE / THROTTLE
// ═══════════════════════════════════════════════════════════

/**
 * Debounce simple para búsquedas
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle para eventos de scroll/resize
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
