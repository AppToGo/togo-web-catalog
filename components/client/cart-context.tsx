/**
 * CartContext - Client Component
 * 
 * SOLO gestiona el estado del carrito (datos).
 * Usa Server Actions en lugar de fetch para operaciones.
 * 
 * FIX HIDRATACIÓN:
 * - Estado inicial vacío (consistente SSR/Cliente)
 * - localStorage solo en useEffect (post-hidratación)
 * - Flag isHydrated para controlar carga inicial
 */

'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import type { Cart, CartItem } from '@/lib/types';
import {
  addToCartAction,
  updateCartItemAction,
  removeFromCartAction,
  clearCartAction,
  getCartAction,
} from '@/lib/cart-actions';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface CartContextType {
  cart: Cart;
  itemCount: number;
  isLoading: boolean;
  isSyncing: boolean;
  isHydrated: boolean;
  addItem: (item: CartItem) => void;
  updateItem: (productId: string, delta: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  syncCart: () => Promise<void>;
}

// ═══════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════

const emptyCart: Cart = {
  items: [],
  updatedAt: new Date().toISOString(),
};

const CartContext = createContext<CartContextType | undefined>(undefined);

// ═══════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════

interface CartProviderProps {
  children: ReactNode;
  token: string;
}

export function CartProvider({ children, token }: CartProviderProps) {
  // Estado: Solo datos del carrito
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Refs para control de sincronización
  const pendingOps = useRef(0);

  // ═══════════════════════════════════════════════════════
  // HIDRATACIÓN: localStorage SOLO después de montar
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    // 1. Cargar de localStorage (solo en cliente)
    const saved = localStorage.getItem(`cart-${token}`);
    if (saved) {
      try {
        const parsed: Cart = JSON.parse(saved);
        // Validar que tenga la estructura correcta
        if (parsed && Array.isArray(parsed.items)) {
          setCart(parsed);
        }
      } catch {
        // Ignorar errores de parsing
      }
    }
    
    // 2. Marcar como hidratado
    setIsHydrated(true);
    setIsLoading(false);

    // 3. Sync con servidor en background (no bloqueante)
    syncCart();
  }, [token]);

  // Persistir en localStorage cuando cambia (solo post-hidratación)
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(`cart-${token}`, JSON.stringify(cart));
    }
  }, [cart, token, isHydrated]);

  // ═══════════════════════════════════════════════════════
  // SINCRONIZACIÓN CON SERVIDOR (Server Action)
  // ═══════════════════════════════════════════════════════
  const syncCart = useCallback(async () => {
    setIsSyncing(true);
    try {
      const serverCart = await getCartAction(token);
      // Solo actualizar si hay cambios significativos
      setCart(prev => {
        const sortByProductId = (items: CartItem[]) => 
          [...items].sort((a: CartItem, b: CartItem) => a.productId.localeCompare(b.productId));
        const prevJson = JSON.stringify(sortByProductId(prev.items));
        const newJson = JSON.stringify(sortByProductId(serverCart.items));
        if (prevJson !== newJson) {
          return serverCart;
        }
        return prev;
      });
    } catch (error) {
      console.error('Error syncing cart:', error);
    } finally {
      if (pendingOps.current === 0) {
        setIsSyncing(false);
      }
    }
  }, [token]);

  // ═══════════════════════════════════════════════════════
  // AGREGAR ITEM (optimista + rollback)
  // ═══════════════════════════════════════════════════════
  const addItem = useCallback(async (item: CartItem) => {
    const previousCart = cart; // Guardar para rollback
    pendingOps.current += 1;
    setIsSyncing(true);
    
    // Actualización optimista inmediata
    setCart(prev => {
      const existingIndex = prev.items.findIndex(i => i.productId === item.productId);
      
      if (existingIndex >= 0) {
        const newItems = [...prev.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + item.quantity
        };
        return { items: newItems, updatedAt: new Date().toISOString() };
      }
      
      return {
        items: [...prev.items, item],
        updatedAt: new Date().toISOString(),
      };
    });

    // Server Action con rollback
    try {
      const result = await addToCartAction(token, item);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      // Rollback al estado anterior
      setCart(previousCart);
      console.error('Error adding item:', error);
    } finally {
      pendingOps.current -= 1;
      if (pendingOps.current === 0) setIsSyncing(false);
    }
  }, [token, cart]);

  // ═══════════════════════════════════════════════════════
  // ACTUALIZAR CANTIDAD (optimista + rollback)
  // ═══════════════════════════════════════════════════════
  const updateItem = useCallback(async (productId: string, delta: number) => {
    const currentItem = cart.items.find(i => i.productId === productId);
    if (!currentItem) return;

    const previousCart = cart; // Guardar para rollback
    pendingOps.current += 1;
    setIsSyncing(true);

    setCart(prev => ({
      items: prev.items
        .map(item => {
          if (item.productId === productId) {
            const newQuantity = item.quantity + delta;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[],
      updatedAt: new Date().toISOString(),
    }));

    try {
      const result = await updateCartItemAction(token, productId, delta);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      // Rollback
      setCart(previousCart);
      console.error('Error updating item:', error);
    } finally {
      pendingOps.current -= 1;
      if (pendingOps.current === 0) setIsSyncing(false);
    }
  }, [token, cart]);

  // ═══════════════════════════════════════════════════════
  // ELIMINAR ITEM (optimista + rollback)
  // ═══════════════════════════════════════════════════════
  const removeItem = useCallback(async (productId: string) => {
    const previousCart = cart; // Guardar para rollback
    pendingOps.current += 1;
    setIsSyncing(true);

    setCart(prev => ({
      items: prev.items.filter(item => item.productId !== productId),
      updatedAt: new Date().toISOString(),
    }));

    try {
      const result = await removeFromCartAction(token, productId);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      // Rollback
      setCart(previousCart);
      console.error('Error removing item:', error);
    } finally {
      pendingOps.current -= 1;
      if (pendingOps.current === 0) setIsSyncing(false);
    }
  }, [token, cart]);

  // ═══════════════════════════════════════════════════════
  // LIMPIAR CARRITO (optimista + rollback)
  // ═══════════════════════════════════════════════════════
  const clearCart = useCallback(async () => {
    const previousCart = cart; // Guardar para rollback
    pendingOps.current += 1;
    setIsSyncing(true);

    setCart(emptyCart);

    try {
      const result = await clearCartAction(token);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      // Rollback
      setCart(previousCart);
      console.error('Error clearing cart:', error);
    } finally {
      pendingOps.current -= 1;
      if (pendingOps.current === 0) setIsSyncing(false);
    }
  }, [token, cart]);

  // Contador derivado
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      itemCount,
      isLoading,
      isSyncing,
      isHydrated,
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

// ═══════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
