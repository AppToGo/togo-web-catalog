/**
 * CategoryChips - Client Component
 * 
 * Chips de categorías con scroll horizontal.
 * 
 * OPTIMIZACIONES:
 * - Navegación via URL (server-side)
 * - Scroll snap en mobile
 * - Prefetching de categorías
 */

'use client';

import { useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Category } from '@/lib/types';

interface CategoryChipsProps {
  categories: Category[];
  selectedId?: string;
  primaryColor: string;
}

export function CategoryChips({
  categories,
  selectedId,
  primaryColor,
}: CategoryChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -200 : 200,
        behavior: 'smooth',
      });
    }
  };

  const handleSelect = (categoryId?: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (categoryId) {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    params.delete('page'); // Reset page
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.push(newUrl, { scroll: false });
  };

  return (
    <div className="relative py-4 bg-white border-b border-gray-100">
      {/* Botones de scroll */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
        aria-label="Scroll izquierda"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>

      <button
        onClick={() => scroll('right')}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
        aria-label="Scroll derecha"
      >
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </button>

      {/* Chips container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-12 py-2 scroll-smooth snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Chip "Todos" */}
        <button
          onClick={() => handleSelect(undefined)}
          className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap snap-start ${
            !selectedId
              ? 'text-white shadow-lg scale-105'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={!selectedId ? { backgroundColor: primaryColor } : undefined}
        >
          Todos
        </button>

        {/* Chips de categorías */}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleSelect(category.id)}
            className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap snap-start ${
              selectedId === category.id
                ? 'text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={
              selectedId === category.id
                ? { backgroundColor: primaryColor }
                : undefined
            }
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
