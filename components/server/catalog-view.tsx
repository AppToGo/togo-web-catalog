/**
 * CatalogView - Server Component
 *
 * Catálogo ya resuelto (con productos) envuelto en el tema del negocio y los
 * providers de carrito. Lo comparten la página del negocio (una sola sede) y
 * la de sede, que solo difieren en cómo obtienen el catálogo.
 */

import { Suspense } from "react";
import type { Cart, BusinessInfo, CatalogResponse } from "@/src/types/catalog.types";
import { CatalogContent } from "@/components/server/catalog-content";
import { CatalogSkeleton } from "@/components/ui/skeleton";
import { CartProvider } from "@/components/client/cart-context";
import { OperatorSessionProvider } from "@/components/client/operator-session-context";
import { CartUIProvider } from "@/components/client/cart-ui-context";
import { RecommendationsSheet } from "@/components/client/recommendations-sheet";
import { RecommendationsProvider } from "@/components/client/recommendations-context";
import { productsForRecommendations } from "@/lib/recommendations";
import { CartDrawer } from "@/components/client/cart-drawer";
import { ProductModal } from "@/components/client/product-modal";
import { FloatingCart } from "@/components/client/floating-cart";
import type { CustomerOrigin } from "@/lib/types";
import { getColorContrast } from "@/components/utils/getColorContrast";
import Link from "next/link";
import { TogoLogo } from "@/components/ui/togo-logo";

/** Colores del negocio como variables CSS, para el wrapper `data-catalog-theme`. */
export function catalogThemeStyle(business: BusinessInfo): React.CSSProperties {
  return {
    "--accent": business.primaryColor,
    "--accent-2": business.accentColor,
    "--accent-ink": getColorContrast(business.primaryColor || "#000000"),
    "--accent-2-ink": getColorContrast(business.accentColor || "#000000"),
  } as React.CSSProperties;
}

interface CatalogViewProps {
  catalog: CatalogResponse;
  businessSlug: string;
  origin: CustomerOrigin;
  table?: string;
  token?: string;
  initialCart?: Cart;
  /** `?op=`: token del modo operador (mesero tomando pedidos en el local) */
  operatorToken?: string;
  /** Query params del enlace original, para que "Cambiar sede" no los pierda */
  linkParams: Record<string, string | undefined>;
}

/** `path` con los parámetros del enlace original que tengan valor
 *  (token de WhatsApp, origen, mesa), para no perderlos al cambiar de sede. */
export function catalogHref(
  path: string,
  linkParams: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(linkParams)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return `${path}${query ? `?${query}` : ""}`;
}

export function CatalogView({
  catalog,
  businessSlug,
  origin,
  table,
  token,
  initialCart,
  operatorToken,
  linkParams,
}: CatalogViewProps) {
  const useProductImages = catalog.business.useProductImages ?? false;

  return (
    <div data-catalog-theme style={catalogThemeStyle(catalog.business)}>
      <OperatorSessionProvider
        businessSlug={businessSlug}
        initialToken={operatorToken}
        initialTableCode={operatorToken ? table : undefined}
      >
      <CartProvider
        businessSlug={businessSlug}
        origin={origin}
        // En modo operador la mesa se elige en el carrito, no es la del QR.
        tableNumber={operatorToken ? undefined : table}
        initialPhone={catalog.customerPhone}
        initialName={catalog.customerName}
        isAuthenticated={!!token}
        // branchId and branchPhone come from the backend response — needed for cart operations and wa.me redirect
        branchId={catalog.branchId ?? undefined}
        branchPhone={catalog.branchPhone}
        tipConfig={catalog.selectedBranch?.tipConfig}
        whatsappToken={token}
        initialCart={initialCart}
      >
        <CartUIProvider>
          <RecommendationsProvider
            products={productsForRecommendations(catalog.products)}
          >
            <Suspense fallback={<CatalogSkeleton />}>
              <CatalogContent
                catalog={catalog}
                changeBranchHref={catalogHref(`/${businessSlug}`, linkParams)}
              />
            </Suspense>

            {/* Firma discreta: el catálogo es del negocio, el directorio es de TOGO. */}
            <footer className="flex items-center justify-center gap-1.5 pt-8 pb-28 text-[11px] text-(--ink-3)">
              Pedidos con
              <Link href="/" aria-label="Directorio de negocios TOGO">
                <TogoLogo width={80} />
              </Link>
            </footer>

            <FloatingCart accentColor={catalog.business.primaryColor} />
            <ProductModal
              useProductImages={useProductImages}
              featuredProductIds={catalog.featuredProductIds}
            />
            <CartDrawer business={catalog.business} />
            <RecommendationsSheet useProductImages={useProductImages} />
          </RecommendationsProvider>
        </CartUIProvider>
      </CartProvider>
      </OperatorSessionProvider>
    </div>
  );
}
