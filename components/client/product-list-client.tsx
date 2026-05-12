'use client';

import { useState, useEffect } from 'react';
import { ProductRow } from './product-row';
import type { CatalogProduct } from '@/src/types/catalog.types';
import { getProductRowKey } from '@/lib/expand-template-products';

interface ProductListClientProps {
  products: CatalogProduct[];
  categoryId: string;
  useProductImages: boolean;
}

export function ProductListClient({ products, categoryId, useProductImages }: ProductListClientProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Reset on category change, not on every array reference change (products
  // is a new array reference on each SSR render even when content is unchanged).
  useEffect(() => { setExpandedId(null); }, [categoryId]);

  const handleToggle = (rowKey: string) => {
    setExpandedId((prev) => (prev === rowKey ? null : rowKey));
  };

  return (
    <div className="flex flex-col">
      {products.map((product) => {
        const rowKey = getProductRowKey(product);
        return (
          <ProductRow
            key={rowKey}
            product={product}
            subcatId={categoryId}
            isExpanded={expandedId === rowKey}
            onToggle={() => handleToggle(rowKey)}
            useProductImages={useProductImages}
          />
        );
      })}
    </div>
  );
}
