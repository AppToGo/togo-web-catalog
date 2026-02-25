/**
 * Catalog Page
 * Server Component 100% - Ultra ligero
 */

import { notFound } from "next/navigation";
import { getCatalog, getCart } from "@/lib/api";
import { getTheme, generateThemeCSS } from "@/lib/theme";
import { CatalogHeader } from "@/components/catalog-header";
import { CartSection } from "@/components/cart-section";
import { CatalogContent } from "@/components/catalog-content";

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
    const theme = getTheme("RESTAURANT");

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
            {error === "order_failed" && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                Hubo un error al crear tu pedido. Intenta de nuevo.
              </div>
            )}

            {/* Contenido del catálogo (con búsqueda y modal) */}
            <CatalogContent
              catalog={catalog}
              cart={cart}
              token={token}
              selectedCategory={selectedCategory}
            />

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
