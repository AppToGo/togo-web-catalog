/**
 * CatalogContent - Server Component
 * 
 * Renderiza todo el contenido estático del catálogo:
 * - Header con branding
 * - Barra de búsqueda (wrapper)
 * - Chips de categorías (wrapper)
 * - Grid de productos (wrapper)
 * 
 * Solo los elementos interactivos son Client Components.
 * Esto minimiza el JavaScript enviado al cliente.
 */

import type { Catalog, Product } from '@/lib/types';
import { CatalogHeader } from '@/components/server/catalog-header';
import { CategorySection } from '@/components/server/category-section';
import { ProductGrid } from '@/components/client/product-grid';
import { SearchInput } from '@/components/client/search-input';
import { CategoryChips } from '@/components/client/category-chips';
import { FloatingCart } from '@/components/client/floating-cart';
import { ProductModal } from '@/components/client/product-modal';
import { CartDrawer } from '@/components/client/cart-drawer';


// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface CatalogContentProps {
  initialData: {
    catalog: Catalog;
    selectedCategory?: string;
    searchQuery?: string;
    currentPage: number;
    productsPerPage: number;
  };
  token: string;
}

// ═══════════════════════════════════════════════════════════
// UTILIDADES DE FILTRADO (SERVER-SIDE)
// ═══════════════════════════════════════════════════════════

/**
 * Sanitiza y valida el query de búsqueda
 */
function sanitizeSearchQuery(query: string): string {
  // Limitar longitud
  const trimmed = query.trim().slice(0, 100);
  // Solo permitir caracteres alfanuméricos y espacios
  return trimmed.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
}

