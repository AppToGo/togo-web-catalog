/**
 * CatalogContent - Server Component
 * 
 * Renderiza todo el contenido estático del catálogo.
 * Versión pública: recibe el catálogo completo del Server Component padre.
 * 
 * Updated for normalized catalog (BusinessProduct + GlobalProduct)
 */

import { Suspense } from 'react';
import type { CatalogResponse, CatalogProduct, Category } from '@/src/types/catalog.types';
import { CatalogHeader } from '@/components/server/catalog-header';
import { CategorySection } from '@/components/server/category-section';
import { ProductGrid, CategoryProductGrid } from '@/components/client/product-grid';
import { SearchInput } from '@/components/client/search-input';
import { CategoryChips } from '@/components/client/category-chips';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface CatalogContentProps {
  catalog: CatalogResponse;
  businessSlug: string;
}

// ═══════════════════════════════════════════════════════════
// UTILIDADES DE FILTRADO (SERVER-SIDE)
// ═══════════════════════════════════════════════════════════

function sanitizeSearchQuery(query: string): string {
  const trimmed = query.trim().slice(0, 100);
  return trimmed.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
}

function filterProducts(
  products: CatalogProduct[],
  categoryId?: string,
  searchQuery?: string
): CatalogProduct[] {
  let result = products;

  // Filter by category
  if (categoryId) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(categoryId)) {
      result = result.filter((p) => 
        p.industryCategoryId === categoryId || p.categoryId === categoryId
      );
    }
  }

  // Filter by search query
  if (searchQuery) {
    const query = sanitizeSearchQuery(searchQuery);
    if (query.length >= 2) {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedQuery, 'i');
      result = result.filter(
        (p) => regex.test(p.name) || 
               regex.test(p.sku) || 
               (p.description && regex.test(p.description)) ||
               (p.brand && regex.test(p.brand))
      );
    }
  }

  return result;
}

function paginateProducts(
  products: CatalogProduct[],
  page: number,
  perPage: number
): { paginated: CatalogProduct[]; totalPages: number; total: number } {
  const total = products.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const paginated = products.slice(start, start + perPage);
  return { paginated, totalPages, total };
}

function groupProductsByCategory(
  products: CatalogProduct[],
  categories: Category[]
): Map<string, CatalogProduct[]> {
  const groups = new Map<string, CatalogProduct[]>();
  
  // Group by categoryId
  for (const product of products) {
    const categoryId = product.industryCategoryId || product.categoryId || 'uncategorized';
    const existing = groups.get(categoryId) || [];
    existing.push(product);
    groups.set(categoryId, existing);
  }
  
  return groups;
}

// ═══════════════════════════════════════════════════════════
// EMPTY STATES
// ═══════════════════════════════════════════════════════════

function NoProductsFound() {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No se encontraron productos
      </h3>
      <p className="text-gray-500">
        Intenta con otros términos de búsqueda o categorías
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════

export function CatalogContent({ catalog, businessSlug }: CatalogContentProps) {
  const { business, categories, subCategories, products } = catalog;

  // Group products by category for organized display
  const productsByCategory = groupProductsByCategory(products, categories);

  return (
    <div 
      className="min-h-screen bg-gray-50 pb-32"
      style={{
        '--business-primary': business.primaryColor,
        '--business-accent': business.accentColor,
      } as React.CSSProperties}
    >
      {/* Header */}
      <CatalogHeader business={business} businessSlug={businessSlug} />

      {/* Search */}
      <div className="sticky top-[72px] z-30 bg-white border-b border-gray-100 px-4 py-3">
        <SearchInput placeholder="¿Qué estás buscando?" />
      </div>

      {/* Categories */}
      <CategoryChips
        categories={categories}
        primaryColor={business.primaryColor}
      />

      {/* Products */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {products.length === 0 ? (
          <NoProductsFound />
        ) : (
          <>
            {/* Display all products grouped by category */}
            {categories.map((category) => {
              const categoryProducts = productsByCategory.get(category.id) || [];
              if (categoryProducts.length === 0) return null;
              
              return (
                <CategorySection
                  key={category.id}
                  title={category.name}
                  count={categoryProducts.length}
                  products={categoryProducts}
                  accentColor={business.accentColor}
                />
              );
            })}
            
            {/* Uncategorized products */}
            {productsByCategory.has('uncategorized') && (
              <CategorySection
                title="Otros productos"
                count={productsByCategory.get('uncategorized')?.length || 0}
                products={productsByCategory.get('uncategorized') || []}
                accentColor={business.accentColor}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LOADING SKELETON (Server Component)
// ═══════════════════════════════════════════════════════════

export function CatalogContentSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      {/* Search Skeleton */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
      </div>

      {/* Categories Skeleton */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i}
              className="h-10 w-24 bg-gray-200 rounded-full animate-pulse shrink-0"
            />
          ))}
        </div>
      </div>

      {/* Products Skeleton */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div 
              key={i}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="aspect-square bg-gray-200 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
