/**
 * Catalog Layout - [businessSlug]
 * 
 * Layout para catálogos públicos por slug del negocio.
 */

import type { Metadata } from 'next';

interface CatalogLayoutProps {
  children: React.ReactNode;
  params: Promise<{ businessSlug: string }>;
}

export async function generateMetadata({ params }: CatalogLayoutProps): Promise<Metadata> {
  return {
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function CatalogLayout({ 
  children, 
}: CatalogLayoutProps) {
  // El CartProvider ahora está en page.tsx para tener acceso a los datos del catálogo
  return <>{children}</>;
}
