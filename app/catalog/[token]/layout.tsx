/**
 * Catalog Layout
 * 
 * Combina CartProvider (datos) y CartUIProvider (UI).
 * Separación permite que componentes solo de UI no se re-rendericen
 * cuando cambian los datos del carrito.
 */

import type { Metadata } from 'next';
import { CartProvider } from '@/components/client/cart-context';
import { CartUIProvider } from '@/components/client/cart-ui-context';

interface CatalogLayoutProps {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
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
  params 
}: CatalogLayoutProps) {
  const { token } = await params;

  return (
    <CartProvider token={token}>
      <CartUIProvider>
        {children}
      </CartUIProvider>
    </CartProvider>
  );
}
