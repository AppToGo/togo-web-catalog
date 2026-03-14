/**
 * CartUIContext - Client Component
 * 
 * SOLO gestiona el estado de UI del carrito.
 * Separado de CartContext para evitar re-renderizados innecesarios.
 * 
 * SIGUIENTE SRP: Solo estado de UI, nada de datos del carrito.
 */

'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { Product } from '@/lib/types';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface CartUIContextType {
  isCartOpen: boolean;
  selectedProduct: Product | null;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  selectProduct: (product: Product | null) => void;
}

// ═══════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════

const CartUIContext = createContext<CartUIContextType | undefined>(undefined);

// ═══════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════

interface CartUIProviderProps {
  children: ReactNode;
}

export function CartUIProvider({ children }: CartUIProviderProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen(prev => !prev);
  const selectProduct = (product: Product | null) => setSelectedProduct(product);

  return (
    <CartUIContext.Provider value={{
      isCartOpen,
      selectedProduct,
      openCart,
      closeCart,
      toggleCart,
      selectProduct,
    }}>
      {children}
    </CartUIContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════

export function useCartUI() {
  const context = useContext(CartUIContext);
  if (!context) {
    throw new Error('useCartUI must be used within CartUIProvider');
  }
  return context;
}
