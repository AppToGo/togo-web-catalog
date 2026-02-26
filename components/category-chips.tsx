'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Category } from '@/lib/types';

interface CategoryChipsProps {
  categories: Category[];
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  primaryColor: string;
}

export function CategoryChips({ categories, selectedId, onSelect, primaryColor }: CategoryChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative py-4 bg-white border-b border-gray-100">
      {/* Botones de scroll */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>
      
      <button
        onClick={() => scroll('right')}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </button>

      {/* Chips container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-12 py-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Chip "Todos" */}
        <button
          onClick={() => onSelect(undefined)}
          className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
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
            onClick={() => onSelect(category.id)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              selectedId === category.id
                ? 'text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={selectedId === category.id ? { backgroundColor: primaryColor } : undefined}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
