"use client";

import { useMemo } from "react";
import { useSearchContext } from "./search-context";
import type { CatalogProduct } from "@/src/types/catalog.types";

interface IndustrySectionProps {
  catId: string;
  products: CatalogProduct[];
  children: React.ReactNode;
}

export function IndustrySection({
  catId,
  products,
  children,
}: IndustrySectionProps) {
  const { matches, isSearching } = useSearchContext();

  const hasMatches = useMemo(
    () => !isSearching || products.some(matches),
    [products, matches, isSearching],
  );

  if (!hasMatches) return null;

  return (
    <section
      data-cat-id={catId}
      id={`cat-${catId}`}
      className="scroll-mt-19.25"
    >
      {children}
    </section>
  );
}
