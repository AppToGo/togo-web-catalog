import type {
  CatalogResponse,
  CatalogProduct,
  Category,
  SubCategory,
} from "@/src/types/catalog.types";
import { CatalogHeader } from "@/components/client/catalog-header";
import { CategorySection } from "@/components/client/category-section";
import { IndustrySection } from "@/components/client/industry-section";
import { CatalogShell } from "@/components/client/catalog-shell";
import { SearchProvider } from "@/components/client/search-context";
import type { HighlightItem } from "@/components/client/highlights-rail";

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
    const knownSubCatIds = new Set(subCategories.map((sc) => sc.id));

    const bySubCat = new Map<string, CatalogProduct[]>();
    const otrosProducts: CatalogProduct[] = [];

    for (const p of products) {
      if (p.categoryId && knownSubCatIds.has(p.categoryId)) {
        const arr = bySubCat.get(p.categoryId) ?? [];
        arr.push(p);
        bySubCat.set(p.categoryId, arr);
      } else {
        otrosProducts.push(p);
      }
    }

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
        .map((sc) => ({
          id: sc.id,
          name: sc.name,
          products: bySubCat.get(sc.id) ?? [],
        }))
        .filter((g) => g.products.length > 0);

      if (subGroups.length > 0) groups.push({ id: cat.id, subGroups });
    }

    if (otrosProducts.length > 0) {
      groups.push({
        id: "uncategorized",
        subGroups: [
          { id: "otros", name: "Otros productos", products: otrosProducts },
        ],
      });
    }

    return groups;
  }

  const byIndustryCat = new Map<string, CatalogProduct[]>();
  for (const p of products) {
    const key = p.industryCategoryId ?? p.categoryId ?? "uncategorized";
    const arr = byIndustryCat.get(key) ?? [];
    arr.push(p);
    byIndustryCat.set(key, arr);
  }

  const groups: CatalogGroup[] = categories
    .map((cat) => ({
      id: cat.id,
      subGroups: [
        {
          id: cat.id,
          name: cat.name,
          products: byIndustryCat.get(cat.id) ?? [],
        },
      ],
    }))
    .filter((g) => g.subGroups[0].products.length > 0);

  const uncategorized = byIndustryCat.get("uncategorized") ?? [];
  if (uncategorized.length > 0) {
    groups.push({
      id: "uncategorized",
      subGroups: [
        {
          id: "uncategorized",
          name: "Otros productos",
          products: uncategorized,
        },
      ],
    });
  }

  return groups;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CatalogContent({ catalog, businessSlug }: CatalogContentProps) {
  const { business, categories, products, subCategories } = catalog;

  const catalogGroups = buildCatalogGroups(products, categories, subCategories);
  const useProductImages = catalog.business.useProductImages ?? false;

  const activeCatIds = new Set(catalogGroups.map((g) => g.id));
  const tabCategories = categories.filter((cat) => activeCatIds.has(cat.id));

  const categoryProductGroups = catalogGroups.map((g) => ({
    categoryId: g.id,
    products: g.subGroups.flatMap((sg) => sg.products),
  }));

  const highlights = (
    catalog as CatalogResponse & { highlights?: HighlightItem[] }
  ).highlights;

  return (
    <SearchProvider>
      <div
        style={
          {
            minHeight: "100dvh",
            background: "var(--bg)",
            paddingBottom: 96,
          } as React.CSSProperties
        }
      >
        <CatalogHeader business={business} />

        <CatalogShell
          categories={tabCategories}
          categoryProductGroups={categoryProductGroups}
          highlights={highlights}
        >
          {catalogGroups.map(({ id: industryCatId, subGroups }) => (
            <IndustrySection
              key={industryCatId}
              catId={industryCatId}
              products={subGroups.flatMap((sg) => sg.products)}
            >
              {subGroups.map(
                ({ id: subGroupId, name, products: groupProducts }) => (
                  <CategorySection
                    key={subGroupId}
                    id={subGroupId}
                    title={name}
                    products={groupProducts}
                    useProductImages={useProductImages}
                  />
                ),
              )}
            </IndustrySection>
          ))}
        </CatalogShell>
      </div>
    </SearchProvider>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

export function CatalogContentSkeleton() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg)",
        paddingBottom: 96,
      }}
    >
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
