"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { FeaturedCarousel } from "./featured-carousel";
import { useSearchContext } from "./search-context";
import type { Category, CatalogProduct } from "@/src/types/catalog.types";

interface CategoryProductGroup {
  categoryId: string;
  products: CatalogProduct[];
}

interface CatalogShellProps {
  categories: Category[];
  categoryProductGroups: CategoryProductGroup[];
  /** Destacados de la sede, ya con imagen; vacío oculta el carrusel */
  featured: CatalogProduct[];
  /** Columna derecha en escritorio (el carrito) */
  aside?: React.ReactNode;
  children: React.ReactNode;
}

function SearchEmptyState() {
  return (
    <div className="text-center py-16 px-4 text-[var(--ink-3)]">
      <div className="text-[48px] mb-3">🔍</div>
      <div
        className="text-[17px] font-bold text-[var(--ink)] mb-[6px] tracking-[-0.02em]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        No se encontraron productos
      </div>
      <div className="text-[14px]">
        Intenta con otros términos de búsqueda o categorías
      </div>
    </div>
  );
}

export function CatalogShell({
  categories,
  categoryProductGroups,
  featured,
  aside,
  children,
}: CatalogShellProps) {
  const [activeId, setActiveId] = useState<string>(categories[0]?.id ?? "");
  const tabsRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isScrollingToRef = useRef(false);
  const { matches, isSearching } = useSearchContext();

  const visibleCategories = useMemo(() => {
    if (!isSearching) return categories;
    const matchingIds = new Set(
      categoryProductGroups
        .filter(({ products }) => products.some(matches))
        .map(({ categoryId }) => categoryId),
    );
    return categories.filter((cat) => matchingIds.has(cat.id));
  }, [categories, categoryProductGroups, matches, isSearching]);

  // Reset activeId when the current active category is no longer visible
  useEffect(() => {
    if (
      isSearching &&
      visibleCategories.length > 0 &&
      !visibleCategories.find((c) => c.id === activeId)
    ) {
      setActiveId(visibleCategories[0].id);
    }
  }, [visibleCategories, isSearching, activeId]);

  useEffect(() => {
    if (categories.length === 0) return;
    const sectionMap = new Map<string, number>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (isScrollingToRef.current) return;
        entries.forEach((entry) => {
          const catId = entry.target.getAttribute("data-cat-id");
          if (!catId) return;
          sectionMap.set(catId, entry.intersectionRatio);
        });
        let bestId = "";
        let bestRatio = -1;
        sectionMap.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        });
        if (bestId) setActiveId(bestId);
      },
      { threshold: [0, 0.1, 0.25, 0.5], rootMargin: "-60px 0px -40% 0px" },
    );

    const sections = document.querySelectorAll("section[data-cat-id]");
    sections.forEach((el) => observerRef.current?.observe(el));
    return () => {
      observerRef.current?.disconnect();
    };
  }, [categories]);

  useEffect(() => {
    if (!tabsRef.current) return;
    const activeTab = tabsRef.current.querySelector(
      `[data-tab-id="${activeId}"]`,
    ) as HTMLElement;
    if (activeTab)
      activeTab.scrollIntoView({
        inline: "nearest",
        behavior: "smooth",
        block: "nearest",
      });
  }, [activeId]);

  const handleTabClick = useCallback((catId: string) => {
    setActiveId(catId);
    const section = document.getElementById(`cat-${catId}`);
    if (!section) return;
    isScrollingToRef.current = true;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      isScrollingToRef.current = false;
    }, 800);
  }, []);

  const productCounts = useMemo(
    () =>
      new Map(
        categoryProductGroups.map(({ categoryId, products }) => [
          categoryId,
          isSearching ? products.filter(matches).length : products.length,
        ]),
      ),
    [categoryProductGroups, matches, isSearching],
  );

  return (
    // Escritorio: categorías | productos | carrito. Solo la columna de
    // productos hace scroll; en móvil todo es un bloque y scrollea la página.
    <div className="lg:flex-1 lg:min-h-0 lg:flex lg:gap-7 lg:w-full lg:max-w-352 lg:mx-auto lg:px-6">
      {visibleCategories.length > 0 && (
        <nav
          aria-label="Categorías"
          className="hidden lg:flex flex-col flex-none w-52.5 py-6 gap-0.5 overflow-y-auto"
        >
          <div className="px-3 pb-2.5 text-xs font-semibold uppercase tracking-[0.04em] text-(--ink-2)">
            Categorías
          </div>
          {visibleCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleTabClick(cat.id)}
              aria-current={activeId === cat.id}
              className={`flex items-center justify-between gap-2 min-h-10 px-3 rounded-[10px] text-left text-[14px] cursor-pointer transition-colors ${
                activeId === cat.id
                  ? "bg-(--accent-soft) text-(--accent) font-semibold"
                  : "text-(--ink) hover:bg-(--line)"
              }`}
            >
              <span className="truncate">{cat.name}</span>
              <span className="text-xs text-(--ink-2) font-normal">
                {productCounts.get(cat.id) ?? 0}
              </span>
            </button>
          ))}
        </nav>
      )}

      {visibleCategories.length > 0 && (
        <div className="sticky top-19.25 z-30 bg-(--surface) border-b border-(--line) lg:hidden">
          <div
            ref={tabsRef}
            className="flex gap-1 overflow-x-auto px-3 py-2 scrollbar-hide"
            style={{ scrollbarWidth: "none" } as React.CSSProperties}
          >
            {visibleCategories.map((cat) => (
              <button
                key={cat.id}
                data-tab-id={cat.id}
                onClick={() => handleTabClick(cat.id)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium border-[1.5px] border-transparent cursor-pointer transition-all whitespace-nowrap leading-[1.4] ${
                  activeId === cat.id
                    ? "bg-(--accent-2) text-(--accent-2-ink) font-semibold"
                    : "text-(--ink-2) hover:bg-(--accent) hover:text-(--accent-ink)"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="lg:flex-1 lg:min-w-0 lg:overflow-y-auto lg:py-6 lg:px-1">
        <FeaturedCarousel products={featured} />
        {isSearching && visibleCategories.length === 0 ? (
          <SearchEmptyState />
        ) : (
          children
        )}
      </main>

      {aside}
    </div>
  );
}