function filterProducts(
  products: Product[],
  categoryId?: string,
  searchQuery?: string
): Product[] {
  let result = products;

  // Filtrar por categoría
  if (categoryId) {
    // Validar que categoryId sea un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(categoryId)) {
      result = result.filter((p) => p.industryCategoryId === categoryId);
    }
  }

  // Filtrar por búsqueda
  if (searchQuery) {
    const query = sanitizeSearchQuery(searchQuery);
    if (query.length >= 2) {
      // Escapar caracteres especiales de regex
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedQuery, 'i');
      
      result = result.filter(
        (p) =>
          regex.test(p.name) ||
          regex.test(p.sku) ||
          (p.description && regex.test(p.description))
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

  const groups: { 
    subCategory: typeof subCategories[0] | null; 
    products: Product[];
    id: string;
  }[] = [];

  // Subcategorías relevantes
  const relevantSubCategories = activeCategory
    ? subCategories.filter((sc) => sc.industryCategoryId === activeCategory)
    : subCategories;

  // Agrupar por subcategoría
  relevantSubCategories.forEach((subCategory) => {
    const subProducts = products.filter((p) => p.categoryId === subCategory.id);
    if (subProducts.length > 0) {
      groups.push({ 
        subCategory, 
        products: subProducts,
        id: subCategory.id
      });
    }
  });

  // Productos sin subcategoría
  const uncategorized = products.filter(
    (p) => !subCategories.some((sc) => sc.id === p.categoryId)
  );
  if (uncategorized.length > 0) {
    groups.push({ 
      subCategory: null, 
      products: uncategorized,
      id: 'uncategorized'
    });
  }

  return groups;
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════

export function CatalogContent({ initialData, token }: CatalogContentProps) {
  const { 
    catalog, 
    selectedCategory, 
    searchQuery, 
    currentPage, 
    productsPerPage 
  } = initialData;
  
  const { business, categories, subCategories, products } = catalog;

  // Filtrar productos (server-side)
  const filteredProducts = filterProducts(products, selectedCategory, searchQuery);
  
  // Paginación (solo en modo búsqueda o si hay muchos productos)
  const shouldPaginate = searchQuery || filteredProducts.length > 48;
  const { paginated, totalPages, total } = shouldPaginate
    ? paginateProducts(filteredProducts, currentPage, productsPerPage)
    : { paginated: filteredProducts, totalPages: 1, total: filteredProducts.length };

  // Agrupar por subcategoría (si no es búsqueda)
  const groupedProducts = searchQuery
    ? [{ subCategory: null as (typeof subCategories)[0] | null, products: paginated, id: 'search' }]
    : groupProductsBySubCategory(paginated, subCategories, selectedCategory);

  return (
    <div 
      className="min-h-screen bg-gray-50 pb-32"
      style={{
        '--business-primary': business.primaryColor,
        '--business-accent': business.accentColor,
      } as React.CSSProperties}
    >
      {/* ═══════════════════════════════════════════════════════
          HEADER (Server Component con imagen optimizada)
          ═══════════════════════════════════════════════════════ */}
      <CatalogHeader 
        business={business}
        token={token}
      />

      {/* ═══════════════════════════════════════════════════════
          SEARCH BAR (Client Component - interactiva)
          ═══════════════════════════════════════════════════════ */}
      <div className="sticky top-[72px] z-30 bg-white border-b border-gray-100 px-4 py-3">
        <SearchInput 
          initialValue={searchQuery || ''}
          placeholder="¿Qué estás buscando?"
        />
      </div>

      {/* ═══════════════════════════════════════════════════════
          CATEGORY CHIPS (Client Component - interactivo)
          ═══════════════════════════════════════════════════════ */}
      <CategoryChips
        categories={categories}
        selectedId={selectedCategory}
        primaryColor={business.primaryColor}
      />

      {/* ═══════════════════════════════════════════════════════
          MAIN CONTENT
          ═══════════════════════════════════════════════════════ */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {searchQuery ? (
          // ═══════════════════════════════════════════════════
          // VISTA DE BÚSQUEDA
          // ═══════════════════════════════════════════════════
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Resultados de búsqueda
              </h2>
              <span className="text-sm text-gray-500">
                {total} producto{total !== 1 ? 's' : ''}
              </span>
            </div>
            
            {paginated.length > 0 ? (
              <ProductGrid 
                products={paginated}
                accentColor={business.accentColor}
              />
            ) : (
              <EmptySearchState />
            )}
            
            {/* Paginación para búsqueda */}
            {totalPages > 1 && (
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages}
                searchQuery={searchQuery}
                category={selectedCategory}
              />
            )}
          </section>
        ) : (
          // ═══════════════════════════════════════════════════
          // VISTA NORMAL AGRUPADA
          // ═══════════════════════════════════════════════════
          <div className="space-y-8">
            {groupedProducts.map(({ subCategory, products: sectionProducts, id }) => (
              <CategorySection
                key={id}
                title={subCategory?.name}
                count={sectionProducts.length}
                products={sectionProducts}
                accentColor={business.accentColor}
              />
            ))}

            {groupedProducts.length === 0 && (
              <EmptyCategoryState />
            )}
            
            {/* Paginación si aplica */}
            {totalPages > 1 && (
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages}
                category={selectedCategory}
              />
            )}
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════
          CLIENT COMPONENTS (hidratación diferida)
          ═══════════════════════════════════════════════════════ */}
      <FloatingCart accentColor={business.accentColor} />
      <ProductModal token={token} accentColor={business.accentColor} />
      <CartDrawer token={token} business={business} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SUB-COMPONENTES INTERNOS
// ═══════════════════════════════════════════════════════════

function EmptySearchState() {
  return (
    <div className="text-center py-16">
      <span className="text-5xl mb-4 block" role="img" aria-label="Búsqueda">
        🔍
      </span>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No encontramos productos
      </h3>
      <p className="text-gray-500">
        Intenta con otros términos de búsqueda
      </p>
    </div>
  );
}

function EmptyCategoryState() {
  return (
    <div className="text-center py-16">
      <span className="text-5xl mb-4 block" role="img" aria-label="Vacío">
        📭
      </span>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No hay productos en esta categoría
      </h3>
      <p className="text-gray-500">
        Prueba seleccionando otra categoría
      </p>
    </div>
  );
}

function Pagination({ 
  currentPage, 
  totalPages,
  searchQuery,
  category
}: { 
  currentPage: number; 
  totalPages: number;
  searchQuery?: string;
  category?: string;
}) {
  // Construir URL base
  const params = new URLSearchParams();
  if (searchQuery) params.set('search', searchQuery);
  if (category) params.set('category', category);
  const baseQuery = params.toString();
  const baseUrl = baseQuery ? `?${baseQuery}&` : '?';

  return (
    <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Paginación">
      {currentPage > 1 && (
        <a
          href={`${baseUrl}page=${currentPage - 1}`}
          className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ← Anterior
        </a>
      )}
      
      <span className="px-4 py-2 text-sm text-gray-600">
        Página {currentPage} de {totalPages}
      </span>
      
      {currentPage < totalPages && (
        <a
          href={`${baseUrl}page=${currentPage + 1}`}
          className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Siguiente →
        </a>
      )}
    </nav>
  );
}
