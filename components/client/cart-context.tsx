/**
 * CartContext - Client Component
 * 
 * Gestiona estado del carrito usando sessionId para el backend.
 * El sessionId se genera una vez y se almacena en localStorage.
 * 
 * Updated for normalized catalog:
 * - Uses BusinessProduct IDs (productId field)
 * - Handles stock validation
 */

'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import type { Cart, CartItem, CustomerOrigin, CustomerData } from '@/src/types/catalog.types';
import {
  addToCartAction,
  updateCartItemAction,
  removeFromCartAction,
  clearCartAction,
  getCartAction,
  addToCartPublicAction,
  removeFromCartPublicAction,
  updateCartItemPublicAction,
  getCartPublicAction,
} from '@/lib/cart-actions';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface CartContextType {
  // Cart state
  cart: Cart;
  itemCount: number;
  isLoading: boolean;
  isSyncing: boolean;
  isHydrated: boolean;
  // Customer state
  customer: CustomerData;
  isIdentified: boolean;
  sessionId: string;
  /** Branch ID when catalog is scoped to a specific sede */
  branchId?: string;
  /** Phone number of the branch; undefined when the branch has no dedicated number (falls back to business phone) */
  branchPhone?: string;
  /** WhatsApp token from ?t= query param; used to authenticate web-catalog endpoints */
  whatsappToken?: string;
  // Actions
  addItem: (item: CartItem) => void;
  updateItem: (productId: string, delta: number) => void;
  removeItem: (productId: string) => void;
  updateItemNotes: (productId: string, notes: string) => Promise<void>;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  setCustomerPhone: (phone: string) => void;
  setCustomerName: (name: string) => void;
  // Stock validation
  getStockForProduct: (productId: string, availableStock?: number) => number;
}

// ═══════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════

const emptyCart: Cart = {
  items: [],
  updatedAt: new Date().toISOString(),
};

const defaultCustomer: CustomerData = {
  origin: 'direct',
  isIdentified: false,
};

// Genera un sessionId único
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// ═══════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════

interface CartProviderProps {
  children: ReactNode;
  businessSlug: string;
  origin?: CustomerOrigin;
  tableNumber?: string;
  initialPhone?: string;
  initialName?: string;
  isAuthenticated?: boolean;
  /** Branch ID when catalog is scoped to a specific sede */
  branchId?: string;
  /** Phone number of the branch; undefined when the branch has no dedicated number (falls back to business phone) */
  branchPhone?: string;
  /** WhatsApp token from ?t= query param; required for web-catalog token-authenticated endpoints */
  whatsappToken?: string;
}

