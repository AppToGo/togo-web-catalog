/**
 * Product Card
 * Server Component con interacción de carrito via Client Component
 */

import type { Product } from '@/lib/types';
import { AddToCartButton } from './add-to-cart-button';

interface ProductCardProps {
  product: Product;
  token: string;
  quantityInCart?: number;
  onClick?: () => void;
}

export function ProductCard({ product, token, quantityInCart, onClick }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div 
      onClick={onClick}
      className="group bg-[var(--color-card)] rounded-[var(--radius)] border border-[var(--color-border)] overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
    >
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

        {/* Indicador de clic para ver detalle */}
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

          {/* Botón de agregar - Client Component */}
          <AddToCartButton 
            product={product} 
            token={token} 
            quantityInCart={quantityInCart}
          />
        </div>
      </div>
    </div>
  );
}
