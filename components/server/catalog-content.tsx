/**
 * CatalogContent - Server Component
 * 
 * Renderiza todo el contenido estático del catálogo.
 * Versión pública: recibe el catálogo completo del Server Component padre.
 */

import type { Catalog, Product } from '@/lib/types';
import { CatalogHeader } from '@/components/server/catalog-header';
import { CategorySection } from '@/components/server/category-section';
import { ProductGrid } from '@/components/client/product-grid';
import { SearchInput } from '@/components/client/search-input';
import { CategoryChips } from '@/components/client/category-chips';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface CatalogContentProps {
  catalog: Catalog;
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
  products: Product[],
  categoryId?: string,
  searchQuery?: string
): Product[] {
  let result = products;

  if (categoryId) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(categoryId)) {
      result = result.filter((p) => p.industryCategoryId === categoryId);
    }
  }

  if (searchQuery) {
    const query = sanitizeSearchQuery(searchQuery);
    if (query.length >= 2) {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedQuery, 'i');
      result = result.filter(
        (p) => regex.test(p.name) || regex.test(p.sku) || (p.description && regex.test(p.description))
      );
    }
  }

  return result;
}

function paginateProducts(
  products: Product[],
  page: number,
  perPage: number
): { paginated: Product[]; totalPages: number; total: number } {
  const total = products.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const paginated = products.slice(start, start + perPage);
  return { paginated, totalPages, total };
}

function groupProductsBySubCategory(
  products: Product[],
  subCategories: Catalog['subCategories'],
  activeCategory?: string
) {
  if (products.length === 0) return [];

  const groups: { subCategory: typeof subCategories[0] | null; products: Product[]; id: string }[] = [];
  const relevantSubCategories = activeCategory
    ? subCategories.filter((sc) => sc.industryCategoryId === activeCategory)
    : subCategories;

  relevantSubCategories.forEach((subCategory) => {
    const subProducts = products.filter((p) => p.categoryId === subCategory.id);
    if (subProducts.length > 0) {
      groups.push({ subCategory, products: subProducts, id: subCategory.id });
    }
  });

  const uncategorized = products.filter(
    (p) => !subCategories.some((sc) => sc.id === p.categoryId)
  );
  if (uncategorized.length > 0) {
    groups.push({ subCategory: null, products: uncategorized, id: 'uncategorized' });
  }

  return groups;
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════

export function CatalogContent({ catalog, businessSlug }: CatalogContentProps) {
  const { business, categories, subCategories, products } = catalog;

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
        <CategorySection
          title="Todos los productos"
          count={products.length}
          products={products}
          accentColor={business.accentColor}
        />
      </main>
    </div>
  );
}