export function CartProvider({
  children,
  businessSlug,
  origin = 'direct',
  tableNumber,
  initialPhone,
  initialName,
  isAuthenticated = false,
  branchId,
  branchPhone,
  whatsappToken,
}: CartProviderProps) {
  // Cart state
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  
  // Customer state
  const [customer, setCustomer] = useState<CustomerData>({
    origin,
    phone: initialPhone,
    name: initialName,
    tableNumber,
    isIdentified: isAuthenticated || !!initialPhone,
  });
  
  // Refs
  const pendingOps = useRef(0);

  // ═══════════════════════════════════════════════════════
  // HIDRATACIÓN: Cargar desde localStorage
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    // Generar o recuperar sessionId
    const storageKey = `session-${businessSlug}`;
    let savedSessionId = localStorage.getItem(storageKey);
    if (!savedSessionId) {
      savedSessionId = generateSessionId();
      localStorage.setItem(storageKey, savedSessionId);
    }
    setSessionId(savedSessionId);

    // Cargar carrito
    const savedCart = localStorage.getItem(`cart-${businessSlug}`);
    if (savedCart) {
      try {
        const parsed: Cart = JSON.parse(savedCart);
        if (parsed && Array.isArray(parsed.items)) {
          setCart(parsed);
        }
      } catch { /* ignore */ }
    }
    
    // Cargar customer si no está autenticado
    if (!isAuthenticated) {
      const savedPhone = localStorage.getItem(`customer-phone-${businessSlug}`);
      const savedName = localStorage.getItem(`customer-name-${businessSlug}`);
      if (savedPhone) {
        setCustomer(prev => ({
          ...prev,
          phone: savedPhone,
          name: savedName || prev.name,
          isIdentified: true,
        }));
      }
    }
    
    setIsHydrated(true);
    setIsLoading(false);
  }, [businessSlug, isAuthenticated]);

  // Sincronizar carrito con backend cuando tengamos sessionId
  useEffect(() => {
    if (isHydrated && sessionId) {
      syncCart();
    }
  }, [isHydrated, sessionId]);

  // Persistir carrito
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(`cart-${businessSlug}`, JSON.stringify(cart));
    }
  }, [cart, businessSlug, isHydrated]);

  // Persistir customer
  useEffect(() => {
    if (isHydrated && customer.phone) {
      localStorage.setItem(`customer-phone-${businessSlug}`, customer.phone);
      if (customer.name) {
        localStorage.setItem(`customer-name-${businessSlug}`, customer.name);
      }
    }
  }, [customer.phone, customer.name, businessSlug, isHydrated]);

  // ═══════════════════════════════════════════════════════
  // SINCRONIZACIÓN
  // ═══════════════════════════════════════════════════════
  const syncCart = useCallback(async () => {
    if (!sessionId) return;

    setIsSyncing(true);
    try {
      const serverCart = branchId
        ? await getCartPublicAction(businessSlug, { sessionId, branchId })
        : await getCartAction(businessSlug, { sessionId });
      
      setCart(prev => {
        const mergedItems = serverCart.items.map(si => ({
          ...si,
          // Preserve local notes if server doesn't have them
          notes: si.notes ?? prev.items.find(p => p.productId === si.productId)?.notes,
        }));
        const mergedCart = { ...serverCart, items: mergedItems };
        const sortByProductId = (items: CartItem[]) =>
          [...items].sort((a, b) => a.productId.localeCompare(b.productId));
        const prevJson = JSON.stringify(sortByProductId(prev.items));
        const newJson = JSON.stringify(sortByProductId(mergedCart.items));
        if (prevJson !== newJson) return mergedCart;
        return prev;
      });
    } catch (error) {
      console.error('Error syncing cart:', error);
    } finally {
      if (pendingOps.current === 0) setIsSyncing(false);
    }
  }, [businessSlug, branchId, sessionId]);

  // ═══════════════════════════════════════════════════════
  // STOCK VALIDATION HELPER
  // ═══════════════════════════════════════════════════════
  const getStockForProduct = useCallback((productId: string, availableStock?: number): number => {
    const cartItem = cart.items.find(i => i.productId === productId);
    const inCart = cartItem?.quantity || 0;
    
    if (availableStock === undefined) return Infinity;
    return Math.max(0, availableStock - inCart);
  }, [cart.items]);

  // ═══════════════════════════════════════════════════════
  // AGREGAR ITEM
  // ═══════════════════════════════════════════════════════
  const addItem = useCallback(async (item: CartItem) => {
    if (!sessionId) return;
    
    const previousCart = cart;
    pendingOps.current += 1;
    setIsSyncing(true);
    
    // Optimista
    setCart(prev => {
      const existingIndex = prev.items.findIndex(i => i.productId === item.productId);
      if (existingIndex >= 0) {
        const newItems = [...prev.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + item.quantity,
          // notes===undefined (quick-add) preserva las previas; notes definido las actualiza
          ...(item.notes !== undefined ? { notes: item.notes || undefined } : {}),
        };
        return { items: newItems, updatedAt: new Date().toISOString() };
      }
      return { items: [...prev.items, item], updatedAt: new Date().toISOString() };
    });

    try {
      const result = branchId
        ? await addToCartPublicAction(businessSlug, { ...item, branchId }, { sessionId })
        : await addToCartAction(businessSlug, item, { sessionId });
      if (!result.success) throw new Error(result.error);
    } catch (error) {
      setCart(previousCart);
      console.error('Error adding item:', error);
    } finally {
      pendingOps.current -= 1;
      if (pendingOps.current === 0) setIsSyncing(false);
    }
  }, [businessSlug, branchId, cart, sessionId]);

  // ═══════════════════════════════════════════════════════
  // ACTUALIZAR CANTIDAD
  // ═══════════════════════════════════════════════════════
  const updateItem = useCallback(async (productId: string, delta: number) => {
    if (!sessionId) return;
    
    const currentItem = cart.items.find(i => i.productId === productId);
    if (!currentItem) return;

    const previousCart = cart;
    pendingOps.current += 1;
    setIsSyncing(true);

    const newQuantity = currentItem.quantity + delta;

    setCart(prev => ({
      items: prev.items
        .map(item => {
          if (item.productId === productId) {
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[],
      updatedAt: new Date().toISOString(),
    }));

    try {
      if (newQuantity <= 0) {
        const result = branchId
          ? await removeFromCartPublicAction(businessSlug, productId, { sessionId, branchId })
          : await removeFromCartAction(businessSlug, productId, { sessionId });
        if (!result.success) throw new Error(result.error);
      } else {
        const result = branchId
          ? await updateCartItemPublicAction(businessSlug, productId, newQuantity, { sessionId, branchId })
          : await updateCartItemAction(businessSlug, productId, newQuantity, { sessionId });
        if (!result.success) throw new Error(result.error);
      }
    } catch (error) {
      setCart(previousCart);
      console.error('Error updating item:', error);
    } finally {
      pendingOps.current -= 1;
      if (pendingOps.current === 0) setIsSyncing(false);
    }
  }, [businessSlug, branchId, cart, sessionId]);

  // ═══════════════════════════════════════════════════════
  // ELIMINAR ITEM
  // ═══════════════════════════════════════════════════════
  const removeItem = useCallback(async (productId: string) => {
    if (!sessionId) return;
    
    const previousCart = cart;
    pendingOps.current += 1;
    setIsSyncing(true);

    setCart(prev => ({
      items: prev.items.filter(item => item.productId !== productId),
      updatedAt: new Date().toISOString(),
    }));

    try {
      const result = branchId
        ? await removeFromCartPublicAction(businessSlug, productId, { sessionId, branchId })
        : await removeFromCartAction(businessSlug, productId, { sessionId });
      if (!result.success) throw new Error(result.error);
    } catch (error) {
      setCart(previousCart);
      console.error('Error removing item:', error);
    } finally {
      pendingOps.current -= 1;
      if (pendingOps.current === 0) setIsSyncing(false);
    }
  }, [businessSlug, branchId, cart, sessionId]);

  // ═══════════════════════════════════════════════════════
  // ACTUALIZAR NOTAS DE ITEM
  // ═══════════════════════════════════════════════════════
  const updateItemNotes = useCallback(async (productId: string, notes: string) => {
    if (!sessionId) return;

    const currentItem = cart.items.find(i => i.productId === productId);
    if (!currentItem) return;

    const trimmed = notes.trim() || undefined;
    const previousCart = cart;
    pendingOps.current += 1;
    setIsSyncing(true);

    // Optimistic update
    setCart(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.productId === productId ? { ...item, notes: trimmed } : item
      ),
      updatedAt: new Date().toISOString(),
    }));

    try {
      const result = branchId
        ? await updateCartItemPublicAction(businessSlug, productId, currentItem.quantity, { sessionId, branchId }, trimmed)
        : await updateCartItemAction(businessSlug, productId, currentItem.quantity, { sessionId }, trimmed);
      if (!result.success) throw new Error(result.error);
    } catch (error) {
      setCart(previousCart);
      console.error('Error updating item notes:', error);
    } finally {
      pendingOps.current -= 1;
      if (pendingOps.current === 0) setIsSyncing(false);
    }
  }, [businessSlug, branchId, cart, sessionId]);

  // ═══════════════════════════════════════════════════════
  // LIMPIAR CARRITO
  // ═══════════════════════════════════════════════════════
  const clearCart = useCallback(async () => {
    if (!sessionId) return;
    
    const previousCart = cart;
    pendingOps.current += 1;
    setIsSyncing(true);

    setCart(emptyCart);

    try {
      const result = await clearCartAction(businessSlug, { sessionId });
      if (!result.success) throw new Error(result.error);
    } catch (error) {
      setCart(previousCart);
      console.error('Error clearing cart:', error);
    } finally {
      pendingOps.current -= 1;
      if (pendingOps.current === 0) setIsSyncing(false);
    }
  }, [businessSlug, cart, sessionId]);

  // ═══════════════════════════════════════════════════════
  // CUSTOMER ACTIONS
  // ═══════════════════════════════════════════════════════
  const setCustomerPhone = useCallback((phone: string) => {
    setCustomer(prev => ({
      ...prev,
      phone,
      isIdentified: true,
    }));
  }, []);

  const setCustomerName = useCallback((name: string) => {
    setCustomer(prev => ({ ...prev, name }));
  }, []);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const isIdentified = customer.isIdentified;

  return (
    <CartContext.Provider value={{
      cart,
      itemCount,
      isLoading,
      isSyncing,
      isHydrated,
      customer,
      isIdentified,
      sessionId,
      branchId,
      branchPhone,
      whatsappToken,
      addItem,
      updateItem,
      removeItem,
      updateItemNotes,
      clearCart,
      syncCart,
      setCustomerPhone,
      setCustomerName,
      getStockForProduct,
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
