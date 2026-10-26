'use client';

import { Minus, Plus } from 'lucide-react';
import { CartItemNotes } from './cart-item-notes';
import type { CartItem } from '@/src/types/catalog.types';
import { formatPrice } from '@/lib/utils';

interface CartItemRowProps {
  item: CartItem;
  disabled?: boolean;
  onChangeQuantity: (productId: string, delta: number, variantId?: string) => void;
  onSaveNotes: (productId: string, notes: string, variantId?: string) => void;
}

/** Línea del carrito: nombre, nota, stepper y subtotal. */
export function CartItemRow({ item, disabled, onChangeQuantity, onSaveNotes }: CartItemRowProps) {
  return (
    <div className="flex items-center gap-[10px] px-4 py-[10px] border-b border-[var(--line)] last:border-b-0">
      <div className="flex-1 min-w-0">
        <div
          className="text-[14px] font-semibold text-[var(--ink)] truncate tracking-[-0.01em]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {item.name}
        </div>
        <CartItemNotes
          productId={item.productId}
          variantId={item.variantId}
          notes={item.notes}
          disabled={disabled}
          onSave={onSaveNotes}
        />
        <div className="flex items-center gap-[6px] mt-0.5">
          <span className="text-xs text-[var(--ink-3)]">{formatPrice(item.price)} c/u</span>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0.5 bg-[var(--bg)] border-[1.5px] border-[var(--line)] rounded-[20px] p-0.5 shrink-0">
        <button
          className="w-7 h-7 rounded-full flex items-center justify-center transition-[background] text-[var(--ink-2)] hover:bg-[var(--line)] disabled:opacity-40"
          onClick={() => onChangeQuantity(item.productId, -1, item.variantId)}
          disabled={disabled}
          aria-label="Quitar uno"
        >
          <Minus size={11} />
        </button>
        <span
          className="min-w-6 text-center text-[13px] font-bold text-[var(--ink)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {item.quantity}
        </span>
        <button
          className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--accent)] text-[var(--accent-ink)] hover:opacity-[0.88] transition-opacity disabled:opacity-40"
          onClick={() => onChangeQuantity(item.productId, 1, item.variantId)}
          disabled={disabled}
          aria-label="Agregar uno"
        >
          <Plus size={11} />
        </button>
      </div>

      <div
        className="text-[14px] font-bold text-[var(--ink)] tracking-[-0.03em] min-w-[70px] text-right"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {formatPrice(item.price * item.quantity)}
      </div>
    </div>
  );
}
