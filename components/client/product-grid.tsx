/**
 * ProductGrid - Client Component
 * 
 * Grid de productos con interacción de carrito.
 * Usa CartContext (datos/operaciones) y CartUIContext (UI) separados.
 */

'use client';

import Image from 'next/image';
import type { Product } from '@/lib/types';
import { useCartUI } from './cart-ui-context';
import { AddToCartButton, QuantityBadge } from './add-to-cart-button';
import { formatPrice } from '@/lib/utils';

interface ProductGridProps {
  products: Product[];
  accentColor: string;
}

export function ProductGrid({ products, accentColor }: ProductGridProps) {
  const { selectProduct } = useCartUI();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          accentColor={accentColor}
          onClick={() => selectProduct(product)}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PRODUCT CARD
// ═══════════════════════════════════════════════════════════

interface ProductCardProps {
  product: Product;
  accentColor: string;
  onClick: () => void;
}

function ProductCard({ product, accentColor, onClick }: ProductCardProps) {
  return (
    <article 
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
      data-product-id={product.id}
      onClick={onClick}
    >
      {/* Imagen del producto */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            quality={75}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <span className="text-4xl" role="img" aria-label="Producto">
              🍽️
            </span>
          </div>
        )}
        
        {/* Cantidad en carrito */}
        <QuantityBadge 
          productId={product.id}
          accentColor={accentColor}
        />
      </div>

      {/* Info del producto */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 text-sm">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>

          {/* Botón Agregar */}
          <AddToCartButton
            product={product}
            accentColor={accentColor}
          />
        </div>
      </div>
    </article>
  );
}
