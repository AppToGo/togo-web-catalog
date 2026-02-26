'use client';

import { useState } from 'react';
import { useCart } from './cart-context';
import type { Product } from '@/lib/types';

interface AddToCartButtonProps {
  product: Product;
  token: string;
  quantityInCart?: number;
}

export function AddToCartButton({ product, quantityInCart }: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCart();

  const handleAdd = async () => {
    if (isAdding) return;
    
    setIsAdding(true);
    
    // Actualización optimista - agrega inmediatamente
    await addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
    
    setIsAdding(false);
  };

  return (
    <button
      onClick={handleAdd}
      disabled={isAdding}
      className={`
        flex items-center gap-1 px-3 py-1.5 
        bg-[var(--color-primary)] text-[var(--color-primary-foreground)] 
        text-sm font-medium rounded-full 
        transition-all
        ${isAdding 
          ? 'opacity-70 scale-95' 
          : 'hover:opacity-90 active:scale-95'
        }
      `}
    >
      {isAdding ? (
        <>
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Agregando...</span>
        </>
      ) : quantityInCart ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Agregar ({quantityInCart})</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Agregar</span>
        </>
      )}
    </button>
  );
}
