'use client';

import { useEffect } from 'react';
import { formatPrice } from '@/lib/utils';
import type { CatalogVariant } from '@/src/types/catalog.types';

interface VariantSelectorProps {
  variants: CatalogVariant[];
  selectedVariantId: string | null;
  onSelect: (variant: CatalogVariant) => void;
}

export function VariantSelector({ variants, selectedVariantId, onSelect }: VariantSelectorProps) {
  useEffect(() => {
    if (selectedVariantId) return;
    const defaultVariant = variants.find(v => v.isDefault) ?? variants[0];
    if (defaultVariant) onSelect(defaultVariant);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-wrap gap-2 pb-3">
      {variants.map(variant => {
        const isSelected = variant.id === selectedVariantId;
        const isUnavailable = !variant.isAvailable;

        return (
          <button
            key={variant.id}
            type="button"
            disabled={isUnavailable}
            onClick={() => onSelect(variant)}
            className={`flex items-center gap-1 px-3 py-[7px] rounded-full border text-[13px] font-semibold tracking-[-0.01em] transition-[background,border-color,color,opacity] ${
              isSelected
                ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]'
                : 'bg-[var(--surface)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--accent)]'
            } ${isUnavailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span>{variant.label}</span>
            <span className={isSelected ? 'opacity-80' : 'text-[var(--ink-3)]'}>
              {formatPrice(variant.price)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
