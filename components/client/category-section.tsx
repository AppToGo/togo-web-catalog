"use client";

import { useMemo } from "react";
import { useSearchContext } from "./search-context";
import { ProductListClient } from "./product-list-client";
import type { CatalogProduct } from "@/src/types/catalog.types";

interface CategorySectionProps {
  id: string;
  title?: string;
  products: CatalogProduct[];
  useProductImages: boolean;
}

export function CategorySection({
  id,
  title,
  products,
  useProductImages,
}: CategorySectionProps) {
  const { matches, isSearching } = useSearchContext();

  const filteredProducts = useMemo(
    () => (isSearching ? products.filter(matches) : products),
    [products, matches, isSearching],
  );

  if (filteredProducts.length === 0) return null;

  return (
    <div className="pb-2">
      {title && (
        <div className="sticky top-31 z-20 bg-(--surface) flex items-baseline gap-2 px-4 pt-3 pb-2 border-b border-[var(--line)]">
          <div
            className="text-[17px] font-bold text-(--ink) tracking-[-0.03em] leading-[1.2]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </div>
          <span className="text-xs text-(--ink-3) font-medium">
            {filteredProducts.length} items
          </span>
        </div>
      )}
      <ProductListClient
        products={filteredProducts}
        categoryId={id}
        useProductImages={useProductImages}
      />
    </div>
  );
}
