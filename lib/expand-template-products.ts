import type { CatalogProduct } from '@/src/types/catalog.types';

/**
 * Expands global template products (isFromTemplate === true) with more than one
 * variant into individual virtual rows — one per variant. Products that are not
 * from a template, have no variants, or have exactly one variant are returned as-is.
 *
 * The function is idempotent: a virtual row already has variants.length === 1,
 * so it will never be split again.
 */
export function expandTemplateProducts(products: CatalogProduct[]): CatalogProduct[] {
  const result: CatalogProduct[] = [];

  for (const product of products) {
    const variants = product.variants ?? [];

    // Templates with 0 variants are inconsistent backend data; include them
    // as-is so they remain visible rather than silently disappearing.
    if (!product.isFromTemplate || variants.length <= 1) {
      result.push(product);
      continue;
    }

    for (const variant of variants) {
      const virtualRow: CatalogProduct = {
        ...product,
        name: `${product.name} - ${variant.label}`,
        price: variant.price,
        isAvailable: product.isAvailable && variant.isAvailable,
        variants: [variant],
        priceFrom: undefined,
        priceTo: undefined,
      };

      result.push(virtualRow);
    }
  }

  return result;
}

/**
 * Returns a stable, unique row key for a CatalogProduct.
 * For virtual rows (expanded template products) the variant id is appended so
 * each row gets its own React key, even though all share the same product id.
 * Regular products have a unique id and do not need a suffix.
 */
export function getProductRowKey(product: CatalogProduct): string {
  // Virtual rows (expanded template products) share product.id; the variant id
  // disambiguates them. Regular products have a unique id.
  if (product.isFromTemplate && product.variants?.length === 1) {
    return `${product.id}:${product.variants[0].id}`;
  }
  return product.id;
}
