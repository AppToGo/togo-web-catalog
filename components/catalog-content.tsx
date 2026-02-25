'use client';

import { useState, useMemo } from 'react';
import type { Catalog } from '@/lib/types';
import { useCart } from './cart-provider';
import { ProductSearch } from './product-search';
import { ProductCard } from './product-card';
import { ProductModal } from './product-modal';
import { ProductGrid } from './product-grid';
import { CategoryList } from './category-list';

interface CatalogContentProps {
  catalog: Catalog;
  token: string;
  selectedCategory?: string;
}

export function CatalogContent({ catalog, token, selectedCategory }: CatalogContentProps) {
  const [filteredProducts, setFilteredProducts] = useState(catalog.products);
  const { cart } = useCart();

  // Mapeo de cantidades en carrito
  const cartQuantities = useMemo(() => {
    const quantities: Record<string, number> = {};
    cart.items.forEach((item) => {
      quantities[item.productId] = item.quantity;
    });
    return quantities;
  }, [cart]);

  // Determinar si estamos en modo búsqueda
  const isSearching = filteredProducts.length !== catalog.products.length;

  // Vista de búsqueda: mostrar productos en grid simple (busca en TODO el catálogo)
  if (isSearching) {
    return (
      <>
        <ProductSearch products={catalog.products} onFilter={setFilteredProducts} />
        
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              Resultados de búsqueda
            </h2>
            <span className="text-sm text-[var(--color-muted-foreground)]">
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {filteredProducts.length > 0 ? (
            <ProductGrid 
              products={filteredProducts} 
              token={token} 
              cartQuantities={cartQuantities} 
            />
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-[var(--color-muted-foreground)]">
                No se encontraron productos
              </p>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                Intenta con otra búsqueda
              </p>
            </div>
          )}
        </section>
      </>
    );
  }

  // Vista normal: mostrar jerarquía de categorías
  return (
    <>
      <ProductSearch products={catalog.products} onFilter={setFilteredProducts} />

      {/* Industry Categories */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-[var(--color-muted-foreground)] mb-3">
          Industry Categories
        </h2>
        <CategoryList
          categories={catalog.categories}
          selectedId={selectedCategory}
          token={token}
        />
      </section>

      {/* Productos agrupados por Industry Category > Sub-categoría */}
      <section className="mb-8">
        {selectedCategory ? (
          // Mostrar solo la categoría seleccionada con sus sub-categorías
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[var(--color-foreground)]">
                {catalog.categories.find((c) => c.id === selectedCategory)?.name}
              </h2>
            </div>
            
            {/* Agrupar por sub-categorías del negocio - productos de esta categoría */}
            {catalog.subCategories
              .filter((sc) => sc.industryCategoryId === selectedCategory)
              .map((subCategory) => {
                const subCategoryProducts = catalog.products.filter(
                  (p) => p.industryCategoryId === selectedCategory && p.categoryId === subCategory.id,
                );
                if (subCategoryProducts.length === 0) return null;

                return (
                  <div key={subCategory.id} className="mb-6">
                    <div className="mb-3">
                      <h3 className="text-base font-semibold text-[var(--color-muted-foreground)]">
                        {subCategory.name}
                      </h3>
                    </div>
                    <ProductGrid 
                      products={subCategoryProducts} 
                      token={token} 
                      cartQuantities={cartQuantities} 
                    />
                  </div>
                );
              })}

            {catalog.products.filter((p) => p.industryCategoryId === selectedCategory).length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">🔍</div>
                <p className="text-[var(--color-muted-foreground)]">
                  No hay productos en esta categoría
                </p>
              </div>
            )}
          </div>
        ) : (
          // Mostrar todas las industry categories con sus sub-categorías
          catalog.categories.map((category) => {
            const categorySubCategories = catalog.subCategories.filter(
              (sc) => sc.industryCategoryId === category.id,
            );

            return (
              <div key={category.id} className="mb-10">
                {/* Título de Industry Category */}
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-[var(--color-foreground)]">
                    {category.name}
                  </h2>
                </div>

                {/* Sub-categorías del negocio */}
                {categorySubCategories.map((subCategory) => {
                  const subCategoryProducts = catalog.products.filter(
                    (p) => p.categoryId === subCategory.id,
                  );
                  if (subCategoryProducts.length === 0) return null;

                  return (
                    <div key={subCategory.id} className="mb-6">
                      <div className="mb-3">
                        <h3 className="text-base font-semibold text-[var(--color-muted-foreground)]">
                          {subCategory.name}
                        </h3>
                      </div>
                      <ProductGrid 
                        products={subCategoryProducts} 
                        token={token} 
                        cartQuantities={cartQuantities} 
                      />
                    </div>
                  );
                })}
              </div>
            );
          })
        )}

        {/* Mensaje cuando no hay productos en ninguna categoría */}
        {!selectedCategory && catalog.products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-[var(--color-muted-foreground)]">
              No hay productos disponibles
            </p>
          </div>
        )}
      </section>
    </>
  );
}
