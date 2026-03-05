/**
 * SearchInput - Client Component
 * 
 * Input de búsqueda con sincronización de URL.
 * Usa navegación server-side para búsquedas (mejor SEO).
 * 
 * OPTIMIZACIONES:
 * - Debounce para no saturar el servidor
 * - Navegación suave (shallow routing cuando aplica)
 * - Autofocus en mobile
 * - Keyboard shortcuts (/ para buscar)
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { debounce } from '@/lib/utils';

interface SearchInputProps {
  initialValue?: string;
  placeholder?: string;
}

export function SearchInput({ 
  initialValue = '',
  placeholder = "Buscar productos..."
}: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [value, setValue] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);

  // Sincronizar con URL
  useEffect(() => {
    const search = searchParams.get('search') || '';
    if (search !== value) {
      setValue(search);
    }
  }, [searchParams]);

  // Keyboard shortcut: / para buscar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si estamos en un input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Navegación con debounce
  const navigateToSearch = useCallback(
    debounce((query: unknown) => {
      const searchQuery = query as string;
      const params = new URLSearchParams(searchParams);
      
      if (searchQuery.length >= 2) {
        params.set('search', searchQuery);
        params.delete('page'); // Reset page on new search
      } else {
        params.delete('search');
      }

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      router.push(newUrl, { scroll: false });
      setIsSearching(false);
    }, 300),
    [searchParams, router]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setIsSearching(true);
    navigateToSearch(newValue);
  };

  const handleClear = () => {
    setValue('');
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <Search 
        className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
          isSearching ? 'text-gray-400 animate-pulse' : 'text-gray-400'
        }`} 
      />
      
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-3 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-gray-200 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
        autoComplete="off"
        enterKeyHint="search"
      />
      
      {value ? (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center hover:bg-gray-400 transition-colors"
          aria-label="Limpiar búsqueda"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      ) : (
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-gray-400 bg-gray-200 rounded">
          /
        </kbd>
      )}
    </div>
  );
}
