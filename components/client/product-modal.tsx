/**
 * ProductModal - Client Component
 *
 * Hoja inferior de detalle de producto (solo mobile). Siempre montada para
 * animar la entrada y la salida; conserva el último producto mostrado
 * mientras la hoja se cierra.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { useCart } from './cart-context';
import { useCartUI } from './cart-ui-context';
import { formatPrice } from '@/lib/utils';
import { getProductRowKey } from '@/lib/expand-template-products';
import {
  getProductIngredients,
  getProductPreparation,
  type CatalogProduct,
  type CatalogVariant,
} from '@/src/types/catalog.types';

interface ProductModalProps {
  token: string;
  accentColor: string;
  /** Mismo ajuste del negocio que en la lista: sin fotos, la hoja tampoco las muestra */
  useProductImages: boolean;
}

export function ProductModal({ useProductImages }: ProductModalProps) {
  const { selectedProduct, selectProduct } = useCartUI();
  const [shownProduct, setShownProduct] = useState<CatalogProduct | null>(selectedProduct);
  const sheetRef = useRef<HTMLDivElement>(null);

  const isOpen = !!selectedProduct;

  // Conserva el último producto durante la animación de salida
  if (selectedProduct && selectedProduct !== shownProduct) {
    setShownProduct(selectedProduct);
  }

  const handleClose = useCallback(() => {
    selectProduct(null);
  }, [selectProduct]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    },
    [handleClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    sheetRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ease-out ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <div
        className="absolute inset-0 bg-[rgba(21,20,15,0.5)] backdrop-blur-sm"
        onClick={handleClose}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={shownProduct ? `Detalle de ${shownProduct.name}` : 'Detalle de producto'}
        tabIndex={-1}
        className={`absolute inset-x-0 bottom-0 h-[calc(100dvh-36px)] bg-(--surface) rounded-t-[20px] overflow-hidden flex flex-col outline-none shadow-[0_14px_40px_rgba(20,20,15,0.14)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {shownProduct && (
          <ProductSheetContent
            key={getProductRowKey(shownProduct)}
            product={shownProduct}
            showPhoto={useProductImages}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CONTENIDO (se remonta por producto: resetea cantidad, variante,
// notas, descripción expandida y scroll)
// ═══════════════════════════════════════════════════════════

interface ProductSheetContentProps {
  product: CatalogProduct;
  showPhoto: boolean;
  onClose: () => void;
}

function ProductSheetContent({ product, showPhoto, onClose }: ProductSheetContentProps) {
  const { cart, addItem, getStockForProduct } = useCart();

  const variants = product.variants ?? [];
  const hasVariants = variants.length > 1;
  const singleVariant = variants.length === 1 ? variants[0] : null;

  const [qty, setQty] = useState(1);
  const [pickedVariantId, setPickedVariantId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [descExpanded, setDescExpanded] = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);
  const [compactHeader, setCompactHeader] = useState(false);

  const photoRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);

  const pickedVariant = hasVariants
    ? (variants.find((v) => v.id === pickedVariantId) ?? null)
    : singleVariant;
  const needsVariant = hasVariants && !pickedVariant;

  const ingredients = getProductIngredients(product);
  const preparation = getProductPreparation(product);

  // "Leer más" solo si la descripción desborda las 4 líneas
  useEffect(() => {
    const el = descRef.current;
    if (!el || descExpanded) return;
    const observer = new ResizeObserver(() => {
      setDescOverflows(el.scrollHeight > el.clientHeight + 1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [descExpanded]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // Con foto: al pasarla. Sin foto: cuando el nombre queda bajo la cabecera.
    const title = titleRef.current;
    const threshold = showPhoto
      ? (photoRef.current?.offsetHeight ?? 0)
      : title
        ? title.offsetTop + title.offsetHeight
        : 0;
    setCompactHeader(e.currentTarget.scrollTop > threshold - 56);
  };

  const minVariantPrice = hasVariants ? Math.min(...variants.map((v) => v.price)) : undefined;
  const unitPrice =
    pickedVariant?.price ?? (hasVariants ? undefined : (product.priceFrom ?? product.price));
  const priceLabel =
    unitPrice !== undefined
      ? formatPrice(unitPrice)
      : `Desde ${formatPrice(product.priceFrom ?? minVariantPrice ?? product.price)}`;

  const isUnavailable =
    !product.isAvailable || !product.active || pickedVariant?.isAvailable === false;
  // Infinity cuando el producto no maneja stock
  const maxQty = getStockForProduct(product.id, product.stock, pickedVariant?.id);
  const outOfStock = maxQty <= 0;
  const effectiveQty = Math.min(qty, Math.max(1, maxQty));

  const cartLines = cart.items.filter(
    (i) => i.productId === product.id && (hasVariants || i.variantId === singleVariant?.id),
  );

  const eyebrow = product.brand || product.category?.name;
  const variantsTitle = variants.some((v) =>
    Object.keys(v.attributes ?? {}).some((k) => /size|tama|talla/i.test(k)),
  )
    ? 'Elige el tamaño'
    : 'Elige una opción';

  const ctaDisabled = isUnavailable || outOfStock || needsVariant;
  const ctaLabel =
    isUnavailable || outOfStock ? 'Agotado' : needsVariant ? 'Elige una opción' : 'Agregar';

  const handleAdd = () => {
    if (ctaDisabled || unitPrice === undefined) return;
    const variant = pickedVariant;
    addItem({
      productId: product.id,
      name: hasVariants && variant ? `${product.name} - ${variant.label}` : product.name,
      price: unitPrice,
      quantity: effectiveQty,
      image: product.image,
      variantId: variant?.id,
      variantLabel: variant?.label,
      ...(variant?.attributes ? { variantAttributes: variant.attributes } : {}),
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <>
      {/* Cabecera compacta: aparece al pasar la foto */}
      <div
        className={`absolute inset-x-0 top-0 z-10 grid grid-cols-[44px_minmax(0,1fr)_44px] items-center px-2 py-1.5 bg-(--surface) border-b border-(--line) transition-opacity duration-150 ${
          compactHeader ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!compactHeader}
        inert={!compactHeader}
      >
        <button
          className="w-11 h-11 rounded-full flex items-center justify-center text-(--ink) hover:bg-(--bg)"
          onClick={onClose}
          aria-label="Cerrar detalle"
        >
          <X size={18} strokeWidth={2.2} />
        </button>
        <div className="text-center min-w-0">
          <div
            className="text-[15px] font-bold tracking-[-0.02em] text-(--ink) truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {product.name}
          </div>
          <div className="text-xs text-(--ink-2)">{priceLabel}</div>
        </div>
        <span />
      </div>

      {/* Zona de scroll */}
      <div
        className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain"
        onScroll={handleScroll}
      >
        {showPhoto ? (
          <div ref={photoRef} className="relative aspect-3/2 bg-(--accent-soft)">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="100vw"
              />
            ) : (
              <PhotoPlaceholder name={product.name} />
            )}
            <span
              aria-hidden="true"
              className="absolute top-2 left-1/2 -translate-x-1/2 w-9 h-1 rounded-full bg-(--surface)/90"
            />
            <button
              className="absolute top-3.5 right-3.5 w-10 h-10 rounded-full bg-(--surface)/95 text-(--ink) flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.12)] active:scale-95 transition-transform"
              onClick={onClose}
              aria-label="Cerrar detalle"
            >
              <X size={18} strokeWidth={2.2} />
            </button>
          </div>
        ) : (
          <div className="relative h-14">
            <span
              aria-hidden="true"
              className="absolute top-2 left-1/2 -translate-x-1/2 w-9 h-1 rounded-full bg-(--line-2)"
            />
            <button
              className="absolute top-3.5 right-3.5 w-10 h-10 rounded-full bg-(--bg) text-(--ink) flex items-center justify-center active:scale-95 transition-transform"
              onClick={onClose}
              aria-label="Cerrar detalle"
            >
              <X size={18} strokeWidth={2.2} />
            </button>
          </div>
        )}

        <div className={`px-4 ${showPhoto ? 'pt-4.5' : 'pt-0'} pb-6 flex flex-col gap-3.5`}>
          <div className="flex flex-col gap-1">
            {eyebrow && (
              <span className="text-xs font-semibold uppercase tracking-[0.04em] text-(--ink-2)">
                {eyebrow}
              </span>
            )}
            <h1
              ref={titleRef}
              className="m-0 text-2xl leading-[1.15] font-bold tracking-[-0.03em] text-(--ink)"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {product.name}
            </h1>
            <span
              className="mt-0.5 text-xl font-bold tracking-[-0.03em] text-(--ink)"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {priceLabel}
            </span>
          </div>

          {product.description && (
            <div className="flex flex-col gap-1.5 items-start">
              <p
                ref={descRef}
                className={`m-0 text-[15px] leading-[1.55] text-(--ink-2) whitespace-pre-line ${
                  descExpanded ? '' : 'line-clamp-4'
                }`}
              >
                {product.description}
              </p>
              {descOverflows && (
                <button
                  className="py-1.5 text-sm font-semibold text-(--accent)"
                  onClick={() => setDescExpanded((v) => !v)}
                  aria-expanded={descExpanded}
                >
                  {descExpanded ? 'Leer menos' : 'Leer más'}
                </button>
              )}
            </div>
          )}

          {ingredients.length > 0 && (
            <>
              <Separator />
              <section className="flex flex-col gap-2.5">
                <SectionTitle>Ingredientes</SectionTitle>
                <ul className="m-0 p-0 list-none flex flex-wrap gap-1.5">
                  {ingredients.map((ingredient, i) => (
                    <li
                      key={`${ingredient}-${i}`}
                      className="px-2.5 py-1.5 rounded-full bg-(--bg) border border-(--line) text-[13px] text-(--ink-2)"
                    >
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}

          {preparation.length > 0 && (
            <>
              <Separator />
              <section className="flex flex-col gap-3">
                <SectionTitle>Preparación</SectionTitle>
                <ol className="m-0 p-0 list-none flex flex-col gap-3">
                  {preparation.map((step, i) => (
                    <li key={i} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2.5 items-start">
                      <span
                        className="w-6 h-6 rounded-full bg-(--accent-soft) text-(--accent) text-xs font-bold flex items-center justify-center"
                        style={{ fontFamily: 'var(--font-display)' }}
                        aria-hidden="true"
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm leading-normal text-(--ink-2)">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
            </>
          )}

          {hasVariants && (
            <>
              <Separator />
              <section className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <SectionTitle id="variant-title">{variantsTitle}</SectionTitle>
                  <span
                    className={`text-xs font-semibold px-2 py-0.75 rounded-md ${
                      pickedVariant
                        ? 'bg-(--accent-soft) text-(--accent)'
                        : 'bg-(--line) text-(--ink-2)'
                    }`}
                  >
                    {pickedVariant ? 'Listo' : 'Obligatorio'}
                  </span>
                </div>
                <div
                  role="radiogroup"
                  aria-labelledby="variant-title"
                  className="flex flex-col gap-2"
                >
                  {variants.map((v) => (
                    <VariantOption
                      key={v.id}
                      variant={v}
                      selected={pickedVariant?.id === v.id}
                      onSelect={() => {
                        setPickedVariantId(v.id);
                        setQty(1);
                      }}
                    />
                  ))}
                </div>
              </section>
            </>
          )}

          <Separator />
          <section className="flex flex-col gap-2">
            <label
              htmlFor="product-notes"
              className="text-base font-bold tracking-[-0.02em] text-(--ink)"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Notas para la cocina{' '}
              <span className="text-[13px] font-medium text-(--ink-2)">· opcional</span>
            </label>
            <textarea
              id="product-notes"
              className="w-full px-3 py-2.5 bg-(--surface) border-[1.5px] border-(--line-2) rounded-[10px] text-sm text-(--ink) resize-none outline-none transition-[border-color] leading-normal placeholder:text-(--ink-3) focus:border-(--accent)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej.: sin cebolla, bien cocido…"
              rows={3}
              maxLength={500}
            />
          </section>

          {cartLines.length > 0 && (
            <div className="flex items-center gap-1.5 text-[13px] text-(--ink-2)">
              <ShoppingBag size={16} aria-hidden="true" />
              <span>
                Ya en tu pedido:{' '}
                {cartLines
                  .map((i) => `${i.quantity} × ${i.variantLabel ?? product.name}`)
                  .join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Barra fija */}
      <div className="flex-none flex items-center gap-2.5 px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] bg-(--surface) border-t border-(--line) shadow-[0_-6px_16px_rgba(20,20,15,0.05)]">
        <div className="flex items-center gap-0.5 p-0.5 rounded-full border-[1.5px] border-(--line-2) bg-(--bg)">
          <button
            className="w-11 h-11 rounded-full flex items-center justify-center text-(--ink-2) disabled:opacity-40"
            onClick={() => setQty(Math.max(1, effectiveQty - 1))}
            disabled={ctaDisabled || effectiveQty <= 1}
            aria-label="Quitar uno"
          >
            <Minus size={16} strokeWidth={2.4} />
          </button>
          <span
            className="min-w-5.5 text-center text-base font-bold text-(--ink)"
            style={{ fontFamily: 'var(--font-display)' }}
            aria-live="polite"
          >
            {effectiveQty}
          </span>
          <button
            className="w-11 h-11 rounded-full flex items-center justify-center text-(--ink) disabled:opacity-40"
            onClick={() => setQty(effectiveQty + 1)}
            disabled={ctaDisabled || effectiveQty >= maxQty}
            aria-label="Agregar uno"
          >
            <Plus size={16} strokeWidth={2.4} />
          </button>
        </div>
        <button
          className="flex-1 h-12.5 rounded-[14px] flex items-center justify-between px-4.5 text-[15px] font-semibold transition-opacity bg-(--accent) text-(--accent-ink) hover:opacity-[0.88] active:opacity-[0.76] disabled:bg-(--line-2) disabled:text-(--ink-2) disabled:cursor-not-allowed disabled:hover:opacity-100"
          style={{ fontFamily: 'var(--font-display)' }}
          onClick={handleAdd}
          disabled={ctaDisabled}
        >
          <span>{ctaLabel}</span>
          {!ctaDisabled && unitPrice !== undefined && (
            <span className="font-bold tracking-[-0.02em]">
              {formatPrice(unitPrice * effectiveQty)}
            </span>
          )}
        </button>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// PIEZAS
// ═══════════════════════════════════════════════════════════

function Separator() {
  return <div className="h-px bg-(--line)" aria-hidden="true" />;
}

function SectionTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="m-0 text-base font-bold tracking-[-0.02em] text-(--ink)"
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {children}
    </h2>
  );
}

function PhotoPlaceholder({ name }: { name: string }) {
  const words = name.split(/\s+/).filter(Boolean);
  const initials =
    words.length > 1
      ? (words[0][0] + words[1][0]).toUpperCase()
      : (words[0] ?? '').slice(0, 2).toUpperCase();
  return (
    <div className="absolute inset-0 flex items-center justify-center select-none">
      <span
        className="text-5xl font-bold tracking-[-0.03em] text-(--accent)"
        style={{ fontFamily: 'var(--font-display)' }}
        aria-hidden="true"
      >
        {initials}
      </span>
    </div>
  );
}

interface VariantOptionProps {
  variant: CatalogVariant;
  selected: boolean;
  onSelect: () => void;
}

function VariantOption({ variant, selected, onSelect }: VariantOptionProps) {
  const disabled = variant.isAvailable === false;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={`w-full min-h-15 flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-[border-color,background] disabled:opacity-50 disabled:cursor-not-allowed ${
        selected
          ? 'border-2 border-(--accent) bg-(--accent-soft)'
          : 'border-[1.5px] border-(--line-2) bg-(--surface)'
      }`}
    >
      <span
        className={`w-5 h-5 flex-none rounded-full border-2 flex items-center justify-center ${
          selected ? 'border-(--accent)' : 'border-(--ink-3)'
        }`}
        aria-hidden="true"
      >
        <span
          className={`w-2.5 h-2.5 rounded-full ${selected ? 'bg-(--accent)' : 'bg-transparent'}`}
        />
      </span>
      <span className="flex-1 flex flex-col gap-px min-w-0">
        <span className="text-[15px] font-semibold text-(--ink)">{variant.label}</span>
        {disabled && <span className="text-xs text-(--ink-2)">Agotado</span>}
      </span>
      <span
        className="text-[15px] font-bold tracking-[-0.02em] text-(--ink)"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {formatPrice(variant.price)}
      </span>
    </button>
  );
}
