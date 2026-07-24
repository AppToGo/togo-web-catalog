/**
 * Business Catalog Page
 *
 * Route: /{businessSlug}
 * Generated from WhatsApp greeting: /{businessSlug}?t={token}
 *
 * Fetches business-scoped catalog via public endpoint.
 * Token (?t=) is optional — used only for customer identity (phone/name from WhatsApp).
 */

import { Suspense } from "react";
import { Metadata } from "next";
import { fetchCatalog, getCartByToken, NotFoundError, RateLimitError, InvalidTokenError } from "@/lib/api";
import type { Cart } from "@/src/types/catalog.types";
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

export const revalidate = 86400; // 24h — red de seguridad; la revalidación on-demand cubre el caso normal
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{
    t?: string; // token from WhatsApp (optional, for customer identity)
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

export default async function BusinessCatalogPage({
  params,
  searchParams,
}: PageProps) {
  const { businessSlug } = await params;
  const { t: token, source, table } = await searchParams;

  if (!businessSlug || !isValidSlug(businessSlug)) {
    return <BusinessNotFound />;
  }

  try {
    let effectiveToken: string | undefined = token;
    let origin: CustomerOrigin = token
      ? "whatsapp"
      : (source as CustomerOrigin) || "direct";

    let catalog;
    let initialCart: Cart | undefined;

    try {
      // Fetch catalog and cart in parallel when a token is present
      const [catalogResult, cartResult] = await Promise.all([
        fetchCatalog(businessSlug, { token: effectiveToken, table }),
        effectiveToken ? getCartByToken(effectiveToken).catch(() => undefined) : Promise.resolve(undefined),
      ]);
      catalog = catalogResult;
      initialCart = cartResult?.items?.length ? cartResult : undefined;
    } catch (err) {
      if (err instanceof InvalidTokenError) {
        // Token expired — load catalog anonymously, no cart
        effectiveToken = undefined;
        origin = (source as CustomerOrigin) || "direct";
        catalog = await fetchCatalog(businessSlug, { table });
      } else {
        throw err;
      }
    }

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
            isAuthenticated={!!effectiveToken}
            whatsappToken={effectiveToken}
            initialCart={initialCart}
          >
            <CartUIProvider>
              <Suspense fallback={<CatalogSkeleton />}>
                <CatalogContent catalog={catalog} businessSlug={businessSlug} />
              </Suspense>

              <FloatingCart accentColor={catalog.business.primaryColor} />
              <ProductModal
                token={effectiveToken || ""}
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
