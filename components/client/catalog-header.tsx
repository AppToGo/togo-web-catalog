'use client';

import { useState } from 'react';
import { Search, ArrowLeft, X } from 'lucide-react';
import { SearchInput } from '@/components/client/search-input';
import type { BusinessInfo } from '@/src/types/catalog.types';

interface CatalogHeaderProps {
  business: BusinessInfo;
  businessSlug: string;
}

export function CatalogHeader({ business }: CatalogHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const words = business.name.split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <div className="sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--line)] px-4 pt-4 pb-3">
      {isSearchOpen ? (
        <div className="flex items-center gap-3 h-12">
          <button
            onClick={() => setIsSearchOpen(false)}
            className="shrink-0 w-9 h-9 rounded-full bg-[var(--bg)] border border-[var(--line)] flex items-center justify-center text-[var(--ink-2)] hover:bg-[var(--line)] transition-colors"
            aria-label="Cerrar búsqueda"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <SearchInput placeholder="¿Qué estás buscando?" autoFocus />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 h-12">
          <div
            className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 font-bold text-[18px] tracking-[-0.02em]"
            style={{ background: 'var(--accent)', color: 'var(--accent-ink)', fontFamily: 'var(--font-display)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="font-bold text-[18px] text-[var(--ink)] truncate leading-[1.2] tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {business.name}
            </div>
            <div className="flex items-center gap-[5px] text-xs text-[var(--ink-3)] mt-0.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 animate-[pulse-dot_2s_ease-in-out_infinite]" />
              {business.description || 'Catálogo disponible'}
            </div>
          </div>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="shrink-0 w-9 h-9 rounded-full bg-[var(--bg)] border border-[var(--line)] flex items-center justify-center text-[var(--ink-2)] hover:bg-[var(--line)] transition-colors"
            aria-label="Buscar productos"
          >
            <Search size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
