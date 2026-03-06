/**
 * Tipos del Web Catalog
 * Ultra ligero - solo interfaces esenciales
 */

// ═══════════════════════════════════════════════════════════
// DOMAIN - Catálogo
// ═══════════════════════════════════════════════════════════

export type CustomerOrigin = 'whatsapp' | 'direct' | 'qr' | 'instagram' | 'facebook';

export interface Category {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  icon?: string;
  color?: string;
}

export interface SubCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  industryCategoryId: string;
}

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

export interface Business {
  id: string;
  name: string;
  slug: string;
  phone: string;
  logo: string | null;
  banner: string | null;
  primaryColor: string;
  accentColor: string;
  description: string;
  industry: string;
}

export interface Catalog {
  business: Business;
  categories: Category[];
  subCategories: SubCategory[];
  products: Product[];
  // Datos del customer si existe
  customerPhone?: string;
  customerName?: string;
  tableNumber?: string;
  isAuthenticated?: boolean;
}

// ═══════════════════════════════════════════════════════════
// DOMAIN - Carrito
// ═══════════════════════════════════════════════════════════

export interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Cart {
  items: CartItem[];
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════
// DOMAIN - Customer (público)
// ═══════════════════════════════════════════════════════════

export interface CustomerData {
  origin: CustomerOrigin;
  phone?: string;
  name?: string;
  tableNumber?: string;
  isIdentified: boolean;
}

// ═══════════════════════════════════════════════════════════
// DOMAIN - Orden
// ═══════════════════════════════════════════════════════════

export type OrderStatusType = 
  | 'DRAFT'
  | 'CONFIRMED'
  | 'PAID'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderResponse {
  orderId: string;
  orderNumber: string;
  status: OrderStatusType;
  total: number;
  itemCount: number;
  message: string;
  businessPhone?: string;
  // Para catálogo público
  requiresWhatsAppConfirmation?: boolean;
  waMeUrl?: string;
}

// ═══════════════════════════════════════════════════════════
// DOMAIN - Contexto del Carrito (extendido para público)
// ═══════════════════════════════════════════════════════════

export interface CartContextState {
  cart: Cart;
  itemCount: number;
  isLoading: boolean;
  isSyncing: boolean;
  isHydrated: boolean;
  // Customer data (para catálogo público)
  customer: CustomerData;
}

export interface CartContextActions {
  addItem: (item: CartItem) => void;
  updateItem: (productId: string, delta: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  // Customer actions
  setCustomerPhone: (phone: string) => void;
  setCustomerName: (name: string) => void;
}

export type CartContextType = CartContextState & CartContextActions;

// ═══════════════════════════════════════════════════════════
// SEO - Structured Data
// ═══════════════════════════════════════════════════════════

export interface StructuredDataProduct {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description?: string;
  sku: string;
  image?: string;
  offers: {
    '@type': 'Offer';
    price: number;
    priceCurrency: 'COP';
    availability: string;
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
}

// ═══════════════════════════════════════════════════════════
// API - Request/Response
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
