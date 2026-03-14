/**
 * ProductGrid - Client Component
 * 
 * Grid de productos con interacción de carrito.
 * Usa CartContext (datos/operaciones) y CartUIContext (UI) separados.
 * 
 * Updated for normalized catalog (BusinessProduct + GlobalProduct)
 */

'use client';

import Image from 'next/image';
import type { CatalogProduct } from '@/src/types/catalog.types';
import { useCartUI } from './cart-ui-context';
import { AddToCartButton, QuantityBadge } from './add-to-cart-button';
import { formatPrice } from '@/lib/utils';

interface ProductGridProps {
  products: CatalogProduct[];
  accentColor: string;
}

export function ProductGrid({ products, accentColor }: ProductGridProps) {
  const { selectProduct } = useCartUI();

  // Filter only available products for display
  const availableProducts = products.filter(p => p.isAvailable && p.active);

  if (availableProducts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-2">📦</div>
        <p>No hay productos disponibles en esta categoría</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {availableProducts.map((product) => (
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
  product: CatalogProduct;
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
        {product.image ? (
          <Image
            src={product.image}
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
        
        {/* Badge: Producto de plantilla */}
        {product.isFromTemplate && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
            Plantilla
          </div>
        )}
        
        {/* Badge: Sin stock */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
              Agotado
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
        {/* Brand */}
        {product.brand && (
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            {product.brand}
          </span>
        )}
        
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

// ═══════════════════════════════════════════════════════════
// CATEGORY SECTION (Inline for grouped display)
// ═══════════════════════════════════════════════════════════

interface CategoryProductGridProps {
  categoryName: string;
  products: CatalogProduct[];
  accentColor: string;
}

export function CategoryProductGrid({ 
  categoryName, 
  products, 
  accentColor 
}: CategoryProductGridProps) {
  const { selectProduct } = useCartUI();

  const availableProducts = products.filter(p => p.isAvailable && p.active);

  if (availableProducts.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        {categoryName}
        <span className="text-sm font-normal text-gray-500">
          ({availableProducts.length})
        </span>
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {availableProducts.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            accentColor={accentColor}
            onClick={() => selectProduct(product)}
          />
        ))}
      </div>
    </section>
  );
}
