'use client';

import { ProductRow } from './product-row';
import type { CatalogProduct } from '@/src/types/catalog.types';
import { getProductRowKey } from '@/lib/expand-template-products';

interface ProductListClientProps {
  products: CatalogProduct[];
  categoryId: string;
  useProductImages: boolean;
}

export function ProductListClient({ products, categoryId, useProductImages }: ProductListClientProps) {
  return (
    <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-3.5">
      {products.map((product) => (
        <ProductRow
          key={getProductRowKey(product)}
          product={product}
          subcatId={categoryId}
          useProductImages={useProductImages}
        />
      ))}
    </div>
  );
}
