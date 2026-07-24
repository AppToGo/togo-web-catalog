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
  getCartByTokenAction,
  addToCartByTokenAction,
  removeFromCartByTokenAction,
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
  updateItem: (productId: string, delta: number, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateItemNotes: (productId: string, notes: string, variantId?: string) => Promise<void>;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  setCustomerPhone: (phone: string) => void;
  setCustomerName: (name: string) => void;
  // Stock validation
  getStockForProduct: (productId: string, availableStock?: number, variantId?: string) => number;
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
  /** Cart pre-fetched server-side (e.g. from an existing DRAFT order); skips the initial empty state */
  initialCart?: Cart;
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
  whatsappToken: initialWhatsappToken,
  initialCart,
}: CartProviderProps) {
  // Cart state — seed with server-prefetched cart when available
  const [cart, setCart] = useState<Cart>(initialCart ?? emptyCart);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  // Token activo: arranca con el que llega por URL (?t=), pero se degrada a
  // `undefined` en runtime si el backend lo rechaza (vencido/inválido) — ver
  // syncCart y las acciones de carrito más abajo. A partir de ahí el negocio
  // sigue funcionando por el flujo anónimo (sessionId), sin bloquear al
  // usuario ni requerir un token nuevo (que además no se puede reemitir desde
  // acá — lo emite el backend solo cuando el cliente lo pide por WhatsApp).
  const [activeToken, setActiveToken] = useState<string | undefined>(initialWhatsappToken);
  
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

    // Cargar carrito — solo desde localStorage si no llegó uno del servidor
    if (!initialCart) {
      const savedCart = localStorage.getItem(`cart-${businessSlug}`);
      if (savedCart) {
        try {
          const parsed: Cart = JSON.parse(savedCart);
          if (parsed && Array.isArray(parsed.items)) {
            setCart(parsed);
          }
        } catch { /* ignore */ }
      }
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

  // Sincronizar carrito con backend una sola vez, al montar (cuando ya
  // tengamos sessionId o token). El guard por ref es necesario: si no,
  // cuando activeToken se degrada a undefined dentro de syncCart (token
  // vencido), este efecto se volvería a disparar por el cambio de
  // dependencia y traería el carrito anónimo — que en ese momento todavía
  // está vacío (el cliente nunca lo usó, su carrito vivía bajo el token) —
  // pisando el carrito local recién restaurado con uno vacío.
  const hasSyncedOnMountRef = useRef(false);
  useEffect(() => {
    if (isHydrated && (sessionId || activeToken) && !hasSyncedOnMountRef.current) {
      hasSyncedOnMountRef.current = true;
      syncCart();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, sessionId, activeToken]);

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
    if (!sessionId && !activeToken) return;

    const isTokenFlow = !!activeToken;

    const mergeServerCart = (serverCart: Cart) => {
      setCart(prev => {
        const mergedItems = serverCart.items.map(si => ({
          ...si,
          // Preserve local notes if server doesn't have them
          notes: si.notes ?? prev.items.find(
            p => p.productId === si.productId && p.variantId === si.variantId
          )?.notes,
        }));
        const mergedCart = { ...serverCart, items: mergedItems };
        const sortByProductId = (items: CartItem[]) =>
          [...items].sort((a, b) => a.productId.localeCompare(b.productId));
        const prevJson = JSON.stringify(sortByProductId(prev.items));
        const newJson = JSON.stringify(sortByProductId(mergedCart.items));
        if (prevJson !== newJson) return mergedCart;
        return prev;
      });
    };

    setIsSyncing(true);
    try {
      if (isTokenFlow) {
        const result = await getCartByTokenAction(activeToken!);
        if (result.invalidToken) {
          // Token vencido/inválido (ej. pestaña abierta desde antes de que
          // expirara): degradar a flujo anónimo para el resto de la sesión
          // en vez de pisar el carrito local con uno vacío — de acá en más
          // las mutaciones usan sessionId, sin bloquear al usuario.
          setActiveToken(undefined);
          return;
        }
        mergeServerCart(result.cart);
        return;
      }

      const serverCart = branchId
        ? await getCartPublicAction(businessSlug, { sessionId, branchId })
        : await getCartAction(businessSlug, { sessionId });
      mergeServerCart(serverCart);
    } catch {
      // Error silencioso — el carrito local se preserva
    } finally {
      if (pendingOps.current === 0) setIsSyncing(false);
    }
  }, [businessSlug, branchId, sessionId, activeToken]);

  // ═══════════════════════════════════════════════════════
  // STOCK VALIDATION HELPER
  // ═══════════════════════════════════════════════════════
  const getStockForProduct = useCallback((productId: string, availableStock?: number, variantId?: string): number => {
    const cartItem = cart.items.find(i =>
      i.productId === productId &&
      (variantId === undefined || i.variantId === variantId)
    );
    const inCart = cartItem?.quantity || 0;

    if (availableStock === undefined) return Infinity;
    return Math.max(0, availableStock - inCart);
  }, [cart.items]);

  // ═══════════════════════════════════════════════════════
  // AGREGAR ITEM
  // ═══════════════════════════════════════════════════════
  const addItem = useCallback(async (item: CartItem) => {
    if (!sessionId && !activeToken) return;

    const isTokenFlow = !!activeToken;

    const previousCart = cart;
    pendingOps.current += 1;
    setIsSyncing(true);

    // Optimista
    setCart(prev => {
      const existingIndex = prev.items.findIndex(
        i => i.productId === item.productId && i.variantId === item.variantId
      );
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
      const result = isTokenFlow
        ? await addToCartByTokenAction(activeToken!, item)
        : branchId
        ? await addToCartPublicAction(businessSlug, { ...item, branchId }, { sessionId })
        : await addToCartAction(businessSlug, item, { sessionId });

      if (!result.success && result.errorCode === 'INVALID_TOKEN') {
        // Token vencido a mitad de sesión: degradar y reintentar por el
        // camino anónimo antes de deshacer el update optimista — así el
        // usuario no ve el ítem desaparecer.
        setActiveToken(undefined);
        const fallback = branchId
          ? await addToCartPublicAction(businessSlug, { ...item, branchId }, { sessionId })
          : await addToCartAction(businessSlug, item, { sessionId });
        if (!fallback.success) throw new Error(fallback.error);
        return;
      }

      if (!result.success) throw new Error(result.error);
    } catch (error) {
      setCart(previousCart);
      throw error;
    } finally {
      pendingOps.current -= 1;
      if (pendingOps.current === 0) setIsSyncing(false);
    }
  }, [businessSlug, branchId, cart, sessionId, activeToken]);

  // ═══════════════════════════════════════════════════════
  // ACTUALIZAR CANTIDAD
  // ═══════════════════════════════════════════════════════
  const updateItem = useCallback(async (productId: string, delta: number, variantId?: string) => {
    if (!sessionId && !activeToken) return;

    const currentItem = cart.items.find(
      i => i.productId === productId && i.variantId === variantId
    );
    if (!currentItem) return;

    const isTokenFlow = !!activeToken;

    const previousCart = cart;
    pendingOps.current += 1;
    setIsSyncing(true);

    const newQuantity = currentItem.quantity + delta;

    setCart(prev => ({
      items: prev.items
        .map(item => {
          if (item.productId === productId && item.variantId === variantId) {
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[],
      updatedAt: new Date().toISOString(),
    }));

    const callAnonymous = () =>
      newQuantity <= 0
        ? branchId
          ? removeFromCartPublicAction(businessSlug, productId, { sessionId, branchId }, variantId)
          : removeFromCartAction(businessSlug, productId, { sessionId }, variantId)
        : branchId
        ? updateCartItemPublicAction(businessSlug, productId, newQuantity, { sessionId, branchId }, undefined, variantId)
        : updateCartItemAction(businessSlug, productId, newQuantity, { sessionId }, undefined, variantId);

    try {
      if (isTokenFlow) {
        // delta puede ser negativo (reducir cantidad) o positivo (aumentar)
        const result = newQuantity <= 0
          ? await removeFromCartByTokenAction(activeToken!, productId)
          : await addToCartByTokenAction(activeToken!, { ...currentItem, quantity: delta });

        if (!result.success && result.errorCode === 'INVALID_TOKEN') {
          // Token vencido a mitad de sesión: degradar y reintentar por el
          // camino anónimo antes de deshacer el update optimista.
          setActiveToken(undefined);
          const fallback = await callAnonymous();
          if (!fallback.success) throw new Error(fallback.error);
          return;
        }

        if (!result.success) throw new Error(result.error);
        return;
      }

      const result = await callAnonymous();
      if (!result.success) throw new Error(result.error);
    } catch (error) {
      setCart(previousCart);
      throw error;
    } finally {
      pendingOps.current -= 1;
      if (pendingOps.current === 0) setIsSyncing(false);
    }
  }, [businessSlug, branchId, cart, sessionId, activeToken]);

  // ═══════════════════════════════════════════════════════
  // ELIMINAR ITEM
  // ═══════════════════════════════════════════════════════
  const removeItem = useCallback(async (productId: string, variantId?: string) => {
    if (!sessionId && !activeToken) return;

    const isTokenFlow = !!activeToken;

    const previousCart = cart;
    pendingOps.current += 1;
    setIsSyncing(true);

    setCart(prev => ({
      items: prev.items.filter(
        item => !(item.productId === productId && item.variantId === variantId)
      ),
      updatedAt: new Date().toISOString(),
    }));

    const callAnonymous = () =>
      branchId
        ? removeFromCartPublicAction(businessSlug, productId, { sessionId, branchId }, variantId)
        : removeFromCartAction(businessSlug, productId, { sessionId }, variantId);

    try {
      if (isTokenFlow) {
        const result = await removeFromCartByTokenAction(activeToken!, productId);

        if (!result.success && result.errorCode === 'INVALID_TOKEN') {
          setActiveToken(undefined);
          const fallback = await callAnonymous();
          if (!fallback.success) throw new Error(fallback.error);
          return;
        }

        if (!result.success) throw new Error(result.error);
        return;
      }

      const result = await callAnonymous();
      if (!result.success) throw new Error(result.error);
    } catch (error) {
      setCart(previousCart);
      throw error;
    } finally {
      pendingOps.current -= 1;
      if (pendingOps.current === 0) setIsSyncing(false);
    }
  }, [businessSlug, branchId, cart, sessionId, activeToken]);

  // ═══════════════════════════════════════════════════════
  // ACTUALIZAR NOTAS DE ITEM
  // ═══════════════════════════════════════════════════════
  const updateItemNotes = useCallback(async (productId: string, notes: string, variantId?: string) => {
    if (!sessionId && !activeToken) return;

    const currentItem = cart.items.find(
      i => i.productId === productId && i.variantId === variantId
    );
    if (!currentItem) return;

    const isTokenFlow = !!activeToken;
    const trimmed = notes.trim() || undefined;
    const previousCart = cart;
    pendingOps.current += 1;
    setIsSyncing(true);

    // Optimistic update
    setCart(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, notes: trimmed }
          : item
      ),
      updatedAt: new Date().toISOString(),
    }));

    const callAnonymous = () =>
      branchId
        ? updateCartItemPublicAction(businessSlug, productId, currentItem.quantity, { sessionId, branchId }, trimmed, variantId)
        : updateCartItemAction(businessSlug, productId, currentItem.quantity, { sessionId }, trimmed, variantId);

    try {
      if (isTokenFlow) {
        // quantity: 0 → el backend no cambia la cantidad, solo actualiza notes
        const result = await addToCartByTokenAction(activeToken!, {
          ...currentItem,
          quantity: 0,
          notes: trimmed,
        });

        if (!result.success && result.errorCode === 'INVALID_TOKEN') {
          setActiveToken(undefined);
          const fallback = await callAnonymous();
          if (!fallback.success) throw new Error(fallback.error);
          return;
        }

        if (!result.success) throw new Error(result.error);
        return;
      }

      const result = await callAnonymous();
      if (!result.success) throw new Error(result.error);
    } catch (error) {
      setCart(previousCart);
      throw error;
    } finally {
      pendingOps.current -= 1;
      if (pendingOps.current === 0) setIsSyncing(false);
    }
  }, [businessSlug, branchId, cart, sessionId, activeToken]);

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
      whatsappToken: activeToken,
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
