/**
 * RecommendationsSheet - Client Component
 *
 * Hoja "Va muy bien con" que sube al agregar un producto que tiene
 * recomendados (los elige el negocio en el admin). Muestra hasta 3, en orden
 * al azar, sin los que ya están en el carrito; cada uno se agrega con un
 * toque.
 *
 * Reglas:
 * - Sale solo cuando el producto entra al carrito (no al sumar otra
 *   unidad), y no si el detalle del producto ya mostró sus recomendados.
 * - Reglas compartidas con el detalle: ver recommendations-context.
 * - El pedido armado acá ya lleva sus recomendados: el bot no los vuelve a
 *   ofrecer al confirmarlo por WhatsApp.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Check, X } from 'lucide-react';
import type { CatalogProduct } from '@/src/types/catalog.types';
import { formatPrice } from '@/lib/utils';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import { useCart } from './cart-context';
import { useCartUI } from './cart-ui-context';
import { defaultVariant, useRecommendations } from './recommendations-context';

interface RecommendationsSheetProps {
  useProductImages: boolean;
}

interface OpenSheet {
  source: CatalogProduct;
  items: CatalogProduct[];
}

export function RecommendationsSheet({ useProductImages }: RecommendationsSheetProps) {
  const { lastAdded } = useCart();
  const { isCartOpen, openCart } = useCartUI();
  const { pickFor, getProduct, isInCart, toggle, markShown, shouldOffer } =
    useRecommendations();
  const [sheet, setSheet] = useState<OpenSheet | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const handledAt = useRef<number | null>(null);

  useEffect(() => {
    if (!lastAdded || handledAt.current === lastAdded.at) return;
    handledAt.current = lastAdded.at;

    const { productId } = lastAdded;
    if (isCartOpen || !shouldOffer(productId)) return;
    const source = getProduct(productId);
    if (!source) return;
    const items = pickFor(productId);
    if (items.length === 0) return;

    markShown(productId);
    setIsClosing(false);
    setSheet({ source, items });
  }, [lastAdded, isCartOpen, shouldOffer, getProduct, pickFor, markShown]);

  const close = useCallback((then?: () => void) => {
    setIsClosing(true);
    setTimeout(() => {
      setSheet(null);
      setIsClosing(false);
      then?.();
    }, 250);
  }, []);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sheet, close]);

  if (!sheet) return null;

  const addedCount = sheet.items.filter(isInCart).length;

  return (
    <>
      <div
        className={`fixed inset-0 bg-[rgba(21,20,15,0.5)] z-50 backdrop-blur-sm ${!isClosing ? 'animate-[fade-in_0.2s_ease-out]' : ''}`}
        style={isClosing ? { opacity: 0, transition: 'opacity 0.25s ease-out' } : undefined}
        onClick={() => close()}
        aria-hidden="true"
      />
      <div
        className={`fixed bottom-0 left-0 right-0 z-[51] mx-auto max-w-lg bg-[var(--surface)] rounded-t-[18px] max-h-[92dvh] flex flex-col shadow-[0_14px_40px_rgba(20,20,15,0.14)] ${!isClosing ? 'animate-[drawer-up_0.28s_cubic-bezier(0.32,0.72,0,1)]' : ''}`}
        style={isClosing ? { transform: 'translateY(100%)', transition: 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)' } : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recommendations-title"
        data-testid="recommendations-sheet"
      >
        <div className="w-9 h-1 rounded-full bg-[var(--line-2)] mx-auto mt-[10px] shrink-0" />

        <div className="flex items-start justify-between gap-3 px-4 pt-[14px]">
          <div className="flex items-center gap-[10px] min-w-0">
            <span className="w-7 h-7 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
              <Check size={16} strokeWidth={2.6} aria-hidden="true" />
            </span>
            <p className="m-0 text-[14px] text-[var(--ink-2)] truncate">
              Agregaste <b className="text-[var(--ink)]">{sheet.source.name}</b>
            </p>
          </div>
          <button
            type="button"
            onClick={() => close()}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-full bg-[var(--bg)] border border-[var(--line)] flex items-center justify-center text-[var(--ink-2)] transition-colors hover:bg-[var(--line)] shrink-0"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <h2
          id="recommendations-title"
          className="m-0 px-4 pt-3 pb-1 text-[20px] font-bold text-[var(--ink)] tracking-[-0.03em]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Va muy bien con
        </h2>

        <ul className="m-0 p-0 list-none overflow-y-auto">
          {sheet.items.map((product) => {
            const isAdded = isInCart(product);
            const variant = defaultVariant(product);
            const price = variant?.price ?? product.priceFrom ?? product.price;
            return (
              <li
                key={product.id}
                className={`grid ${useProductImages ? 'grid-cols-[52px_1fr_auto]' : 'grid-cols-[1fr_auto]'} items-center gap-3 px-4 py-3 border-b border-[var(--line)] last:border-b-0`}
              >
                {useProductImages &&
                  (product.image ? (
                    <div className="w-13 h-13 rounded-lg shrink-0 relative overflow-hidden">
                      <Image
                        src={product.image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="52px"
                      />
                    </div>
                  ) : (
                    <InitialsAvatar
                      name={product.name}
                      subcatId={product.categoryId ?? product.id}
                    />
                  ))}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[14px] font-semibold text-[var(--ink)] truncate tracking-[-0.01em]">
                    {product.name}
                  </span>
                  <span className="text-[15px] font-bold text-[var(--ink)] tracking-[-0.03em]">
                    {formatPrice(price)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(product)}
                  aria-pressed={isAdded}
                  aria-label={`${isAdded ? 'Quitar' : 'Agregar'} ${product.name}`}
                  className={`min-h-10 px-4 rounded-full border-[1.5px] border-[var(--accent)] text-[14px] font-bold transition-colors ${
                    isAdded
                      ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                      : 'bg-[var(--surface)] text-[var(--accent)] hover:bg-[var(--accent-softer)]'
                  }`}
                >
                  {isAdded ? 'Agregado' : 'Agregar'}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="px-4 pt-[14px] pb-[22px] shrink-0">
          <button
            type="button"
            onClick={() => (addedCount > 0 ? close(openCart) : close())}
            className="w-full py-[14px] rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] text-[15px] font-bold tracking-[-0.01em] transition-opacity hover:opacity-90 active:opacity-80"
          >
            {addedCount > 0 ? 'Listo, ver mi pedido' : 'Seguir comprando'}
          </button>
        </div>
      </div>
    </>
  );
}
