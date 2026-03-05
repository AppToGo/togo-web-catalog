/**
 * AddToCartButton - Client Component
 * 
 * Componente interactivo para agregar productos al carrito.
 * Incluye variantes para diferentes contextos:
 * - Botón simple (+)
 * - Controles de cantidad (+/-)
 * - Badge de cantidad
 * 
 * OPTIMIZACIONES:
 * - Actualizaciones optimistas (sin esperar servidor)
 * - Event delegation para mejorar performance
 * - Mínimo re-renderizado
 */

'use client';

import { useCallback } from 'react';
import { Plus, Minus } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useCart } from './cart-context';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface AddToCartButtonProps {
  product: Product;
  accentColor: string;
  size?: 'sm' | 'md' | 'lg';
}

interface QuantityBadgeProps {
  productId: string;
  accentColor: string;
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════

export function AddToCartButton({ 
  product, 
  accentColor,
  size = 'md'
}: AddToCartButtonProps) {
  const { addItem, updateItem, cart } = useCart();
  
  // Buscar cantidad actual en el carrito
  const cartItem = cart.items.find(item => item.productId === product.id);
  const quantity = cartItem?.quantity || 0;

  // Handlers
  const handleAdd = useCallback(() => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  }, [addItem, product]);

  const handleUpdate = useCallback((delta: number) => {
    updateItem(product.id, delta);
  }, [updateItem, product.id]);

  // Tamaños
  const sizes = {
    sm: { button: 'w-7 h-7', icon: 'w-3 h-3', count: 'w-5 text-xs' },
    md: { button: 'w-10 h-10', icon: 'w-5 h-5', count: 'w-6 text-sm' },
    lg: { button: 'w-12 h-12', icon: 'w-6 h-6', count: 'w-8 text-base' },
  };

  const s = sizes[size];

  // Si ya hay items, mostrar controles de cantidad
  if (quantity > 0) {
    return (
      <div 
        className="flex items-center gap-1 bg-gray-100 rounded-full p-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => handleUpdate(-1)}
          className={`${s.button} rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all`}
          aria-label="Disminuir cantidad"
        >
          <Minus className={`${s.icon} text-gray-600`} />
        </button>
        
        <span className={`${s.count} text-center font-semibold`}>
          {quantity}
        </span>
        
        <button
          onClick={() => handleUpdate(1)}
          className={`${s.button} rounded-full text-white shadow-sm flex items-center justify-center hover:opacity-90 active:scale-95 transition-all`}
          style={{ backgroundColor: accentColor }}
          aria-label="Aumentar cantidad"
        >
          <Plus className={s.icon} />
        </button>
      </div>
    );
  }

  // Botón simple para agregar
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleAdd();
      }}
      className={`${s.button} rounded-full text-white shadow-md flex items-center justify-center hover:opacity-90 active:scale-95 transition-all`}
      style={{ backgroundColor: accentColor }}
      aria-label={`Agregar ${product.name} al carrito`}
    >
      <Plus className={s.icon} />
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// BADGE DE CANTIDAD (Sub-componente)
// ═══════════════════════════════════════════════════════════

export function QuantityBadge({ productId, accentColor }: QuantityBadgeProps) {
  const { cart } = useCart();
  const item = cart.items.find(i => i.productId === productId);
  
  if (!item || item.quantity === 0) return null;

  return (
    <div 
      className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold text-white shadow-lg animate-in zoom-in"
      style={{ backgroundColor: accentColor }}
    >
      {item.quantity} en carrito
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// VARIANTE PARA MODAL (más grande)
// ═══════════════════════════════════════════════════════════

export function AddToCartModalControls({ 
  product, 
  accentColor,
  onClose 
}: AddToCartButtonProps & { onClose?: () => void }) {
  const { addItem, updateItem, cart } = useCart();
  
  const cartItem = cart.items.find(item => item.productId === product.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = useCallback(() => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
    onClose?.();
  }, [addItem, product, onClose]);

  const handleUpdate = useCallback((delta: number) => {
    updateItem(product.id, delta);
    if (quantity + delta <= 0) {
      onClose?.();
    }
  }, [updateItem, product.id, quantity, onClose]);

  if (quantity > 0) {
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3 bg-gray-100 rounded-full p-2">
          <button
            onClick={() => handleUpdate(-1)}
            className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
            aria-label="Disminuir cantidad"
          >
            <Minus className="w-5 h-5 text-gray-600" />
          </button>
          
          <span className="w-12 text-center font-bold text-xl">
            {quantity}
          </span>
          
          <button
            onClick={() => handleUpdate(1)}
            className="w-12 h-12 rounded-full text-white shadow-sm flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
            style={{ backgroundColor: accentColor }}
            aria-label="Aumentar cantidad"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <button
          onClick={() => onClose?.()}
          className="px-6 py-3 rounded-full font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: accentColor }}
        >
          Listo
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleAdd}
      className="w-full py-4 rounded-full font-bold text-white text-lg shadow-lg hover:opacity-95 active:scale-[0.98] transition-all"
      style={{ backgroundColor: accentColor }}
    >
      Agregar al carrito
    </button>
  );
}
