'use client';

/**
 * CategoryChips - Client Component
 *
 * NOTE: This component is kept for backward compatibility.
 * The new tab design is handled by CatalogShell + catalog-shell.tsx.
 * This file now re-exports a no-op or simple wrapper so existing
 * imports don't break during the transition.
 */

import type { Category } from '@/src/types/catalog.types';

interface CategoryChipsProps {
  categories: Category[];
  selectedId?: string;
  primaryColor?: string;
}

// Legacy no-op wrapper — tabs are now rendered by CatalogShell
export function CategoryChips({ categories }: CategoryChipsProps) {
  if (categories.length === 0) return null;
  return null;
}
