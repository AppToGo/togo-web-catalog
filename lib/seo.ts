/**
 * SEO Utilities
 * 
 * Genera metadata dinámica y structured data para:
 * - OpenGraph (Facebook, LinkedIn, etc.)
 * - Twitter Cards
 * - JSON-LD (Schema.org)
 * - Sitemap
 * 
 * Updated for normalized catalog (BusinessProduct + GlobalProduct)
 */

import { Metadata } from 'next';
import type { CatalogResponse, CatalogProduct, BusinessInfo, DirectoryBusiness } from '@/src/types/catalog.types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://catalogo.togoapp.co';

// ═══════════════════════════════════════════════════════════
// METADATA
// ═══════════════════════════════════════════════════════════

export function generateCatalogMetadata(
  catalog: CatalogResponse,
  businessSlug: string
): Metadata {
  const { business } = catalog;
  // Sin sede elegida (requiresBranchSelection) la respuesta no trae productos
  const products = catalog.products ?? [];
  const productCount = products.length;
  
  const title = `${business.name} | Catálogo Online`;
  const description = business.description || 
    `Explora nuestro catálogo de ${productCount} productos. ` +
    `Haz tu pedido online fácilmente en ${business.name}.`;

  const canonicalUrl = `${APP_URL}/${businessSlug}`;
  const ogImageUrl = `${APP_URL}/${businessSlug}/opengraph-image`;

  return {
    title,
    description,
    keywords: [
      business.name,
      business.industry,
      'catálogo online',
      'pedidos online',
      'tienda virtual',
      'comprar online',
    ],
    authors: [{ name: business.name }],
    creator: business.name,
    publisher: 'ToGo',
    
    // Canonical URL
    alternates: {
      canonical: canonicalUrl,
    },
    
    // OpenGraph
    openGraph: {
      type: 'website',
      locale: 'es_CO',
      url: canonicalUrl,
      siteName: business.name,
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${business.name} - Catálogo Online`,
        },
      ],
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
    
    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    // Icons
    icons: business.logo ? {
      icon: business.logo,
      apple: business.logo,
    } : undefined,
    
    // Verification (opcional)
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  };
}

export function generateProductMetadata(
  product: CatalogProduct,
  business: BusinessInfo,
  businessSlug: string
): Metadata {
  const title = `${product.name} | ${business.name}`;
  const description = product.description || 
    `Compra ${product.name} en ${business.name}. ` +
    `Precio: ${formatPrice(product.price)}. SKU: ${product.sku}`;

  const canonicalUrl = `${APP_URL}/${businessSlug}/product/${product.id}`;

  return {
    title,
    description,
    keywords: [
      product.name,
      product.sku,
      product.brand,
      business.name,
      'comprar',
      'precio',
    ].filter((k): k is string => typeof k === 'string'),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      locale: 'es_CO',
      url: canonicalUrl,
      siteName: business.name,
      title,
      description,
      images: product.image ? [
        {
          url: product.image,
          alt: product.name,
          width: 800,
          height: 600,
        },
      ] : undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// ═══════════════════════════════════════════════════════════
// STRUCTURED DATA (JSON-LD)
// ═══════════════════════════════════════════════════════════

interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

export function generateStructuredData(
  catalog: CatalogResponse,
  businessSlug: string
): StructuredData {
  const { business } = catalog;
  const products = catalog.products ?? [];
  const catalogUrl = `${APP_URL}/${businessSlug}`;

  // LocalBusiness o Store
  const businessData: StructuredData = {
    '@context': 'https://schema.org',
    '@type': business.industry?.toLowerCase().includes('restaurant') 
      ? 'Restaurant' 
      : 'Store',
    '@id': catalogUrl,
    name: business.name,
    description: business.description,
    url: catalogUrl,
    telephone: business.phone,
    image: business.logo || undefined,
    ...(business.openingHours && {
      openingHoursSpecification: Object.entries(business.openingHours).map(([day, hours]) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(day)],
        opens: hours.open,
        closes: hours.close,
      })),
    }),
  };

  // ItemList para productos
  const itemListData: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Catálogo de ${business.name}`,
    itemListElement: products.slice(0, 20).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: generateProductStructuredData(product, business, businessSlug),
    })),
  };

  // WebSite
  const websiteData: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: business.name,
    url: catalogUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${catalogUrl}?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  // Return combined
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@graph': [businessData, itemListData, websiteData],
  };
}

export function generateProductStructuredData(
  product: CatalogProduct,
  business: BusinessInfo,
  businessSlug: string
): StructuredData {
  const productUrl = `${APP_URL}/${businessSlug}/product/${product.id}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': productUrl,
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.image,
    brand: product.brand ? {
      '@type': 'Brand',
      name: product.brand,
    } : {
      '@type': 'Brand',
      name: business.name,
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'COP',
      availability: product.isAvailable && product.active 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: business.name,
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════
// SITEMAP
// ═══════════════════════════════════════════════════════════

export function generateCatalogSitemapEntry(
  businessSlug: string,
  catalog: CatalogResponse,
  lastModified: Date
) {
  const baseUrl = `${APP_URL}/${businessSlug}`;
  
  const entries = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    // Categorías
    ...catalog.categories.map((category) => ({
      url: `${baseUrl}?category=${category.id}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];

  return entries;
}

// ═══════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(price);
}

// ═══════════════════════════════════════════════════════════
// DIRECTORIO PÚBLICO
// ═══════════════════════════════════════════════════════════

export function generateDirectoryMetadata({
  title,
  description,
  path,
  index = true,
}: {
  title: string;
  description: string;
  /** Ruta canónica ("/", "/ciudad/madrid/hamburguesas"). */
  path: string;
  /** Las búsquedas libres no se indexan; las landings sí. */
  index?: boolean;
}): Metadata {
  const url = `${APP_URL}${path === '/' ? '' : path}`;
  return {
    // absolute: el directorio no lleva el sufijo "| ToGo" del template
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: index ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: 'website',
      locale: 'es_CO',
      url,
      siteName: 'TOGO',
      title,
      description,
    },
    twitter: { card: 'summary', title, description },
  };
}

/** JSON-LD ItemList de las landings: cada negocio enlaza a su catálogo. */
export function generateDirectoryStructuredData(items: DirectoryBusiness[], path: string, name: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: `${APP_URL}${path}`,
    numberOfItems: items.length,
    itemListElement: items.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${APP_URL}${b.path}`,
      name: b.name,
    })),
  };
}

/** Serializa JSON-LD para <script>, sin permitir que un nombre cierre la etiqueta. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
