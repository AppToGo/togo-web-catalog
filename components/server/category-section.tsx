import type { CatalogProduct } from '@/src/types/catalog.types';
import { ProductListClient } from '@/components/client/product-list-client';

interface CategorySectionProps {
  id: string;
  title?: string;
  count: number;
  products: CatalogProduct[];
  useProductImages: boolean;
}

export function CategorySection({ id, title, count, products, useProductImages }: CategorySectionProps) {
  return (
    <div className="pb-2">
      {title && (
        <div className="sticky top-[124px] z-20 bg-[var(--surface)] flex items-baseline gap-2 px-4 pt-3 pb-2 border-b border-[var(--line)]">
          <div
            className="text-[17px] font-bold text-[var(--ink)] tracking-[-0.03em] leading-[1.2]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </div>
          <span className="text-xs text-[var(--ink-3)] font-medium">{count} items</span>
        </div>
      )}
      <ProductListClient products={products} categoryId={id} useProductImages={useProductImages} />
    </div>
  );
}
