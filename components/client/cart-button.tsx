/**
 * CartButton - Client Component
 * 
 * Botón del carrito que requiere estado del cliente.
 * Usa CartContext (datos) y CartUIContext (UI) separados.
 */

'use client';

import { ShoppingCart } from 'lucide-react';
import { useCart } from './cart-context';
import { useCartUI } from './cart-ui-context';

interface CartButtonProps {
  accentColor: string;
}

export function CartButton({ accentColor }: CartButtonProps) {
  const { itemCount } = useCart();
  const { openCart } = useCartUI();

  return (
    <button
      onClick={openCart}
      className="relative p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all active:scale-95"
      aria-label="Abrir carrito"
    >
      <ShoppingCart className="w-6 h-6 text-white" />
      {itemCount > 0 && (
        <span 
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white shadow-lg animate-in zoom-in"
          style={{ backgroundColor: accentColor }}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}
