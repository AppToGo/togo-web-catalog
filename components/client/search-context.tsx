'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { CatalogProduct } from '@/src/types/catalog.types';
import { matchesQuery, SEARCH_MIN_LENGTH } from '@/lib/utils';

interface SearchContextValue {
  query: string;
  setQuery: (q: string) => void;
  matches: (product: CatalogProduct) => boolean;
  isSearching: boolean;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children, initialQuery = '' }: { children: React.ReactNode; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);

  const normalizedQuery = useMemo(
    () => query.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''),
    [query],
  );

  const matches = useMemo(
    () => (product: CatalogProduct) => matchesQuery(product, normalizedQuery),
    [normalizedQuery],
  );

  return (
    <SearchContext.Provider value={{ query, setQuery, matches, isSearching: normalizedQuery.length >= SEARCH_MIN_LENGTH }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearchContext must be used within SearchProvider');
  return ctx;
}
