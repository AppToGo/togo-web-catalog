/**
 * Product Card
 * Server Component - Ultra ligero, solo HTML
 */

import type { Product } from '@/lib/types';
import { addToCartAction } from '@/lib/actions';

interface ProductCardProps {
  product: Product;
  token: string;
  quantityInCart?: number;
}

export function ProductCard({ product, token, quantityInCart }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="group bg-[var(--color-card)] rounded-[var(--radius)] border border-[var(--color-border)] overflow-hidden hover:shadow-md transition-shadow">
      {/* Imagen */}
      <div className="relative aspect-square bg-[var(--color-muted)]">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🍽️
          </div>
        )}
        
        {/* Badge de cantidad */}
        {quantityInCart ? (
          <div className="absolute top-2 right-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-xs font-bold px-2 py-1 rounded-full">
            {quantityInCart} en carrito
          </div>
        ) : null}

        {/* Overlay de detalle - visible en hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
          <span className="bg-white/90 text-black text-xs font-medium px-3 py-1.5 rounded-full shadow-lg">
            Click para detalle
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-3">
        <h3 className="font-semibold text-[var(--color-foreground)] text-sm line-clamp-2">
          {product.name}
        </h3>
        
        {product.description ? (
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1 line-clamp-2">
            {product.description}
          </p>
        ) : null}

        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-[var(--color-primary)]">
            {formatPrice(product.price)}
          </span>

          {/* Form con Server Action - funciona sin JS */}
          <form action={addToCartAction}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="name" value={product.name} />
            <input type="hidden" name="price" value={product.price} />
            
            <button
              type="submit"
              className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-medium rounded-full hover:opacity-90 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Agregar</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
