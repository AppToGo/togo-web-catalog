import type { CatalogProduct } from "@/src/types/catalog.types";

/**
 * Lo que necesita la hoja "Va muy bien con": los productos que tienen
 * recomendados y los recomendados mismos. Solo esos viajan al cliente, no
 * el catálogo entero.
 */
export function productsForRecommendations(
  products: CatalogProduct[] | undefined,
): CatalogProduct[] {
  if (!products) return [];
  const needed = new Set<string>();
  for (const product of products) {
    if (!product.recommendedProductIds?.length) continue;
    needed.add(product.id);
    product.recommendedProductIds.forEach((id) => needed.add(id));
  }
  return products.filter((p) => needed.has(p.id));
}
