/**
 * Catalog Page
 * Server Component 100% - Ultra ligero
 */

import { notFound } from 'next/navigation';
import { getCatalog, getCart } from '@/lib/api';
import { getTheme, generateThemeCSS } from '@/lib/theme';
import { CatalogHeader } from '@/components/catalog-header';
import { CategoryList } from '@/components/category-list';
import { ProductCard } from '@/components/product-card';
import { CartSection } from '@/components/cart-section';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ category?: string; error?: string }>;
}

export default async function CatalogPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { category: selectedCategory, error } = await searchParams;

  if (!token || token.length < 10) {
    notFound();
  }

  try {
    // Cargar datos en paralelo
    const [catalog, cart] = await Promise.all([
      getCatalog(token),
      getCart(token),
    ]);

    // Tema
    const theme = getTheme('RESTAURANT');

    // Filtrar productos
    const products = selectedCategory
      ? catalog.products.filter(p => p.categoryId === selectedCategory)
      : catalog.products;

    // Mapeo de cantidades en carrito
    const cartQuantities: Record<string, number> = {};
    cart.items.forEach(item => {
      cartQuantities[item.productId] = item.quantity;
    });

    return (
      <>
        {/* Tema CSS */}
        <style>{`:root { ${generateThemeCSS(theme)} }`}</style>

        <div className="min-h-screen bg-[var(--color-background)]">
          {/* Header */}
          <CatalogHeader
            businessName="Tu Negocio"
            cartItemCount={cart.items.reduce((s, i) => s + i.quantity, 0)}
          />

          {/* Main */}
          <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            {/* Error */}
            {error === 'order_failed' && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                Hubo un error al crear tu pedido. Intenta de nuevo.
              </div>
            )}

            {/* Categorías */}
            <section className="mb-6">
              <h2 className="text-sm font-medium text-[var(--color-muted-foreground)] mb-3">
                Categorías
              </h2>
              <CategoryList
                categories={catalog.categories}
                selectedId={selectedCategory}
                token={token}
              />
            </section>

            {/* Productos */}
            <section className="mb-8">
              {selectedCategory ? (
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-[var(--color-foreground)]">
                    {catalog.categories.find(c => c.id === selectedCategory)?.name}
                  </h2>
                </div>
              ) : null}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    token={token}
                    quantityInCart={cartQuantities[product.id]}
                  />
                ))}
              </div>

              {products.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-2">🔍</div>
                  <p className="text-[var(--color-muted-foreground)]">
                    No hay productos en esta categoría
                  </p>
                </div>
              )}
            </section>

            {/* Carrito */}
            <CartSection cart={cart} token={token} />
          </main>

          {/* Footer */}
          <footer className="border-t border-[var(--color-border)] py-6 mt-8">
            <div className="max-w-5xl mx-auto px-4 text-center text-xs text-[var(--color-muted-foreground)]">
              <p>Powered by ToGo</p>
            </div>
          </footer>
        </div>
      </>
    );
  } catch {
    notFound();
  }
}
