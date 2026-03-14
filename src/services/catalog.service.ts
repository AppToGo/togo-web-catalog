/**
 * Catalog Service - Normalized Product Catalog
 * 
 * Service for the new BusinessProduct + GlobalProduct normalized catalog.
 * Replaces legacy Product-based API calls.
 */

import type { 
  CatalogProduct, 
  Category, 
  BusinessInfo,
  CatalogResponse,
  SearchResponse 
} from '@/src/types/catalog.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';
const DEFAULT_REVALIDATE = 3600; // 1 hour

// ═══════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════

class CatalogError extends Error {
  constructor(
    message: string, 
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'CatalogError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Error desconocido',
      code: 'UNKNOWN_ERROR'
    }));
    
    throw new CatalogError(
      error.message || `Error ${response.status}`,
      response.status,
      error.code
    );
  }
  return response.json();
}

// ═══════════════════════════════════════════════════════════
// BUILD URLS
// ═══════════════════════════════════════════════════════════

function buildWebCatalogUrl(businessSlug: string, path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}/web-catalog/${businessSlug}${cleanPath}`;
}

// ═══════════════════════════════════════════════════════════
// SERVER-SIDE FETCHES (CACHEABLE)
// ═══════════════════════════════════════════════════════════

/**
 * Get public catalog for a business
 * Uses normalized BusinessProduct + GlobalProduct structure
 */
export async function getBusinessCatalog(
  businessSlug: string,
  options?: { token?: string; table?: string }
): Promise<CatalogResponse> {
  const url = new URL(buildWebCatalogUrl(businessSlug));
  
  if (options?.token) {
    url.searchParams.set('token', options.token);
  }
  if (options?.table) {
    url.searchParams.set('table', options.table);
  }
  
  const response = await fetch(url.toString(), {
    next: { 
      tags: [`catalog-${businessSlug}`, 'catalog'],
      revalidate: DEFAULT_REVALIDATE,
    },
    headers: { 'Accept': 'application/json' },
  });
  
  return handleResponse<CatalogResponse>(response);
}

/**
 * Get product details by ID
 */
export async function getProductDetails(
  businessSlug: string,
  productId: string
): Promise<CatalogProduct | null> {
  try {
    const response = await fetch(
      buildWebCatalogUrl(businessSlug, `/products/${productId}`),
      {
        next: {
          tags: [`product-${productId}`, `catalog-${businessSlug}`],
          revalidate: DEFAULT_REVALIDATE,
        },
      }
    );
    
    if (!response.ok) return null;
    return handleResponse<CatalogProduct>(response);
  } catch {
    return null;
  }
}

/**
 * Get categories for a business
 */
export async function getCategories(businessSlug: string): Promise<Category[]> {
  const response = await fetch(
    buildWebCatalogUrl(businessSlug, '/categories'),
    {
      next: { 
        tags: [`categories-${businessSlug}`, 'categories'],
        revalidate: DEFAULT_REVALIDATE,
      },
    }
  );
  return handleResponse<Category[]>(response);
}

// ═══════════════════════════════════════════════════════════
// CLIENT-SIDE OPERATIONS (NO CACHE)
// ═══════════════════════════════════════════════════════════

/**
 * Search products in a business catalog
 * Client-side only - no caching
 */
export async function searchProducts(
  businessSlug: string,
  query: string
): Promise<CatalogProduct[]> {
  const url = new URL(buildWebCatalogUrl(businessSlug, '/search'));
  url.searchParams.set('q', query);
  
  const response = await fetch(url.toString(), {
    cache: 'no-store',
    headers: { 'Accept': 'application/json' },
  });
  
  const result = await handleResponse<SearchResponse>(response);
  return result.products;
}

// ═══════════════════════════════════════════════════════════
// STATIC GENERATION (Next.js)
// ═══════════════════════════════════════════════════════════

/**
 * Get all business slugs for static generation
 */
export async function getAllBusinessSlugs(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/public/businesses`, {
      next: { 
        tags: ['businesses'],
        revalidate: DEFAULT_REVALIDATE,
      },
    });
    
    if (!response.ok) return [];
    
    const businesses = await handleResponse<{ slug: string }[]>(response);
    return businesses.map(b => b.slug);
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════
// SERVICE CLASS (for OOP preference)
// ═══════════════════════════════════════════════════════════

export class CatalogService {
  async getBusinessCatalog(
    businessSlug: string, 
    options?: { token?: string; table?: string }
  ): Promise<CatalogResponse> {
    return getBusinessCatalog(businessSlug, options);
  }
  
  async searchProducts(
    businessSlug: string, 
    query: string
  ): Promise<CatalogProduct[]> {
    return searchProducts(businessSlug, query);
  }
  
  async getProductDetails(
    businessSlug: string, 
    productId: string
  ): Promise<CatalogProduct | null> {
    return getProductDetails(businessSlug, productId);
  }
  
  async getCategories(businessSlug: string): Promise<Category[]> {
    return getCategories(businessSlug);
  }
}

// Default instance
export const catalogService = new CatalogService();
