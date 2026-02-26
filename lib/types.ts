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
  categoryId: string; // Category ID del negocio
  industryCategoryId: string; // Industry Category ID
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
  categories: Category[]; // Industry Categories
  subCategories: SubCategory[]; // Categorías del negocio
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
  businessPhone?: string;
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
