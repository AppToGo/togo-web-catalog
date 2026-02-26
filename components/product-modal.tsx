'use client';

import { useEffect, useCallback, useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useCart } from './cart-context';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  quantityInCart: number;
  token?: string;
  accentColor: string;
}

export function ProductModal({ 
  product, 
  isOpen, 
  onClose, 
  quantityInCart, 
  token,
  accentColor 
}: ProductModalProps) {
  const { addItem, updateItem } = useCart();
  const [imageError, setImageError] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !product) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
    onClose();
  };

  const handleUpdate = (delta: number) => {
    updateItem(product.id, delta);
    if (quantityInCart + delta <= 0) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-lg sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl animate-slideUp">
        {/* Imagen */}
        <div className="relative aspect-video bg-gray-100">
          {product.imageUrl && !imageError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">🍽️</span>
            </div>
          )}
          
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {product.name}
          </h2>

          {product.description && (
            <p className="text-gray-600 mb-4">
              {product.description}
            </p>
          )}

          <div className="flex items-center justify-between mb-6">
            <span className="text-3xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>

            {quantityInCart > 0 && (
              <span 
                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: accentColor }}
              >
                {quantityInCart} en carrito
              </span>
            )}
          </div>

          {/* Botones de acción */}
          {quantityInCart > 0 ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 bg-gray-100 rounded-full p-2">
                <button
                  onClick={() => handleUpdate(-1)}
                  className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
                >
                  <Minus className="w-5 h-5 text-gray-600" />
                </button>
                <span className="w-12 text-center font-bold text-xl">
                  {quantityInCart}
                </span>
                <button
                  onClick={() => handleUpdate(1)}
                  className="w-12 h-12 rounded-full text-white shadow-sm flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
                  style={{ backgroundColor: accentColor }}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-full font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: accentColor }}
              >
                Listo
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="w-full py-4 rounded-full font-bold text-white text-lg shadow-lg hover:opacity-95 active:scale-[0.98] transition-all"
              style={{ backgroundColor: accentColor }}
            >
              Agregar al carrito
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
