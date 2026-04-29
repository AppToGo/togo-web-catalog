/**
 * Branch Catalog Page
 *
 * Route: /{businessSlug}/{branchSlug}
 * Generated from WhatsApp greeting: /{businessSlug}/{branchSlug}?t={token}
 *
 * Fetches branch-scoped catalog via public endpoint.
 * Token (?t=) is optional — used only for customer identity (phone/name from WhatsApp).
 */

import { Suspense } from "react";
import { Metadata } from "next";
import { fetchCatalogByBranch, NotFoundError, RateLimitError, InvalidTokenError } from "@/lib/api";
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

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ businessSlug: string; branchSlug: string }>;
  searchParams: Promise<{
    t?: string; // token from WhatsApp (optional, for customer identity)
    source?: string;
    table?: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { businessSlug, branchSlug } = await params;
  try {
    const catalog = await fetchCatalogByBranch(businessSlug, branchSlug);
    return generateCatalogMetadata(catalog, businessSlug);
  } catch {
    return {
      title: "Catálogo no encontrado | ToGo",
      description: "El catálogo solicitado no está disponible",
    };
  }
}

function StructuredData({
  catalog,
  businessSlug,
}: {
  catalog: Awaited<ReturnType<typeof fetchCatalogByBranch>>;
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

function TokenExpired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Acceso no disponible
        </h1>
        <p className="text-gray-600">
          Tu enlace de acceso expiró o no es válido.
          <br />
          Escríbenos por WhatsApp para obtener uno nuevo.
        </p>
      </div>
    </div>
  );
}

function RateLimited() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Demasiadas solicitudes
        </h1>
        <p className="text-gray-600 mb-6">
          Estamos recibiendo muchas visitas. Espera unos segundos e intenta de nuevo.
        </p>
        <a
          href=""
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </a>
      </div>
    </div>
  );
}

function BusinessNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🏪</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Catálogo no encontrado
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

function EmptyCatalog({ businessName }: { businessName?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">📦</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {businessName || "Catálogo vacío"}
        </h1>
        <p className="text-gray-600">
          Esta sede aún no tiene productos disponibles.
          <br />
          Vuelve a consultar más tarde.
        </p>
      </div>
    </div>
  );
}

export default async function BranchCatalogPage({
  params,
  searchParams,
}: PageProps) {
  const { businessSlug, branchSlug } = await params;
  const { t: token, source, table } = await searchParams;

  if (
    !businessSlug ||
    !isValidSlug(businessSlug) ||
    !branchSlug ||
    !isValidSlug(branchSlug)
  ) {
    return <BusinessNotFound />;
  }

  try {
    const origin: CustomerOrigin = token
      ? "whatsapp"
      : (source as CustomerOrigin) || "direct";

    const catalog = await fetchCatalogByBranch(businessSlug, branchSlug, { token });

    if (!catalog.products || catalog.products.length === 0) {
      return <EmptyCatalog businessName={catalog.business.name} />;
    }

    // branchId and branchPhone come from the backend response — needed for cart operations and wa.me redirect
    const branchId = catalog.branchId ?? undefined;
    const branchPhone = catalog.branchPhone;

    return (
      <>
        <StructuredData catalog={catalog} businessSlug={businessSlug} />
        <div style={{ '--accent': catalog.business.primaryColor, '--accent-2': catalog.business.accentColor } as React.CSSProperties}>
          <CartProvider
            businessSlug={businessSlug}
            origin={origin}
            tableNumber={table}
            initialPhone={catalog.customerPhone}
            initialName={catalog.customerName}
            isAuthenticated={!!token}
            branchId={branchId}
            branchPhone={branchPhone}
            whatsappToken={token}
          >
            <CartUIProvider>
              <Suspense fallback={<CatalogSkeleton />}>
                <CatalogContent catalog={catalog} businessSlug={businessSlug} />
              </Suspense>

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
    if (error instanceof NotFoundError) return <BusinessNotFound />;
    if (error instanceof RateLimitError) return <RateLimited />;
    if (error instanceof InvalidTokenError) return <TokenExpired />;
    throw error;
  }
}
