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

  /** Variants when product has multiple presentations */
  variants?: CatalogVariant[];

  /** Minimum price across active variants */
  priceFrom?: number;

  /** Maximum price across active variants */
  priceTo?: number;

  /** Ingredients: list, or a string separated by commas or line breaks */
  ingredients?: string[] | string;

  /** Preparation steps: list, or a string with one step per line */
  preparation?: string[] | string;

  /**
   * Productos que se ofrecen al agregar este ("Va muy bien con"), en el
   * orden del admin. El backend ya dejó solo los activos y con stock en la
   * sede del catálogo.
   */
  recommendedProductIds?: string[];
  /**
   * Presentación concreta de cada recomendado, en la misma posición que
   * `recommendedProductIds`: la hoja agrega esa variante exacta con un
   * toque. Ausente en filas guardadas antes de las recomendaciones por
   * variante — ahí se usa la predeterminada o la única, como antes.
   */
  recommendedVariantIds?: string[];
}

/** Ingredientes normalizados: string separado por comas o saltos de línea, sin vacíos */
export function getProductIngredients(product: Pick<CatalogProduct, 'ingredients'>): string[] {
  return normalizeTextList(product.ingredients, /[,\n]/);
}

/** Pasos de preparación normalizados: string con un paso por línea, sin vacíos */
export function getProductPreparation(product: Pick<CatalogProduct, 'preparation'>): string[] {
  return normalizeTextList(product.preparation, /\n/);
}

function normalizeTextList(value: string[] | string | undefined, separator: RegExp): string[] {
  if (!value) return [];
  const items = Array.isArray(value) ? value : value.split(separator);
  return items
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
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

  /** Whether to show product images in the catalog */
  useProductImages?: boolean;
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

  /** Branch phone when the sede has its own number distinct from the business phone.
   *  Only returned by the backend when the branch has a dedicated phone.
   *  Absent when the business uses a single shared number across all branches. */
  branchPhone?: string;

  /** Negocio multi-sede pedido sin sede: no trae productos, solo `branches`
   *  para que el cliente elija una. */
  requiresBranchSelection?: boolean;

  /** Sedes activas del negocio — solo cuando `requiresBranchSelection`. */
  branches?: CatalogBranch[];

  /** Sede resuelta del catálogo. */
  selectedBranch?: { id: string; name: string; code: string };

  /** Cantidad de sedes activas del negocio (para ofrecer "Cambiar" sede). */
  branchCount?: number;

  /** Productos destacados de la sede, en el orden del carrusel. */
  featuredProductIds?: string[];
}

/**
 * Sede ofrecida en la pantalla de selección (negocio multi-sede sin sede)
 */
export interface CatalogBranch {
  id: string;
  name: string;
  code: string;
  slug: string;
  address?: string;
  city?: string;
  isMainBranch: boolean;
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
 * Variant of a product (e.g. size, format, presentation)
 */
export interface CatalogVariant {
  id: string;
  label: string;
  price: number;
  isDefault: boolean;
  isAvailable: boolean;
  attributes: Record<string, string | number>;
}

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

  /** ProductVariant ID when the product has variants */
  variantId?: string;

  /** Variant label for display (e.g. "1.5L", "Grande") */
  variantLabel?: string;

  /** Variant attributes snapshot (e.g. { size: "1.5L", format: "Botella" }) */
  variantAttributes?: Record<string, string | number>;
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
  /** WhatsApp phone of the specific branch (E.164). Set when branch has its own number; falls back to businessPhone otherwise. */
  branchPhone?: string;
  requiresWhatsAppConfirmation?: boolean;
  waMeUrl?: string;
}

// ═══════════════════════════════════════════════════════════
// CUSTOMER
// ═══════════════════════════════════════════════════════════

export type CustomerOrigin = 'whatsapp' | 'direct' | 'qr' | 'instagram' | 'facebook' | 'directory';

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
// MODO OPERADOR (mesero tomando pedidos en el local)
// ═══════════════════════════════════════════════════════════

export interface OperatorSessionTable {
  id: string;
  name: string;
  code: string;
  /** Tiene un pedido confirmado sin entregar: se muestra en gris */
  hasOpenOrder: boolean;
}

export interface OperatorSessionInfo {
  operatorName: string;
  branch: { id: string; name: string; slug: string };
  expiresAt: string;
  /** La sede acepta pedidos en mesa de operadores */
  dineInEnabled: boolean;
  tables: OperatorSessionTable[];
}

export interface OperatorSessionOrder {
  id: string;
  orderNumber: string;
  tableLabel: string | null;
  status: string;
  total: number;
  createdAt: string;
}

export interface CreatedOperatorOrder {
  orderId: string;
  orderNumber: string;
  total: number;
  tableLabel: string | null;
}

// ═══════════════════════════════════════════════════════════
// DIRECTORIO PÚBLICO (GET /public/directory*)
// ═══════════════════════════════════════════════════════════

export interface DirectoryTaxon {
  slug: string;
  name: string;
}

export interface DirectoryFacet extends DirectoryTaxon {
  count: number;
}

export interface DirectoryBranch {
  slug: string;
  name: string;
  city: string | null;
  citySlug: string | null;
  address: string | null;
  isOpen: boolean;
}

export interface DirectoryBusiness {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  primaryColor: string | null;
  description: string | null;
  industry: DirectoryTaxon | null;
  categories: DirectoryTaxon[];
  branches: DirectoryBranch[];
  isOpen: boolean;
  /** Productos que explican el resultado de la búsqueda ("Coincide: …"). */
  matches: string[];
  /** Ruta del catálogo del negocio (o de su sede). */
  path: string;
}

export interface DirectoryResult {
  items: DirectoryBusiness[];
  total: number;
  page: number;
  limit: number;
  city: DirectoryTaxon | null;
  query: string;
}

export interface DirectoryFacets {
  industries: DirectoryFacet[];
  categories: DirectoryFacet[];
  cities: DirectoryFacet[];
}

export interface DirectorySitemap {
  businesses: Array<{ slug: string }>;
  landings: Array<{ city: string; category: string }>;
  cities: string[];
}

export interface DirectoryFilters {
  q?: string;
  industry?: string;
  category?: string;
  city?: string;
  openNow?: boolean;
  page?: number;
  limit?: number;
}
