/**
 * Category List
 * Server Component - filtros como links
 */

import type { Category } from '@/lib/types';

interface CategoryListProps {
  categories: Category[];
  selectedId?: string;
  token: string;
}

export function CategoryList({ categories, selectedId, token }: CategoryListProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {/* Todos */}
      <a
        href={`/catalog/${token}`}
        className={`
          flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
          transition-colors
          ${!selectedId 
            ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' 
            : 'bg-[var(--color-card)] text-[var(--color-foreground)] border border-[var(--color-border)] hover:border-[var(--color-primary)]'
          }
        `}
      >
        Todos
      </a>

      {/* Categorías */}
      {categories.map((category) => (
        <a
          key={category.id}
          href={`/catalog/${token}?category=${category.id}`}
          className={`
            flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
            transition-colors
            ${selectedId === category.id
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
              : 'bg-[var(--color-card)] text-[var(--color-foreground)] border border-[var(--color-border)] hover:border-[var(--color-primary)]'
            }
          `}
        >
          {category.name}
        </a>
      ))}
    </div>
  );
}
