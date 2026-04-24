/**
 * Catalog Page - Pública
 *
 * Nueva ruta: /catalog/[businessSlug]
 * Soporta catálogo público y autenticado (con token en query param)
 *
 * Uses normalized catalog (BusinessProduct + GlobalProduct)
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { fetchCatalog } from "@/lib/api";
import { generateCatalogMetadata, generateStructuredData } from "@/lib/seo";
import { isValidSlug } from "@/lib/utils";
import { CatalogContent } from "@/components/server/catalog-content";
import { CatalogSkeleton } from "@/components/ui/skeleton";
import { CartProvider } from "@/components/client/cart-context";
import { CartUIProvider } from "@/components/client/cart-ui-context";
import { CartDrawer } from "@/components/client/cart-drawer";
import { ProductModal } from "@/components/client/product-modal";
import { FloatingCart } from "@/components/client/floating-cart";
import type { CustomerOrigin } from "@/lib/types";

// ISR: HTML estático, revalidar por webhook o cada 1 hora
export const revalidate = 3600;
export const dynamicParams = true;

// ═══════════════════════════════════════════════════════════
// METADATA DINÁMICA
// ═══════════════════════════════════════════════════════════

interface PageProps {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{
    token?: string;
    source?: string;
    table?: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { businessSlug } = await params;

  try {
    const catalog = await fetchCatalog(businessSlug);
    return generateCatalogMetadata(catalog, businessSlug);
  } catch {
    return {
      title: "Catálogo no encontrado | ToGo",
      description: "El catálogo solicitado no está disponible",
    };
  }
}

// ═══════════════════════════════════════════════════════════
// STRUCTURED DATA
// ═══════════════════════════════════════════════════════════

function StructuredData({
  catalog,
  businessSlug,
}: {
  catalog: Awaited<ReturnType<typeof fetchCatalog>>;
  businessSlug: string;
}) {
  const structuredData = generateStructuredData(catalog, businessSlug);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// ═══════════════════════════════════════════════════════════
// ERROR COMPONENTS
// ═══════════════════════════════════════════════════════════

function BusinessNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🏪</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Negocio no encontrado
        </h1>
        <p className="text-gray-600 mb-6">
          El catálogo que buscas no existe o ya no está disponible.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}

function CatalogError({ retry }: { retry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Error al cargar el catálogo
        </h1>
        <p className="text-gray-600 mb-6">
          Hubo un problema al cargar el catálogo. Por favor, intenta nuevamente.
        </p>
        <button
          onClick={retry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}

function EmptyCatalog({ businessName }: { businessName?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">📦</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {businessName || "Catálogo vacío"}
        </h1>
        <p className="text-gray-600">
          Este negocio aún no tiene productos disponibles.
          <br />
          Vuelve a consultar más tarde.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE COMPONENT
// ═══════════════════════════════════════════════════════════

export default async function CatalogPage({ params, searchParams }: PageProps) {
  const { businessSlug } = await params;
  const { token, source, table } = await searchParams;

  // Validar slug
  if (!businessSlug || !isValidSlug(businessSlug)) {
    return <BusinessNotFound />;
  }

  try {
    // Determinar origen del customer
    const origin: CustomerOrigin = token
      ? "whatsapp"
      : (source as CustomerOrigin) || "direct";

    const isAuthenticated = !!token;

    // Fetch del catálogo (normalized catalog)
    const catalog = await fetchCatalog(businessSlug, { token, table });

    // Validar que el catálogo tenga productos
    if (!catalog.products || catalog.products.length === 0) {
      return <EmptyCatalog businessName={catalog.business.name} />;
    }

    return (
      <>
        <StructuredData catalog={catalog} businessSlug={businessSlug} />

        <div
          style={
            {
              "--accent": catalog.business.primaryColor,
              "--accent-2": catalog.business.accentColor,
            } as React.CSSProperties
          }
        >
          <CartProvider
            businessSlug={businessSlug}
            origin={origin}
            tableNumber={table}
            initialPhone={catalog.customerPhone}
            initialName={catalog.customerName}
            isAuthenticated={isAuthenticated}
          >
            <CartUIProvider>
              <Suspense fallback={<CatalogSkeleton />}>
                <CatalogContent catalog={catalog} businessSlug={businessSlug} />
              </Suspense>

              {/* Client Components */}
              <FloatingCart accentColor={catalog.business.primaryColor} />
              <ProductModal
                token={token || ""}
                accentColor={catalog.business.primaryColor}
              />
              <CartDrawer business={catalog.business} />
            </CartUIProvider>
          </CartProvider>
        </div>
      </>
    );
  } catch (error) {
    console.error("Error loading catalog:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (
        error.message.includes("404") ||
        error.message.includes("no encontrado")
      ) {
        return <BusinessNotFound />;
      }
    }

    // Generic error with retry option
    return <CatalogError retry={() => window?.location?.reload()} />;
  }
}
