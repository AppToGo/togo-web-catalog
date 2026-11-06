'use client';

/**
 * Abre un producto que llega por enlace (`?producto={id}`), como los platos
 * destacados del directorio. Se abre una sola vez: el param se quita de la
 * URL para que no vuelva a aparecer al cerrar o recargar. Si el producto no
 * está en el catálogo, no pasa nada.
 */

import { useEffect } from 'react';
import { useCartUI } from './cart-ui-context';
import type { CatalogProduct } from '@/src/types/catalog.types';

const PRODUCT_PARAM = 'producto';
/** Ids de producto: cuid o uuid. */
const PRODUCT_ID = /^[A-Za-z0-9-]{20,40}$/;

export function ProductDeepLink({ products }: { products: CatalogProduct[] }) {
  const { selectProduct } = useCartUI();

  useEffect(() => {
    const url = new URL(window.location.href);
    const id = url.searchParams.get(PRODUCT_PARAM);
    if (!id) return;
    url.searchParams.delete(PRODUCT_PARAM);
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    if (!PRODUCT_ID.test(id)) return;
    const product = products.find((p) => p.id === id);
    if (product) selectProduct(product);
    // Solo al entrar: el catálogo no cambia de productos sin navegar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
