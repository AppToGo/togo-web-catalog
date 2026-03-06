/**
 * Catalog Page - Pública
 * 
 * Nueva ruta: /catalog/[businessSlug]
 * Soporta catálogo público y autenticado (con token en query param)
 */

import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { fetchCatalog, getCatalog } from '@/lib/api';
import { generateCatalogMetadata, generateStructuredData } from '@/lib/seo';
import { isValidSlug } from '@/lib/utils';
import { CatalogContent } from '@/components/server/catalog-content';
import { CatalogSkeleton } from '@/components/ui/skeleton';
import { CartProvider } from '@/components/client/cart-context';
import { CartUIProvider } from '@/components/client/cart-ui-context';
import { CartDrawer } from '@/components/client/cart-drawer';
import { ProductModal } from '@/components/client/product-modal';
import { FloatingCart } from '@/components/client/floating-cart';
import type { CustomerOrigin } from '@/lib/types';

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { businessSlug } = await params;
  
  try {
    const catalog = await fetchCatalog(businessSlug);
    return generateCatalogMetadata(catalog, businessSlug);
  } catch {
    return {
      title: 'Catálogo no encontrado | ToGo',
      description: 'El catálogo solicitado no está disponible',
    };
  }
}

// ═══════════════════════════════════════════════════════════
// STRUCTURED DATA
// ═══════════════════════════════════════════════════════════

function StructuredData({ catalog, businessSlug }: { catalog: Awaited<ReturnType<typeof fetchCatalog>>; businessSlug: string }) {
  const structuredData = generateStructuredData(catalog, businessSlug);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
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
    notFound();
  }

  try {
    // Determinar origen del customer
    const origin: CustomerOrigin = token 
      ? 'whatsapp' 
      : (source as CustomerOrigin) || 'direct';
    
    const isAuthenticated = !!token;

    // Fetch del catálogo
    const catalog = await fetchCatalog(businessSlug, { token, table });

    return (
      <>
        <StructuredData catalog={catalog} businessSlug={businessSlug} />
        
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
              <CatalogContent 
                catalog={catalog}
                businessSlug={businessSlug}
              />
            </Suspense>
            
            {/* Client Components */}
            <FloatingCart accentColor={catalog.business.accentColor} />
            <ProductModal token={token || ''} accentColor={catalog.business.accentColor} />
            <CartDrawer business={catalog.business} />
          </CartUIProvider>
        </CartProvider>
      </>
    );
  } catch (error) {
    console.error('Error loading catalog:', error);
    notFound();
  }
}
