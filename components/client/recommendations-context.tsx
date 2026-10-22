/**
 * RecommendationsContext - Client Component
 *
 * Recomendados del catálogo ("Va muy bien con"), compartidos por la hoja que
 * sube al agregar un producto y por el detalle del producto. Las reglas
 * viven acá para que las dos digan lo mismo:
 * - hasta 3, en orden al azar, sin los que ya están en el carrito ni los
 *   agotados (el backend ya dejó solo los activos y con stock en la sede);
 * - se ofrecen una sola vez por producto en la visita: si el detalle ya los
 *   mostró, al agregar no sube la hoja;
 * - lo que se agrega desde una recomendación no ofrece otra (sin cadenas).
 */

'use client';

import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';
import type { CatalogProduct } from '@/src/types/catalog.types';
import { useCart } from './cart-context';

/** Cuántos recomendados se muestran a la vez. */
const MAX_ITEMS = 3;

interface RecommendationsContextType {
  /** Recomendados para mostrar al pedir `productId` (orden al azar). */
  pickFor: (productId: string) => CatalogProduct[];
  getProduct: (productId: string) => CatalogProduct | undefined;
  isInCart: (product: CatalogProduct) => boolean;
  /** Agrega el recomendado, o lo quita si ya está en el carrito. */
  toggle: (product: CatalogProduct) => void;
  /** Ya se le mostraron los recomendados de este producto. */
  markShown: (productId: string) => void;
  /** Si al agregar `productId` corresponde ofrecer sus recomendados. */
  shouldOffer: (productId: string) => boolean;
}

const RecommendationsContext = createContext<RecommendationsContextType | undefined>(undefined);

// Mismo criterio que product-row: el carrito espera la variante, y el
// backend solo recomienda productos con una predeterminada o una sola.
export function defaultVariant(product: CatalogProduct) {
  return (
    product.variants?.find((v) => v.isDefault) ??
    (product.variants?.length === 1 ? product.variants[0] : undefined)
  );
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface RecommendationsProviderProps {
  /**
   * Productos que tienen recomendados y los recomendados mismos — solo
   * esos, no el catálogo entero, para no inflar la página.
   */
  products: CatalogProduct[];
  children: ReactNode;
}

export function RecommendationsProvider({ products, children }: RecommendationsProviderProps) {
  const { cart, addItem, removeItem } = useCart();

  const productsById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const shownFor = useRef(new Set<string>());
  const addedFromRecommendation = useRef(new Set<string>());

  const cartLine = useCallback(
    (productId: string) => cart.items.find((i) => i.productId === productId),
    [cart.items],
  );

  const pickFor = useCallback(
    (productId: string) => {
      const ids = productsById.get(productId)?.recommendedProductIds ?? [];
      return shuffle(
        ids
          .filter((id) => id !== productId && !cartLine(id))
          .map((id) => productsById.get(id))
          .filter((p): p is CatalogProduct => !!p && p.stock !== 0 && !!defaultVariant(p)),
      ).slice(0, MAX_ITEMS);
    },
    [productsById, cartLine],
  );

  const toggle = useCallback(
    (product: CatalogProduct) => {
      const line = cartLine(product.id);
      if (line) {
        removeItem(product.id, line.variantId);
        return;
      }
      const variant = defaultVariant(product);
      if (!variant) return;
      addedFromRecommendation.current.add(product.id);
      addItem({
        productId: product.id,
        name: product.name,
        price: variant.price ?? product.priceFrom ?? product.price,
        quantity: 1,
        image: product.image,
        variantId: variant.id,
        variantLabel: variant.label,
        ...(variant.attributes ? { variantAttributes: variant.attributes } : {}),
      });
    },
    [cartLine, addItem, removeItem],
  );

  const value = useMemo<RecommendationsContextType>(
    () => ({
      pickFor,
      getProduct: (productId) => productsById.get(productId),
      isInCart: (product) => !!cartLine(product.id),
      toggle,
      markShown: (productId) => shownFor.current.add(productId),
      shouldOffer: (productId) =>
        !shownFor.current.has(productId) && !addedFromRecommendation.current.has(productId),
    }),
    [pickFor, productsById, cartLine, toggle],
  );

  return (
    <RecommendationsContext.Provider value={value}>{children}</RecommendationsContext.Provider>
  );
}

export function useRecommendations() {
  const context = useContext(RecommendationsContext);
  if (!context) {
    throw new Error('useRecommendations must be used within RecommendationsProvider');
  }
  return context;
}
