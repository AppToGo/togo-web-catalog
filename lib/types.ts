/**
 * Tipos del Web Catalog
 * Ultra ligero - solo interfaces esenciales
 * 
 * MIGRATION NOTE:
 * This file now re-exports from the new normalized catalog types.
 * Legacy types are kept for backward compatibility during migration.
 */

// Re-export all new catalog types with aliases for backward compatibility
export type {
  CatalogProduct,
  Category,
  SubCategory,
  BusinessInfo,
  BusinessInfo as Business, // Alias for backward compatibility
  CatalogResponse,
  CatalogResponse as Catalog, // Alias for backward compatibility
  CartItem,
  Cart,
  OrderResponse,
  CustomerOrigin,
  CustomerData,
  OrderStatusType,
  OpeningHours,
  StructuredDataProduct,
  StructuredDataBusiness,
  BusinessTheme,
  CatalogFilters,
  PaginationParams,
  PaginatedProducts,
  CatalogApiError,
  CatalogErrorCode,
} from '@/src/types/catalog.types';

// Import for extending
import type { 
  Cart, 
  CartItem, 
  CustomerOrigin, 
  CustomerData,
  CatalogProduct,
} from '@/src/types/catalog.types';

// ═══════════════════════════════════════════════════════════
// DOMAIN - LEGACY (Backward Compatibility)
// ═══════════════════════════════════════════════════════════

/**
 * @deprecated Use CatalogProduct from @/src/types/catalog.types
 * Kept for backward compatibility during migration
 */
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  sku: string;
  imageUrl?: string;
  categoryId: string;
  industryCategoryId: string;
  active: boolean;
}

// ═══════════════════════════════════════════════════════════
// DOMAIN - Carrito (Extended)
// ═══════════════════════════════════════════════════════════

export interface CartContextState {
  cart: Cart;
  itemCount: number;
  isLoading: boolean;
  isSyncing: boolean;
  isHydrated: boolean;
  customer: CustomerData;
}

export interface CartContextActions {
  addItem: (item: CartItem) => void;
  updateItem: (productId: string, delta: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  setCustomerPhone: (phone: string) => void;
  setCustomerName: (name: string) => void;
}

export type CartContextType = CartContextState & CartContextActions;

// ═══════════════════════════════════════════════════════════
// API - Request/Response (Extended)
// ═══════════════════════════════════════════════════════════

export interface ApiError {
  message: string;
  code?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// ═══════════════════════════════════════════════════════════
// UTILITY TYPES
// ═══════════════════════════════════════════════════════════

/**
 * Helper to convert CatalogProduct to legacy Product format
 * @deprecated Use CatalogProduct type directly. This helper will be removed in Phase 3 (Q1 2027).
 */
export function toLegacyProduct(product: CatalogProduct): Product {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    sku: product.sku,
    imageUrl: product.image,
    categoryId: product.categoryId || '',
    industryCategoryId: product.industryCategoryId || '',
    active: product.active,
  };
}

/**
 * Helper to convert legacy Product to CatalogProduct format
 * @deprecated Use CatalogProduct type directly. This helper will be removed in Phase 3 (Q1 2027).
 */
export function toCatalogProduct(product: Product): CatalogProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    sku: product.sku,
    image: product.imageUrl,
    categoryId: product.categoryId,
    industryCategoryId: product.industryCategoryId,
    isAvailable: product.active,
    active: product.active,
    stock: undefined,
    brand: undefined,
    isFromTemplate: false,
  };
}
