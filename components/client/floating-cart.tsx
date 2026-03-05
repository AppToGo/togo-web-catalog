/**
 * FloatingCart - Client Component
 * 
 * Barra flotante que muestra el total del carrito.
 * Usa CartContext (datos) y CartUIContext (UI) separados.
 */

'use client';

import { ShoppingBag, ChevronRight } from 'lucide-react';
import { useCart } from './cart-context';
import { useCartUI } from './cart-ui-context';
import { formatPrice } from '@/lib/utils';

interface FloatingCartProps {
  accentColor: string;
}

export function FloatingCart({ accentColor }: FloatingCartProps) {
  const { cart, itemCount } = useCart();
  const { openCart } = useCartUI();

  if (itemCount === 0) return null;

  const total = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
      <button
        onClick={openCart}
        className="w-full max-w-lg mx-auto flex items-center justify-between px-6 py-4 rounded-2xl text-white shadow-2xl hover:opacity-95 active:scale-[0.98] transition-all pointer-events-auto"
        style={{ backgroundColor: accentColor }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingBag className="w-6 h-6" />
            <span 
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white text-xs font-bold flex items-center justify-center"
              style={{ color: accentColor }}
            >
              {itemCount}
            </span>
          </div>
          <div className="text-left">
            <span className="text-sm opacity-90">Ver carrito</span>
            <p className="font-bold text-lg">{formatPrice(total)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
          <span className="font-semibold">Ir a pagar</span>
          <ChevronRight className="w-5 h-5" />
        </div>
      </button>
    </div>
  );
}
