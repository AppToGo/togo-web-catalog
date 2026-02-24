/**
 * Catalog Header
 * Server Component - HTML plano + Tailwind
 */

import type { CartItem } from '@/lib/types';

interface CatalogHeaderProps {
  businessName: string;
  cartItemCount: number;
}

export function CatalogHeader({ businessName, cartItemCount }: CatalogHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[var(--color-background)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-lg">
              🍽️
            </div>
            <h1 className="font-bold text-[var(--color-foreground)] truncate max-w-[150px] sm:max-w-xs">
              {businessName}
            </h1>
          </div>

          {/* Carrito */}
          <a
            href="#cart"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-sm font-medium text-[var(--color-foreground)]">
              {cartItemCount > 0 ? `${cartItemCount} items` : 'Carrito'}
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}
