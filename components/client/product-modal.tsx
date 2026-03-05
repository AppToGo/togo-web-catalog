/**
 * ProductModal - Client Component
 * 
 * Modal de detalle de producto con controles de cantidad.
 * Usa CartContext (datos/operaciones) y CartUIContext (UI) separados.
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { X } from 'lucide-react';
import { useCart } from './cart-context';
import { useCartUI } from './cart-ui-context';
import { formatPrice } from '@/lib/utils';
import { AddToCartModalControls } from './add-to-cart-button';

interface ProductModalProps {
  token: string;
  accentColor: string;
}

export function ProductModal({ accentColor }: ProductModalProps) {
  const { cart } = useCart();
  const { selectedProduct, selectProduct } = useCartUI();
  const [imageError, setImageError] = useState(false);

  const isOpen = !!selectedProduct;
  const product = selectedProduct;

  // Cantidad en carrito
  const cartItem = product 
    ? cart.items.find(i => i.productId === product.id)
    : null;
  const quantityInCart = cartItem?.quantity || 0;

  // Keyboard: Escape para cerrar
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      selectProduct(null);
    }
  }, [selectProduct]);

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

  // Reset image error when product changes
  useEffect(() => {
    setImageError(false);
  }, [product?.id]);

  if (!isOpen || !product) return null;

  const handleClose = () => selectProduct(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de ${product.name}`}
    >
      <div 
        className="bg-white w-full max-w-lg sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-300"
      >
        {/* Imagen */}
        <div className="relative aspect-video bg-gray-100">
          {product.imageUrl && !imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl" role="img" aria-label="Producto">🍽️</span>
            </div>
          )}
          
          {/* Botón cerrar */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            aria-label="Cerrar modal"
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
          <AddToCartModalControls
            product={product}
            accentColor={accentColor}
            onClose={handleClose}
          />
        </div>
      </div>
    </div>
  );
}
