'use client';

import { useEffect, useCallback, useTransition } from 'react';
import type { Product } from '@/lib/types';
import { addToCartAction } from '@/lib/actions';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  quantityInCart: number;
  token: string;
}

export function ProductModal({ product, isOpen, onClose, quantityInCart, token }: ProductModalProps) {
  const [isPending, startTransition] = useTransition();

  // Cerrar con tecla Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
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

  // Cerrar al hacer click en el overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Agregar al carrito usando Server Action
  const handleAddToCart = () => {
    if (!product || isPending) return;

    const formData = new FormData();
    formData.append('token', token);
    formData.append('productId', product.id);
    formData.append('name', product.name);
    formData.append('price', product.price.toString());

    startTransition(async () => {
      await addToCartAction(formData);
      onClose(); // Cerrar modal después de agregar
    });
  };

  if (!isOpen || !product) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[var(--color-card)] rounded-2xl shadow-2xl animate-slideUp">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Imagen del producto */}
        <div className="relative aspect-video bg-[var(--color-muted)]">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-20 h-20 text-[var(--color-muted-foreground)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Nombre y precio */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-2xl font-bold text-[var(--color-foreground)]">
              {product.name}
            </h2>
            <span className="text-2xl font-bold text-[var(--color-primary)] whitespace-nowrap">
              {formatPrice(product.price)}
            </span>
          </div>

          {/* SKU */}
          <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
            SKU: {product.sku}
          </p>

          {/* Descripción */}
          {product.description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-2">
                Descripción
              </h3>
              <p className="text-[var(--color-muted-foreground)] leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Estado en carrito */}
          {quantityInCart > 0 && (
            <div className="mb-4 p-3 bg-[var(--color-primary)]/10 rounded-lg">
              <p className="text-sm text-[var(--color-primary)] font-medium">
                {quantityInCart} {quantityInCart === 1 ? 'unidad' : 'unidades'} en el carrito
              </p>
            </div>
          )}

          {/* Botón agregar al carrito */}
          <button
            onClick={handleAddToCart}
            disabled={isPending}
            className="w-full py-3 px-4 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Agregando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Agregar al carrito
              </>
            )}
          </button>
        </div>
      </div>

      {/* Animaciones CSS */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
