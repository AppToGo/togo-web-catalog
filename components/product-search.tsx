'use client';

import { Search, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import type { Product } from '@/lib/types';

interface ProductSearchWithFilterProps {
  products: Product[];
  onFilter: (filtered: Product[]) => void;
  onSearch?: never;
  placeholder?: string;
}

interface ProductSearchWithCallbackProps {
  products?: never;
  onFilter?: never;
  onSearch: (query: string) => void;
  placeholder?: string;
}

type ProductSearchProps = ProductSearchWithFilterProps | ProductSearchWithCallbackProps;

export function ProductSearch({ products, onFilter, onSearch, placeholder = "Buscar productos..." }: ProductSearchProps) {
  const [value, setValue] = useState('');

  const filterProducts = useCallback((query: string) => {
    // Modo con products + onFilter
    if (products && onFilter) {
      if (!query.trim()) {
        onFilter(products);
        return;
      }
      
      const lowerQuery = query.toLowerCase();
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(lowerQuery) ||
        (product.description && product.description.toLowerCase().includes(lowerQuery))
      );
      onFilter(filtered);
    }
    // Modo con onSearch
    else if (onSearch) {
      onSearch(query);
    }
  }, [products, onFilter, onSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    filterProducts(newValue);
  };

  const handleClear = () => {
    setValue('');
    if (products && onFilter) {
      onFilter(products);
    } else if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-3 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-gray-200 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center hover:bg-gray-400 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      )}
    </div>
  );
}
