'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import type { Cart } from '@/lib/types';

interface CartContextType {
  cart: Cart;
  itemCount: number;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const emptyCart: Cart = {
  items: [],
  updatedAt: new Date().toISOString(),
};

interface CartProviderProps {
  token: string;
  children: ReactNode;
  initialItemCount?: number;
}

export function CartProvider({ token, children, initialItemCount = 0 }: CartProviderProps) {
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [itemCount, setItemCount] = useState(initialItemCount);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const response = await fetch(`/api/cart?token=${token}`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setCart(data);
        setItemCount(data.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0));
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    
    // Refrescar carrito cada 10 segundos
    const interval = setInterval(fetchCart, 10000);
    return () => clearInterval(interval);
  }, [token]);

  return (
    <CartContext.Provider value={{ cart, itemCount, isLoading, refreshCart: fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
