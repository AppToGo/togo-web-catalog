'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { HighlightsRail, type HighlightItem } from './highlights-rail';
import type { Category } from '@/src/types/catalog.types';

interface CatalogShellProps {
  categories: Category[];
  highlights?: HighlightItem[];
  children: React.ReactNode;
}

export function CatalogShell({ categories, highlights, children }: CatalogShellProps) {
  const [activeId, setActiveId] = useState<string>(categories[0]?.id ?? '');
  const tabsRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isScrollingToRef = useRef(false);

  useEffect(() => {
    if (categories.length === 0) return;
    const sectionMap = new Map<string, number>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (isScrollingToRef.current) return;
        entries.forEach((entry) => {
          const catId = entry.target.getAttribute('data-cat-id');
          if (!catId) return;
          sectionMap.set(catId, entry.intersectionRatio);
        });
        let bestId = '';
        let bestRatio = -1;
        sectionMap.forEach((ratio, id) => {
          if (ratio > bestRatio) { bestRatio = ratio; bestId = id; }
        });
        if (bestId) setActiveId(bestId);
      },
      { threshold: [0, 0.1, 0.25, 0.5], rootMargin: '-60px 0px -40% 0px' }
    );

    const sections = document.querySelectorAll('section[data-cat-id]');
    sections.forEach((el) => observerRef.current?.observe(el));
    return () => { observerRef.current?.disconnect(); };
  }, [categories]);

  useEffect(() => {
    if (!tabsRef.current) return;
    const activeTab = tabsRef.current.querySelector(`[data-tab-id="${activeId}"]`) as HTMLElement;
    if (activeTab) activeTab.scrollIntoView({ inline: 'nearest', behavior: 'smooth', block: 'nearest' });
  }, [activeId]);

  const handleTabClick = useCallback((catId: string) => {
    setActiveId(catId);
    const section = document.getElementById(`cat-${catId}`);
    if (!section) return;
    isScrollingToRef.current = true;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { isScrollingToRef.current = false; }, 800);
  }, []);

  return (
    <>
      {categories.length > 0 && (
        <div className="sticky top-[77px] z-30 bg-[var(--surface)] border-b border-[var(--line)]">
          <div
            ref={tabsRef}
            className="flex gap-1 overflow-x-auto px-3 py-2 scrollbar-hide"
            style={{ scrollbarWidth: 'none' } as React.CSSProperties}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                data-tab-id={cat.id}
                onClick={() => handleTabClick(cat.id)}
                className={`shrink-0 px-4 py-[6px] rounded-full text-[13px] font-medium border-[1.5px] border-transparent cursor-pointer transition-all whitespace-nowrap leading-[1.4] ${
                  activeId === cat.id
                    ? 'bg-[var(--accent-2)] text-[var(--accent)] font-semibold'
                    : 'text-[var(--ink-2)] hover:bg-[var(--accent-2-softer)] hover:text-[var(--accent-2)]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <HighlightsRail highlights={highlights} />
      {children}
    </>
  );
}
