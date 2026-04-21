/**
 * Catalog Types - Normalized Product Catalog
 * 
 * Types for the new BusinessProduct + GlobalProduct structure.
 * These types replace the legacy Product types in lib/types.ts
 */

// ═══════════════════════════════════════════════════════════
// DOMAIN - Product (Normalized Catalog)
// ═══════════════════════════════════════════════════════════

/**
 * CatalogProduct - Product displayed in the public catalog
 * Combines BusinessProduct + GlobalProduct data
 */
export interface CatalogProduct {
  /** BusinessProduct ID (unique per business) */
  id: string;
  
  /** Product name (from GlobalProduct or BusinessProduct override) */
  name: string;
  
  /** Product price (BusinessProduct override or GlobalProduct base) */
  price: number;
  
  /** Product image URL */
  image?: string;
  
  /** Product description */
  description?: string;
  
  /** Brand name (from GlobalProduct) */
  brand?: string;
  
  /** Category ID (SubCategory ID) */
  categoryId?: string;
  
  /** Parent category ID (IndustryCategory ID) */
  industryCategoryId?: string;
  
  /** Category information */
  category?: Category;
  
  /** Current stock level */
  stock?: number;
  
  /** Whether product is available for purchase */
  isAvailable: boolean;
  
  /** Whether product is active */
  active: boolean;
  
  /** SKU for inventory */
  sku: string;
  
  /** Indicates if product data comes from template (optional UI badge) */
  isFromTemplate?: boolean;
  
  /** GlobalProduct ID reference */
  globalProductId?: string;
}

// ═══════════════════════════════════════════════════════════
// DOMAIN - Category
// ═══════════════════════════════════════════════════════════

/**
 * Category for catalog display
 * Maps to IndustryCategory at business level
 */
export interface Category {
  /** Category ID */
  id: string;
  
  /** Category name */
  name: string;
  
  /** URL-friendly slug */
  slug: string;
  
  /** Display order */
  order: number;
  
  /** Optional description */
  description?: string;
  
  /** Optional icon */
  icon?: string;
  
  /** Optional color */
  color?: string;
  
  /** Number of products in this category */
  productCount?: number;
}

/**
 * SubCategory - Child category
 * Maps to SubCategory entity
 */
export interface SubCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  industryCategoryId: string;
}

// ═══════════════════════════════════════════════════════════
// DOMAIN - Business Info
// ═══════════════════════════════════════════════════════════

/**
 * Business information for public catalog
 */
export interface BusinessInfo {
  /** Business ID */
  id: string;
  
  /** Business display name */
  name: string;
  
  /** URL-friendly slug */
  slug: string;
  
  /** Business logo URL */
  logo?: string;
  
  /** Business banner image URL */
  banner?: string;
  
  /** Business description */
  description?: string;
  
  /** Primary brand color */
  primaryColor: string;
  
  /** Accent color for CTAs */
  accentColor: string;
  
  /** Industry type */
  industry: string;
  
  /** Contact phone */
  phone?: string;
  
  /** Opening hours */
  openingHours?: OpeningHours;
  
  /** Business address */
  address?: string;
  
  /** Whether business is currently open */
  isOpen?: boolean;
}

/**
 * Opening hours structure
 */
export interface OpeningHours {
  /** Day of week (0 = Sunday, 6 = Saturday) */
  [day: number]: {
    open: string;    // HH:mm format
    close: string;   // HH:mm format
    isClosed: boolean;
  };
}

// ═══════════════════════════════════════════════════════════
// API RESPONSES
// ═══════════════════════════════════════════════════════════

/**
 * Full catalog response from API
 */
export interface CatalogResponse {
  /** Business information */
  business: BusinessInfo;
  
  /** Categories for this business */
  categories: Category[];
  
  /** Sub-categories */
  subCategories?: SubCategory[];
  
  /** Products in catalog */
  products: CatalogProduct[];
  
  /** Optional: Customer data if authenticated */
  customerPhone?: string;
  
  /** Optional: Customer name if authenticated */
  customerName?: string;
  
  /** Optional: Table number for dine-in */
  tableNumber?: string;
  
  /** Whether customer is authenticated */
  isAuthenticated?: boolean;

