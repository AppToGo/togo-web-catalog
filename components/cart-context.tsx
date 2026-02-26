'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import type { Cart, CartItem } from '@/lib/types';

interface CartContextType {
  cart: Cart;
  itemCount: number;
  isLoading: boolean;
  addItem: (item: CartItem) => Promise<void>;
  updateItem: (productId: string, delta: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
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
  
  // Refs para controlar la carga inicial
  const hasLoaded = useRef(false);
  const isLoadingRef = useRef(false);

  // Cargar carrito del servidor SOLO UNA VEZ al montar el componente
  useEffect(() => {
    // Evitar cargas múltiples
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
  }, [token]); // Solo se ejecuta cuando cambia el token (nunca dentro de la misma sesión)

  // Agregar item - actualiza local y servidor (fire and forget)
  const addItem = useCallback(async (item: CartItem) => {
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

    // Sincronizar con servidor (no esperamos respuesta, no actualizamos estado)
    fetch(`/api/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }),
    }).catch(error => {
      console.error('Error adding to cart:', error);
    });
  }, [token]);

  // Actualizar cantidad - actualiza local y servidor
  const updateItem = useCallback(async (productId: string, delta: number) => {
    // Encontrar el item primero para obtener datos
    const currentItem = cart.items.find(i => i.productId === productId);
    if (!currentItem) return;

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

    // Sincronizar con servidor (fire and forget)
    fetch(`/api/cart/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        productId,
        name: currentItem.name,
        price: currentItem.price,
        delta,
      }),
    }).catch(error => {
      console.error('Error updating cart:', error);
    });
  }, [token, cart.items]);

  // Eliminar item - actualiza local y servidor
  const removeItem = useCallback(async (productId: string) => {
    // Actualización optimista inmediata
    setCart(prev => ({
      items: prev.items.filter(item => item.productId !== productId),
      updatedAt: new Date().toISOString(),
    }));

    // Sincronizar con servidor (fire and forget)
    fetch(`/api/cart/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        productId,
      }),
    }).catch(error => {
      console.error('Error removing from cart:', error);
    });
  }, [token]);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      itemCount,
      isLoading,
      addItem,
      updateItem,
      removeItem,
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
