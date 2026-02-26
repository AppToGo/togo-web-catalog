/**
 * Catalog Layout
 * 
 * Este layout envuelve todas las páginas del catálogo y persiste
 * el estado del carrito entre navegaciones de categorías.
 */

import { CartProvider } from "@/components/cart-context";

interface CatalogLayoutProps {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}

export default async function CatalogLayout({ 
  children, 
  params 
}: CatalogLayoutProps) {
  const { token } = await params;

  return (
    <CartProvider token={token}>
      {children}
    </CartProvider>
  );
}
