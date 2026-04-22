'use client';

import { useState } from 'react';
import { ProductRow } from './product-row';
import type { CatalogProduct } from '@/src/types/catalog.types';

interface ProductListClientProps {
  products: CatalogProduct[];
  categoryId: string;
  useProductImages: boolean;
}

export function ProductListClient({ products, categoryId, useProductImages }: ProductListClientProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (productId: string) => {
    setExpandedId((prev) => (prev === productId ? null : productId));
  };

  return (
    <div className="flex flex-col">
      {products.map((product) => (
        <ProductRow
          key={product.id}
          product={product}
          subcatId={categoryId}
          isExpanded={expandedId === product.id}
          onToggle={() => handleToggle(product.id)}
          useProductImages={useProductImages}
        />
      ))}
    </div>
  );
}
