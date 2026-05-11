'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import { useCart } from './cart-context';
import { VariantSelector } from './variant-selector';
import { formatPrice } from '@/lib/utils';
import type { CatalogProduct, CatalogVariant } from '@/src/types/catalog.types';

function MinusIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

interface ProductRowProps {
  product: CatalogProduct;
  subcatId: string;
  isExpanded: boolean;
  onToggle: () => void;
  useProductImages: boolean;
}

export function ProductRow({ product, subcatId, isExpanded, onToggle, useProductImages }: ProductRowProps) {
  const { cart, addItem, updateItem, updateItemNotes } = useCart();

  const variants = product.variants ?? [];
  const hasVariants = variants.length > 1;

  const [notes, setNotes] = useState('');
  const [clientQty, setClientQty] = useState(0);
  const [selectedVariant] = useState<CatalogVariant | null>(
    () => variants.length === 1 ? variants[0] : null
  );

  useEffect(() => {
    const item = cart.items.find(
      i => i.productId === product.id && i.variantId === selectedVariant?.id
    );
    setClientQty(item?.quantity ?? 0);
  }, [cart.items, product.id, selectedVariant?.id]);

  const notesInitializedRef = useRef(false);

  useEffect(() => {
    if (isExpanded && !hasVariants && !notesInitializedRef.current) {
      notesInitializedRef.current = true;
      const cartItem = cart.items.find(
        i => i.productId === product.id && i.variantId === selectedVariant?.id
      );
      setNotes(cartItem?.notes ?? '');
    } else if (!isExpanded) {
      notesInitializedRef.current = false;
    }
  }, [isExpanded, hasVariants, cart.items, product.id, selectedVariant?.id]);

  const qty = clientQty;
  const displayPrice = selectedVariant?.price ?? product.priceFrom ?? product.price;

  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-stepper]')) return;
    onToggle();
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVariants) {
      onToggle();
      return;
    }
    if (qty === 0) {
      const price = selectedVariant?.price ?? product.priceFrom ?? product.price;
      addItem({
        productId: product.id,
        name: product.name,
        price,
        quantity: 1,
        image: product.image,
        variantId: selectedVariant?.id,
        variantLabel: selectedVariant?.label,
        ...(selectedVariant?.attributes ? { variantAttributes: selectedVariant.attributes } : {}),
      });
    } else {
      onToggle();
    }
  };

  const handleVariantAdd = (variantId: string) => {
    const v = variants.find(v => v.id === variantId);
    if (!v) return;
    addItem({
      productId: product.id,
      name: `${product.name} - ${v.label}`,
      price: v.price,
      quantity: 1,
      image: product.image,
      variantId: v.id,
      variantLabel: v.label,
      ...(v.attributes ? { variantAttributes: v.attributes } : {}),
    });
  };

  const handleVariantDelta = (variantId: string, delta: number) => {
    updateItem(product.id, delta, variantId);
  };

  const handleExpandedAdd = () => {
    const price = selectedVariant?.price ?? product.priceFrom ?? product.price;

    if (clientQty > 0) {
      updateItemNotes(product.id, notes.trim(), selectedVariant?.id);
    } else {
      addItem({
        productId: product.id,
        name: product.name,
        price,
        quantity: 1,
        image: product.image,
        notes: notes.trim() || undefined,
        variantId: selectedVariant?.id,
        variantLabel: selectedVariant?.label,
        ...(selectedVariant?.attributes ? { variantAttributes: selectedVariant.attributes } : {}),
      });
    }
    setNotes('');
    onToggle();
  };

  const handleMinus = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateItem(product.id, -1, selectedVariant?.id);
  };

  const handlePlus = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateItem(product.id, 1, selectedVariant?.id);
  };

  const isUnavailable = !product.isAvailable || !product.active || (selectedVariant !== null && selectedVariant.isAvailable === false);
  const stepperDisabled = isUnavailable || (hasVariants && !selectedVariant);

  const getVariantQty = (variantId: string) =>
    cart.items.find(i => i.productId === product.id && i.variantId === variantId)?.quantity ?? 0;

  const getVariantNotes = (variantId: string) =>
    cart.items.find(i => i.productId === product.id && i.variantId === variantId)?.notes;

  const handleVariantNote = (variantId: string, note: string) => {
    updateItemNotes(product.id, note, variantId);
  };

  return (
    <div
      className={`grid ${useProductImages ? 'grid-cols-[56px_1fr_auto]' : 'grid-cols-[1fr_auto]'} items-center gap-3 px-4 py-3 border-b border-[var(--line)] last:border-b-0 cursor-pointer transition-colors relative ${
        isExpanded ? 'bg-[var(--accent-softer)]' : 'bg-[var(--surface)] hover:bg-[var(--bg)]'
      } ${isUnavailable ? 'opacity-50' : ''}`}
      onClick={handleRowClick}
    >
      {useProductImages && (
        product.image ? (
          <div className="w-[52px] h-[52px] rounded-lg shrink-0 relative overflow-hidden">
            <Image src={product.image} alt={product.name} fill className="object-cover" sizes="52px" />
          </div>
        ) : (
          <InitialsAvatar name={product.name} subcatId={subcatId} />
        )
      )}

      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <div
          className="text-[14px] font-semibold text-[var(--ink)] leading-[1.35] truncate tracking-[-0.01em]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {product.name}
        </div>
        {product.description && (
          <div className="text-xs text-[var(--ink-3)] leading-[1.4] line-clamp-1">
            {product.description}
          </div>
        )}
        <div className="flex items-center gap-[6px] mt-0.5">
          <span
            className="text-[15px] font-bold text-[var(--ink)] tracking-[-0.03em]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {hasVariants && product.priceFrom
              ? `Desde ${formatPrice(product.priceFrom)}`
              : formatPrice(displayPrice ?? 0)}
          </span>
          {isUnavailable && (
            <span className="text-[10px] font-semibold text-[var(--ink-3)] bg-[var(--line)] px-[6px] py-[2px] rounded-[4px]">
              Agotado
            </span>
          )}
        </div>
      </div>

      <div data-stepper onClick={(e) => e.stopPropagation()}>
        {hasVariants ? (
          <button
            className="w-9 h-9 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] flex items-center justify-center shrink-0 transition-[opacity,transform] shadow-[0_1px_2px_rgba(20,20,15,0.04)] hover:opacity-[0.88] active:scale-[0.92] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAdd}
            disabled={isUnavailable}
            aria-label={`Ver opciones de ${product.name}`}
          >
            <ChevronDown
              size={18}
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        ) : qty === 0 ? (
          <button
            className="w-9 h-9 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] flex items-center justify-center shrink-0 transition-[opacity,transform] shadow-[0_1px_2px_rgba(20,20,15,0.04)] text-xl font-light leading-none hover:opacity-[0.88] active:scale-[0.92] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAdd}
            disabled={isUnavailable}
            aria-label={`Agregar ${product.name}`}
          >
            +
          </button>
        ) : (
          <div className="flex items-center gap-0.5 bg-[var(--bg)] border-[1.5px] border-[var(--line)] rounded-[20px] p-0.5 shrink-0">
            <button
              className="w-7 h-7 rounded-full flex items-center justify-center transition-[background,color] text-[var(--ink-2)] hover:bg-[var(--line)] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleMinus}
              disabled={stepperDisabled}
              aria-label="Quitar uno"
            >
              <MinusIcon />
            </button>
            <span
              className="min-w-6 text-center text-[13px] font-bold text-[var(--ink)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {qty}
            </span>
            <button
              className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--accent)] text-[var(--accent-ink)] hover:opacity-[0.88] transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePlus}
              disabled={stepperDisabled}
              aria-label="Agregar uno"
            >
              <PlusIcon />
            </button>
          </div>
        )}
      </div>

      {isExpanded && (
        <div
          className={`${useProductImages ? 'col-span-3' : 'col-span-2'} pt-3 pb-1 animate-[slide-down_0.18s_ease-out]`}
          onClick={(e) => e.stopPropagation()}
        >
          {hasVariants ? (
            <VariantSelector
              variants={variants}
              getQty={getVariantQty}
              getNotes={getVariantNotes}
              onAdd={handleVariantAdd}
              onDelta={handleVariantDelta}
              onNote={handleVariantNote}
            />
          ) : (
            <>
              <textarea
                className="w-full px-3 py-[9px] bg-[var(--surface)] border-[1.5px] border-[var(--line)] rounded-lg text-[13px] text-[var(--ink)] resize-none outline-none transition-[border-color] leading-[1.5] placeholder:text-[var(--ink-3)] focus:border-[var(--accent)]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas para este producto (opcional)..."
                rows={2}
              />
              <button
                className="w-full py-[11px] mt-3 rounded-lg bg-[var(--accent)] text-[var(--accent-ink)] text-[14px] font-semibold tracking-[-0.01em] transition-opacity hover:opacity-[0.88] active:opacity-[0.76]"
                style={{ fontFamily: 'var(--font-display)' }}
                onClick={(e) => { e.stopPropagation(); handleExpandedAdd(); }}
              >
                {qty > 0 ? 'Actualizar pedido' : 'Agregar al pedido'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
