/**
 * Catalog Page - Ultra Optimizada
 * 
 * ESTRATEGIA DE RENDERING:
 * - Server Component 100% (sin 'use client')
 * - ISR con revalidación por webhook
 * - Streaming con Suspense
 * - Metadata dinámica para SEO
 * - OpenGraph image generado dinámicamente
 * 
 * PERFORMANCE:
 * - HTML estático servido desde CDN/edge
 * - Zero JavaScript en el bundle inicial
 * - CSS crítico inline
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getCatalog } from '@/lib/api';
import { generateCatalogMetadata, generateStructuredData } from '@/lib/seo';
import { isValidToken } from '@/lib/utils';
import { CatalogContent } from '@/components/server/catalog-content';
import { CatalogSkeleton } from '@/components/ui/skeleton';

// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓN ISR
// ═══════════════════════════════════════════════════════════

// ISR: HTML estático, revalidar por webhook o cada 1 hora
export const revalidate = 3600;

// Generación dinámica de paths no existentes
export const dynamicParams = true;

// ═══════════════════════════════════════════════════════════
// METADATA DINÁMICA (SEO)
// ═══════════════════════════════════════════════════════════

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ 
    category?: string;
    search?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  
  try {
    const catalog = await getCatalog(token);
    return generateCatalogMetadata(catalog, token);
  } catch {
    return {
      title: 'Catálogo no encontrado | ToGo',
      description: 'El catálogo solicitado no está disponible',
    };
  }
}

// ═══════════════════════════════════════════════════════════
// STRUCTURED DATA (JSON-LD)
// ═══════════════════════════════════════════════════════════

function StructuredData({ catalog, token }: { catalog: Awaited<ReturnType<typeof getCatalog>>; token: string }) {
  const structuredData = generateStructuredData(catalog, token);
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE COMPONENT (SERVER)
// ═══════════════════════════════════════════════════════════

export default async function CatalogPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { 
    category: selectedCategory,
    search: searchQuery,
    page = '1'
  } = await searchParams;

  // Validación del token
  if (!token || !isValidToken(token)) {
    notFound();
  }

  try {
    // Fetch con cache tags para revalidación on-demand
    const catalog = await getCatalog(token);

    // Calcular paginación
    const currentPage = parseInt(page, 10) || 1;
    const productsPerPage = 24;
    
    // Preparar datos para el componente cliente
    const initialData = {
      catalog,
      selectedCategory,
      searchQuery,
      currentPage,
      productsPerPage,
    };

    return (
      <>
        {/* Structured Data para SEO */}
        <StructuredData catalog={catalog} token={token} />
        
        {/* Contenido con streaming */}
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogContent 
            initialData={initialData}
            token={token}
          />
        </Suspense>
      </>
    );
  } catch (error) {
    console.error('Error loading catalog:', error);
    notFound();
  }
}
