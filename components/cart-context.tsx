'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import type { Cart, CartItem } from '@/lib/types';

interface CartContextType {
  cart: Cart;
  itemCount: number;
  isLoading: boolean;
  isSyncing: boolean;
  addItem: (item: CartItem) => Promise<void>;
  updateItem: (productId: string, delta: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  syncCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const emptyCart: Cart = {
  items: [],
  updatedAt: new Date().toISOString(),
};

export function CartProvider({ 
  children, 
  token,
}: { 
  children: ReactNode; 
  token: string;
}) {
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Refs para controlar la carga inicial
  const hasLoaded = useRef(false);
  const isLoadingRef = useRef(false);
  // Track pending operations
  const pendingOps = useRef(0);

  // Cargar carrito del servidor SOLO UNA VEZ al montar el componente
  useEffect(() => {
    if (hasLoaded.current || isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    
    const loadCart = async () => {
      try {
        const response = await fetch(`/api/cart?token=${token}`, {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          setCart(data);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      } finally {
        setIsLoading(false);
        hasLoaded.current = true;
        isLoadingRef.current = false;
      }
    };

    loadCart();
  }, [token]);

  // Sincronizar carrito con el servidor
  const syncCart = useCallback(async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(`/api/cart?token=${token}`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setCart(data);
      }
    } catch (error) {
      console.error('Error syncing cart:', error);
    } finally {
      // Esperar un poco para asegurar que todas las operaciones pendientes terminen
      setTimeout(() => {
        if (pendingOps.current === 0) {
          setIsSyncing(false);
        }
      }, 500);
    }
  }, [token]);

  // Agregar item - actualiza local y servidor
  const addItem = useCallback(async (item: CartItem) => {
    pendingOps.current += 1;
    setIsSyncing(true);
    
    // Actualización optimista inmediata
    setCart(prev => {
      const existingIndex = prev.items.findIndex(i => i.productId === item.productId);
      let newItems;
      
      if (existingIndex >= 0) {
        newItems = [...prev.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + item.quantity
        };
      } else {
        newItems = [...prev.items, item];
      }
      
      return {
        items: newItems,
        updatedAt: new Date().toISOString(),
      };
    });

    // Sincronizar con servidor
    try {
      await fetch(`/api/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        }),
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      pendingOps.current -= 1;
      if (pendingOps.current === 0) {
        setIsSyncing(false);
      }
    }
  }, [token]);

  // Actualizar cantidad - actualiza local y servidor
  const updateItem = useCallback(async (productId: string, delta: number) => {
    const currentItem = cart.items.find(i => i.productId === productId);
    if (!currentItem) return;

    pendingOps.current += 1;
    setIsSyncing(true);

    // Actualización optimista inmediata
    setCart(prev => {
      const newItems = prev.items.map(item => {
        if (item.productId === productId) {
          const newQuantity = item.quantity + delta;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
        }
        return item;
      }).filter(Boolean) as typeof prev.items;
      
      return {
        items: newItems,
        updatedAt: new Date().toISOString(),
      };
    });

    // Sincronizar con servidor
    try {
      await fetch(`/api/cart/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          productId,
          name: currentItem.name,
          price: currentItem.price,
          delta,
        }),
      });
    } catch (error) {
      console.error('Error updating cart:', error);
    } finally {
      pendingOps.current -= 1;
      if (pendingOps.current === 0) {
        setIsSyncing(false);
      }
    }
  }, [token, cart.items]);

  // Eliminar item - actualiza local y servidor
  const removeItem = useCallback(async (productId: string) => {
    pendingOps.current += 1;
    setIsSyncing(true);

    // Actualización optimista inmediata
    setCart(prev => ({
      items: prev.items.filter(item => item.productId !== productId),
      updatedAt: new Date().toISOString(),
    }));

    // Sincronizar con servidor
    try {
      await fetch(`/api/cart/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          productId,
        }),
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
    } finally {
      pendingOps.current -= 1;
      if (pendingOps.current === 0) {
        setIsSyncing(false);
      }
    }
  }, [token]);

  // Limpiar carrito completamente
  const clearCart = useCallback(async () => {
    pendingOps.current += 1;
    setIsSyncing(true);

    // Actualización optimista inmediata
    setCart(emptyCart);

    // Sincronizar con servidor
    try {
      await fetch(`/api/cart/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      pendingOps.current -= 1;
      if (pendingOps.current === 0) {
        setIsSyncing(false);
      }
    }
  }, [token]);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      itemCount,
      isLoading,
      isSyncing,
      addItem,
      updateItem,
      removeItem,
      clearCart,
      syncCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
