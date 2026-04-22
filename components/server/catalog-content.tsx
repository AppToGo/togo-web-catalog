import type { CatalogResponse, CatalogProduct, Category, SubCategory } from '@/src/types/catalog.types';
import { CatalogHeader } from '@/components/client/catalog-header';
import { CategorySection } from '@/components/server/category-section';
import { CatalogShell } from '@/components/client/catalog-shell';
import type { HighlightItem } from '@/components/client/highlights-rail';

interface CatalogContentProps {
  catalog: CatalogResponse;
  businessSlug: string;
}

// ─── Two-level catalog grouping ───────────────────────────────────────────────
//
// Level 1 (tabs + scroll-spy anchor): IndustryCategory  → catalog.categories
// Level 2 (sticky section headers):   SubCategory       → catalog.subCategories
//
// Fallback (no subCategories): single level using IndustryCategory as header.

interface SubGroup {
  id: string;
  name?: string;
  products: CatalogProduct[];
}

interface CatalogGroup {
  id: string;
  subGroups: SubGroup[];
}

function buildCatalogGroups(
  products: CatalogProduct[],
  categories: Category[],
  subCategories?: SubCategory[],
): CatalogGroup[] {
  const hasSubCats = subCategories && subCategories.length > 0;

  if (hasSubCats) {
    // Index known SubCategory IDs for O(1) lookup
    const knownSubCatIds = new Set(subCategories.map(sc => sc.id));

    // Group products: those with a known categoryId → bySubCat, rest → otros
    const bySubCat = new Map<string, CatalogProduct[]>();
    const otrosProducts: CatalogProduct[] = [];

    for (const p of products) {
      if (p.categoryId && knownSubCatIds.has(p.categoryId)) {
        const arr = bySubCat.get(p.categoryId) ?? [];
        arr.push(p);
        bySubCat.set(p.categoryId, arr);
      } else {
        // No categoryId, or categoryId doesn't match any SubCategory → Otros
        otrosProducts.push(p);
      }
    }

    // Map: industryCatId → sorted SubCategories
    const subCatsByParent = new Map<string, SubCategory[]>();
    for (const sc of subCategories) {
      const arr = subCatsByParent.get(sc.industryCategoryId) ?? [];
      arr.push(sc);
      subCatsByParent.set(sc.industryCategoryId, arr);
    }

    const groups: CatalogGroup[] = [];

    for (const cat of categories) {
      const subCats = (subCatsByParent.get(cat.id) ?? []).sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );

      const subGroups: SubGroup[] = subCats
        .map(sc => ({ id: sc.id, name: sc.name, products: bySubCat.get(sc.id) ?? [] }))
        .filter(g => g.products.length > 0);

      if (subGroups.length > 0) groups.push({ id: cat.id, subGroups });
    }

    // "Otros productos" — all products without a valid subcategory assignment
    if (otrosProducts.length > 0) {
      groups.push({
        id: 'uncategorized',
        subGroups: [{ id: 'otros', name: 'Otros productos', products: otrosProducts }],
      });
    }

    return groups;
  }

  // ── Fallback: no SubCategories — group by IndustryCategory ──────────────────
  const byIndustryCat = new Map<string, CatalogProduct[]>();
  for (const p of products) {
    const key = p.industryCategoryId ?? p.categoryId ?? 'uncategorized';
    const arr = byIndustryCat.get(key) ?? [];
    arr.push(p);
    byIndustryCat.set(key, arr);
  }

  const groups: CatalogGroup[] = categories
    .map(cat => ({
      id: cat.id,
      subGroups: [{ id: cat.id, name: cat.name, products: byIndustryCat.get(cat.id) ?? [] }],
    }))
    .filter(g => g.subGroups[0].products.length > 0);

  const uncategorized = byIndustryCat.get('uncategorized') ?? [];
  if (uncategorized.length > 0) {
    groups.push({
      id: 'uncategorized',
      subGroups: [{ id: 'uncategorized', name: 'Otros productos', products: uncategorized }],
    });
  }

  return groups;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function NoProductsFound() {
  return (
    <div className="text-center py-16 px-4 text-[var(--ink-3)]">
      <div className="text-[48px] mb-3">🔍</div>
      <div
        className="text-[17px] font-bold text-[var(--ink)] mb-[6px] tracking-[-0.02em]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        No se encontraron productos
      </div>
      <div className="text-[14px]">Intenta con otros términos de búsqueda o categorías</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CatalogContent({ catalog, businessSlug }: CatalogContentProps) {
  const { business, categories, products, subCategories } = catalog;

  const catalogGroups = buildCatalogGroups(products, categories, subCategories);
  const useProductImages = catalog.business.useProductImages ?? false;

  // Only show tabs for IndustryCategorys that have at least one product
  const activeCatIds = new Set(catalogGroups.map(g => g.id));
  const tabCategories = categories.filter(cat => activeCatIds.has(cat.id));

  const highlights = (
    catalog as CatalogResponse & { highlights?: HighlightItem[] }
  ).highlights;

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        paddingBottom: 96,
      } as React.CSSProperties}
    >
      <CatalogHeader business={business} businessSlug={businessSlug} />

      <CatalogShell categories={tabCategories} highlights={highlights}>
        {products.length === 0 ? (
          <NoProductsFound />
        ) : (
          <>
            {catalogGroups.map(({ id: industryCatId, subGroups }) => (
              <section
                key={industryCatId}
                data-cat-id={industryCatId}
                id={`cat-${industryCatId}`}
                className="scroll-mt-[77px]"
              >
                {subGroups.map(({ id: subGroupId, name, products: groupProducts }) => (
                  <CategorySection
                    key={subGroupId}
                    id={subGroupId}
                    title={name}
                    count={groupProducts.length}
                    products={groupProducts}
                    useProductImages={useProductImages}
                  />
                ))}
              </section>
            ))}
          </>
        )}
      </CatalogShell>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

export function CatalogContentSkeleton() {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 96 }}>
      <div className="bg-[var(--surface)] border-b border-[var(--line)] px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[14px] bg-[var(--line)] animate-pulse" />
          <div className="flex-1">
            <div className="h-[18px] w-[140px] bg-[var(--line)] rounded-[6px] mb-[6px] animate-pulse" />
            <div className="h-3 w-[100px] bg-[var(--line)] rounded-[4px] animate-pulse" />
          </div>
        </div>
      </div>

      <div>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="grid grid-cols-[56px_1fr] gap-3 px-4 py-3 border-b border-[var(--line)]"
          >
            <div className="w-[52px] h-[52px] rounded-lg bg-[var(--line)] animate-pulse" />
            <div>
              <div className="h-[14px] w-[60%] bg-[var(--line)] rounded-[4px] mb-[6px] animate-pulse" />
              <div className="h-3 w-[80%] bg-[var(--line)] rounded-[4px] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
