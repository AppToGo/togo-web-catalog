'use client';

/**
 * FeaturedCarousel - Client Component
 *
 * Productos destacados de la sede (elegidos en el admin). Siempre con foto,
 * aunque el negocio tenga el catálogo sin imágenes: el admin no deja destacar
 * un producto sin imagen, y uno que la perdió no llega acá.
 *
 * Móvil: tarjetas que se deslizan con el dedo (scroll-snap) dejando ver la
 * siguiente. Escritorio: 3 a la vista con flechas. En ambos, puntos de
 * posición.
 */

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useProductQuickAdd } from './product-row';
import { useSearchContext } from './search-context';
import { formatPrice } from '@/lib/utils';
import { getInitials } from '@/components/ui/initials-avatar';
import type { CatalogProduct } from '@/src/types/catalog.types';

const DESKTOP_VISIBLE = 3;

interface FeaturedCarouselProps {
  products: CatalogProduct[];
}

export function FeaturedCarousel({ products }: FeaturedCarouselProps) {
  const { isSearching } = useSearchContext();
  const railRef = useRef<HTMLDivElement>(null);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [desktopStart, setDesktopStart] = useState(0);

  if (products.length === 0 || isSearching) return null;

  const maxStart = Math.max(0, products.length - DESKTOP_VISIBLE);
  const start = Math.min(desktopStart, maxStart);

  const handleRailScroll = () => {
    const rail = railRef.current;
    const first = rail?.firstElementChild as HTMLElement | null;
    if (!rail || !first) return;
    const step = first.offsetWidth + 12; // ancho de tarjeta + gap-3
    setMobileIndex(Math.min(products.length - 1, Math.round(rail.scrollLeft / step)));
  };

  const scrollRailTo = (index: number) => {
    const rail = railRef.current;
    const card = rail?.children[index] as HTMLElement | undefined;
    if (!rail || !card) return;
    rail.scrollTo({ left: card.offsetLeft - rail.offsetLeft - 16, behavior: 'smooth' });
  };

  return (
    <section
      aria-label="Destacados"
      className="pt-4 pb-3 flex flex-col gap-3 border-b border-(--line) lg:pt-0 lg:pb-2 lg:gap-3.5 lg:border-b-0"
    >
      <div className="flex items-center justify-between gap-3 px-4 lg:px-0">
        <h2
          className="m-0 text-[17px] lg:text-[20px] font-bold tracking-[-0.03em] text-(--ink)"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Destacados
        </h2>
        {products.length > DESKTOP_VISIBLE && (
          <div className="hidden lg:flex gap-2">
            <ArrowButton
              label="Destacados anteriores"
              disabled={start === 0}
              onClick={() => setDesktopStart(Math.max(0, start - 1))}
            >
              <ChevronLeft size={18} />
            </ArrowButton>
            <ArrowButton
              label="Destacados siguientes"
              disabled={start === maxStart}
              onClick={() => setDesktopStart(Math.min(maxStart, start + 1))}
            >
              <ChevronRight size={18} />
            </ArrowButton>
          </div>
        )}
      </div>

      {/* Móvil */}
      <div
        ref={railRef}
        onScroll={handleRailScroll}
        className="lg:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 scroll-px-4 scrollbar-hide"
      >
        {products.map((product) => (
          <FeaturedCard key={product.id} product={product} className="flex-[0_0_280px] snap-start" />
        ))}
      </div>
      {products.length > 1 && (
        <Dots
          className="flex lg:hidden"
          count={products.length}
          active={mobileIndex}
          onSelect={scrollRailTo}
        />
      )}

      {/* Escritorio */}
      <div className="hidden lg:grid grid-cols-3 gap-3.5">
        {products.slice(start, start + DESKTOP_VISIBLE).map((product) => (
          <FeaturedCard key={product.id} product={product} />
        ))}
      </div>
      {maxStart > 0 && (
        <Dots
          className="hidden lg:flex"
          count={maxStart + 1}
          active={start}
          onSelect={setDesktopStart}
        />
      )}
    </section>
  );
}

function FeaturedCard({ product, className = '' }: { product: CatalogProduct; className?: string }) {
  const { hasVariants, displayPrice, isUnavailable, canAddMore, openDetail, handleAdd } =
    useProductQuickAdd(product);
  // Misma regla que ProductRow: si la URL se rompe, iniciales sobre el fondo
  // del negocio en vez de una imagen rota.
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);
  const showImage = Boolean(product.image && failedImageSrc !== product.image);

  return (
    <div
      className={`flex flex-col bg-(--surface) border border-(--line) rounded-[18px] overflow-hidden transition-shadow hover:shadow-[0_4px_14px_rgba(20,20,15,0.08)] ${
        isUnavailable ? 'opacity-50' : ''
      } ${className}`}
    >
      <button
        type="button"
        onClick={openDetail}
        aria-label={`Ver detalle de ${product.name}`}
        className="relative block w-full aspect-[16/9] lg:aspect-auto lg:h-42 bg-(--accent-soft) cursor-pointer"
      >
        {showImage && product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 300px, 280px"
            onError={() => setFailedImageSrc(product.image ?? null)}
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center text-[32px] font-bold tracking-[-0.03em] text-(--accent)"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {getInitials(product.name)}
          </span>
        )}
        <span className="absolute top-2.5 left-2.5 text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.04em] px-2.5 py-1 rounded-full bg-(--surface) text-(--accent)">
          Destacado
        </span>
      </button>
      <div className="flex items-end gap-2.5 p-3.5">
        <button
          type="button"
          onClick={openDetail}
          className="flex-1 min-w-0 flex flex-col gap-0.75 text-left cursor-pointer"
        >
          <span
            className="text-[15px] font-semibold text-(--ink) tracking-[-0.01em] truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {product.name}
          </span>
          <span
            className="text-[15px] lg:text-[16px] font-bold text-(--ink) tracking-[-0.03em]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {hasVariants && product.priceFrom
              ? `Desde ${formatPrice(product.priceFrom)}`
              : formatPrice(displayPrice ?? 0)}
          </span>
        </button>
        <button
          type="button"
          onClick={handleAdd}
          disabled={hasVariants ? isUnavailable : !canAddMore}
          aria-label={hasVariants ? `Ver opciones de ${product.name}` : `Agregar ${product.name}`}
          className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-(--accent) text-(--accent-ink) flex items-center justify-center shrink-0 transition-[opacity,transform] hover:opacity-[0.88] active:scale-[0.92] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

function ArrowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="w-10 h-10 rounded-full border border-(--line-2) bg-(--surface) text-(--ink) flex items-center justify-center transition-colors hover:bg-(--bg) disabled:opacity-35 disabled:cursor-default disabled:hover:bg-(--surface)"
    >
      {children}
    </button>
  );
}

function Dots({
  count,
  active,
  onSelect,
  className,
}: {
  count: number;
  active: number;
  onSelect: (index: number) => void;
  className: string;
}) {
  return (
    <div className={`${className} justify-center gap-0.5`}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={`Ir al destacado ${i + 1}`}
          aria-current={i === active}
          className="w-6 h-6 flex items-center justify-center cursor-pointer"
        >
          <span
            className={`block h-1.5 rounded-full transition-[width,background] ${
              i === active ? 'w-4.5 bg-(--accent)' : 'w-1.5 bg-(--line-2)'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
