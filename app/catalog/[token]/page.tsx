/**
 * Catalog Page
 * Server Component 100% - Ultra ligero
 * 
 * Revalidación: ON-DEMAND via webhook
 * - Catálogo: Cacheado permanentemente (solo se actualiza via webhook)
 * - Carrito: Cargado en el cliente (no afecta el cache del catálogo)
 */

import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/api";
import { getTheme, generateThemeCSS } from "@/lib/theme";
import { CatalogContent } from "@/components/catalog-content";
import { CartProvider } from "@/components/cart-provider";
import { CatalogHeaderClient } from "@/components/catalog-header-client";
import { CartSectionClient } from "@/components/cart-section-client";

// Revalidación on-demand (no time-based)
// El backend llama a /api/revalidate cuando hay cambios
export const revalidate = false;

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
    // Cargar SOLO el catálogo en el servidor (cacheado permanentemente)
    const catalog = await getCatalog(token);

    // Tema
    const theme = getTheme("RESTAURANT");

    return (
      <CartProvider token={token}>
        {/* Tema CSS */}
        <style>{`:root { ${generateThemeCSS(theme)} }`}</style>

        <div className="min-h-screen bg-[var(--color-background)]">
          {/* Header - Cliente (carga carrito) */}
          <CatalogHeaderClient />

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
              token={token}
              selectedCategory={selectedCategory}
            />

            {/* Carrito - Cliente */}
            <CartSectionClient token={token} />
          </main>

          {/* Footer */}
          <footer className="border-t border-[var(--color-border)] py-6 mt-8">
            <div className="max-w-5xl mx-auto px-4 text-center text-xs text-[var(--color-muted-foreground)]">
              <p>Powered by ToGo</p>
            </div>
          </footer>
        </div>
      </CartProvider>
    );
  } catch {
    notFound();
  }
}
