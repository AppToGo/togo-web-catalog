'use client';

import { CatalogHeader } from './catalog-header';
import { useCart } from './cart-provider';

export function CatalogHeaderClient() {
  const { itemCount } = useCart();
  return (
    <CatalogHeader
      businessName="Tu Negocio"
      cartItemCount={itemCount}
    />
  );
}
