'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { debounce } from '@/lib/utils';
import { useSearchContext } from './search-context';

interface SearchInputProps {
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  placeholder = 'Buscar productos...',
  autoFocus = false,
}: SearchInputProps) {
  const { query, setQuery } = useSearchContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(query);

  const debouncedSetQuery = useRef(debounce((...args: unknown[]) => setQuery(args[0] as string), 300)).current;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '/') { e.preventDefault(); inputRef.current?.focus(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync local value when context query is cleared externally (e.g. closing the search panel)
  useEffect(() => {
    if (query === '') setLocalValue('');
  }, [query]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedSetQuery(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[--ink-3] pointer-events-none" />

      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 bg-(--bg) border-[1.5px] border-(--line) rounded-xl text-[14px] text-(--ink) outline-none transition-[border-color,background] placeholder:text-(--ink-3) focus:border-(--accent) focus:bg-(--surface)"
        autoComplete="off"
        enterKeyHint="search"
        autoFocus={autoFocus}
      />

      {localValue ? (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-(--line) flex items-center justify-center hover:bg-(--line-2) transition-colors"
          aria-label="Limpiar búsqueda"
        >
          <X className="w-3.5 h-3.5 text-(--ink-2)" />
        </button>
      ) : (
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center px-2 py-1 text-xs text-(--ink-3) bg-(--line) rounded">
          /
        </kbd>
      )}
    </div>
  );
}
