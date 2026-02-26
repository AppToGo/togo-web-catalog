'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import type { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAdd: () => void;
  onUpdate: (delta: number) => void;
  onClick: () => void;
  accentColor: string;
}

export function ProductCard({ 
  product, 
  quantityInCart, 
  onAdd, 
  onUpdate, 
  onClick,
  accentColor 
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      {/* Imagen del producto */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {product.imageUrl && !imageError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
        
        {/* Badge de cantidad en carrito */}
        {quantityInCart > 0 && (
          <div 
            className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold text-white shadow-lg"
            style={{ backgroundColor: accentColor }}
          >
            {quantityInCart} en carrito
          </div>
        )}
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

          {/* Botones de cantidad */}
          {quantityInCart > 0 ? (
            <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(-1);
                }}
                className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="w-6 text-center font-semibold text-sm">
                {quantityInCart}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(1);
                }}
                className="w-8 h-8 rounded-full text-white shadow-sm flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
                style={{ backgroundColor: accentColor }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              className="w-10 h-10 rounded-full text-white shadow-md flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
              style={{ backgroundColor: accentColor }}
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
