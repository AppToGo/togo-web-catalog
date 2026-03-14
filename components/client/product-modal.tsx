/**
 * ProductModal - Client Component
 * 
 * Modal de detalle de producto - SIEMPRE MONTADO para animaciones suaves.
 * 
 * Updated for normalized catalog (BusinessProduct + GlobalProduct)
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { X } from 'lucide-react';
import { useCart } from './cart-context';
import { useCartUI } from './cart-ui-context';
import { formatPrice } from '@/lib/utils';
import { AddToCartModalControls, StockIndicator } from './add-to-cart-button';

interface ProductModalProps {
  token: string;
  accentColor: string;
}

export function ProductModal({ accentColor }: ProductModalProps) {
  const { cart, getStockForProduct } = useCart();
  const { selectedProduct, selectProduct } = useCartUI();
  const [imageError, setImageError] = useState(false);
  
  // El componente SIEMPRE está montado
  const [animationClass, setAnimationClass] = useState('translate-y-full opacity-0');
  const [overlayOpacity, setOverlayOpacity] = useState('opacity-0');
  const [pointerEvents, setPointerEvents] = useState('pointer-events-none');

  const isOpen = !!selectedProduct;
  const product = selectedProduct;
  const cartItem = product ? cart.items.find(i => i.productId === product.id) : null;
  const quantityInCart = cartItem?.quantity || 0;
  const remainingStock = product ? getStockForProduct(product.id, product.stock) : Infinity;

  // Efecto para manejar apertura/cierre
  useEffect(() => {
    if (isOpen) {
      // Prevenir scroll
      document.body.style.overflow = 'hidden';
      // Activar pointer events
      setPointerEvents('pointer-events-auto');
      // Pequeño delay para asegurar que se aplique pointer-events
      requestAnimationFrame(() => {
        // Animar entrada
        setAnimationClass('translate-y-0 opacity-100 sm:scale-100');
        setOverlayOpacity('opacity-100');
      });
    } else {
      // Animar salida
      setAnimationClass('translate-y-full opacity-0 sm:translate-y-0 sm:scale-95');
      setOverlayOpacity('opacity-0');
      // Esperar animación para desactivar pointer events
      const timer = setTimeout(() => {
        setPointerEvents('pointer-events-none');
        document.body.style.overflow = '';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keyboard: Escape para cerrar
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') handleClose();
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    if (isOpen) setImageError(false);
  }, [product?.id, isOpen]);

  const handleClose = useCallback(() => {
    selectProduct(null);
  }, [selectProduct]);

  // SIEMPRE renderizamos, nunca return null
  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out ${overlayOpacity} ${pointerEvents}`}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      role="dialog"
      aria-modal="true"
      aria-label={product ? `Detalle de ${product.name}` : 'Detalle de producto'}
      aria-hidden={!isOpen}
    >
      {/* Modal - siempre en DOM */}
      <div 
        className={`bg-white w-full max-w-lg overflow-hidden shadow-2xl sm:rounded-3xl rounded-t-3xl transition-all duration-300 ease-out ${animationClass}`}
      >
        {/* Imagen */}
        <div className="relative aspect-video bg-gray-100">
          {product?.image && !imageError ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl" role="img" aria-label="Producto">🍽️</span>
            </div>
          )}
          
          {/* Badge: Template */}
          {product?.isFromTemplate && (
            <div className="absolute top-4 left-4 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-full">
              Plantilla
            </div>
          )}
          
          {/* Badge: Brand */}
          {product?.brand && !product.isFromTemplate && (
            <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 text-white text-sm font-medium rounded-full">
              {product.brand}
            </div>
          )}
          
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors active:scale-95"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Brand */}
          {product?.brand && (
            <span className="text-sm text-gray-500 uppercase tracking-wide">
              {product.brand}
            </span>
          )}
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{product?.name}</h2>

          {product?.description && (
            <p className="text-gray-600 mb-4">{product.description}</p>
          )}

          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl font-bold text-gray-900">
              {product ? formatPrice(product.price) : ''}
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
          
          {/* Stock indicator */}
          <div className="mb-6">
            <StockIndicator 
              stock={product?.stock} 
              quantityInCart={quantityInCart}
            />
          </div>

          {product && (
            <AddToCartModalControls
              product={product}
              accentColor={accentColor}
              onClose={handleClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
