'use client';

import { useState, useMemo } from 'react';
import type { Product } from '@/lib/types';

interface ProductSearchProps {
  products: Product[];
  onFilter: (filteredProducts: Product[]) => void;
}

export function ProductSearch({ products, onFilter }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useMemo(() => {
    if (searchTerm.length >= 3) {
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
      onFilter(filtered);
      setIsSearching(true);
    } else {
      onFilter(products);
      setIsSearching(searchTerm.length > 0);
    }
  }, [searchTerm, products, onFilter]);

  const handleClear = () => {
    setSearchTerm('');
    onFilter(products);
    setIsSearching(false);
  };

  return (
    <div className="relative mb-4">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar productos..."
          className="w-full px-4 py-3 pl-11 pr-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
        />
        {/* Icono de búsqueda */}
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted-foreground)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* Botón limpiar */}
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-border)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Indicador de búsqueda activa */}
      {isSearching && searchTerm.length >= 3 && (
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          Mostrando resultados para &quot;{searchTerm}&quot;
        </p>
      )}
      {isSearching && searchTerm.length > 0 && searchTerm.length < 3 && (
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          Escribe al menos 3 caracteres para buscar
        </p>
      )}
    </div>
  );
}
