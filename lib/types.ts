/**
 * Tipos del Web Catalog
 * Ultra ligero - solo interfaces esenciales
 */

// ═══════════════════════════════════════════════════════════
// Domain
// ═══════════════════════════════════════════════════════════

export interface Category {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  sku: string;
  imageUrl?: string;
  categoryId: string;
  active: boolean;
}

export interface Catalog {
  businessId: string;
  categories: Category[];
  products: Product[];
}

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

export interface OrderResponse {
  orderId: string;
  orderNumber: string;
  status: string;
  total: number;
  itemCount: number;
  message: string;
}

// ═══════════════════════════════════════════════════════════
// Tema
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