  /** Branch ID when catalog is scoped to a specific sede */
  branchId?: string | null;
}

/**
 * Search response from API
 */
export interface SearchResponse {
  products: CatalogProduct[];
  total: number;
  query: string;
}

// ═══════════════════════════════════════════════════════════
// CART & ORDERS (Normalized Catalog)
// ═══════════════════════════════════════════════════════════

/**
 * Cart item with normalized product ID
 */
export interface CartItem {
  /** BusinessProduct ID (normalized) */
  productId: string;
  
  /** Product name for display */
  name: string;
  
  /** Quantity */
  quantity: number;
  
  /** Unit price */
  price: number;
  
  /** Optional notes */
  notes?: string;
  
  /** Optional product image */
  image?: string;
}

/**
 * Cart state
 */
export interface Cart {
  items: CartItem[];
  updatedAt: string;
}

/**
 * Order status types
 */
export type OrderStatusType = 
  | 'DRAFT'
  | 'CONFIRMED'
  | 'PAID'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

/**
 * Order response
 */
export interface OrderResponse {
  orderId: string;
  orderNumber: string;
  status: OrderStatusType;
  total: number;
  itemCount: number;
  message: string;
  businessPhone?: string;
  requiresWhatsAppConfirmation?: boolean;
  waMeUrl?: string;
}

// ═══════════════════════════════════════════════════════════
// CUSTOMER
// ═══════════════════════════════════════════════════════════

export type CustomerOrigin = 'whatsapp' | 'direct' | 'qr' | 'instagram' | 'facebook';

export interface CustomerData {
  origin: CustomerOrigin;
  phone?: string;
  name?: string;
  tableNumber?: string;
  isIdentified: boolean;
}

// ═══════════════════════════════════════════════════════════
// FILTERING & PAGINATION
// ═══════════════════════════════════════════════════════════

export interface CatalogFilters {
  categoryId?: string;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface PaginatedProducts {
  products: CatalogProduct[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// ═══════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════

export interface CatalogApiError {
  message: string;
  code?: string;
  status: number;
  details?: Record<string, string[]>;
}

export type CatalogErrorCode = 
  | 'BUSINESS_NOT_FOUND'
  | 'PRODUCT_NOT_FOUND'
  | 'CATEGORY_NOT_FOUND'
  | 'INVALID_PARAMS'
  | 'SERVER_ERROR'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED';

// ═══════════════════════════════════════════════════════════
// SEO / STRUCTURED DATA
// ═══════════════════════════════════════════════════════════

export interface StructuredDataProduct {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description?: string;
  sku: string;
  brand?: {
    '@type': 'Brand';
    name: string;
  };
  image?: string;
  offers: {
    '@type': 'Offer';
    price: number;
    priceCurrency: 'COP';
    availability: 'https://schema.org/InStock' | 'https://schema.org/OutOfStock';
  };
}

export interface StructuredDataBusiness {
  '@context': 'https://schema.org';
  '@type': 'Store' | 'Restaurant' | 'LocalBusiness';
  name: string;
  description?: string;
  url: string;
  telephone?: string;
  image?: string;
  openingHoursSpecification?: Array<{
    '@type': 'OpeningHoursSpecification';
    dayOfWeek: string;
    opens: string;
    closes: string;
  }>;
}

// ═══════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════

export interface BusinessTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    card: string;
    cardForeground: string;
  };
  borderRadius: string;
}

// ═══════════════════════════════════════════════════════════
// MIGRATION HELPERS (Legacy compatibility)
// ═══════════════════════════════════════════════════════════

/**
 * Convert legacy Product to new CatalogProduct
 * Use during migration period
 */
export function migrateProductToCatalogProduct(
  legacyProduct: {
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
): CatalogProduct {
  return {
    id: legacyProduct.id,
    name: legacyProduct.name,
    description: legacyProduct.description,
    price: legacyProduct.price,
    sku: legacyProduct.sku,
    image: legacyProduct.imageUrl,
    categoryId: legacyProduct.categoryId,
    industryCategoryId: legacyProduct.industryCategoryId,
    isAvailable: legacyProduct.active,
    active: legacyProduct.active,
    stock: undefined,
    brand: undefined,
    isFromTemplate: false,
  };
}
