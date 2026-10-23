'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCartUI } from './cart-ui-context';
import { CartPanel } from './cart-panel';
import { useIsDesktop } from './use-is-desktop';
import type { BusinessInfo } from '@/src/types/catalog.types';

interface CartDrawerProps {
  business: BusinessInfo;
}

/**
 * Carrito como hoja inferior (móvil). En escritorio el carrito vive en la
 * columna lateral (CartSidebar), así que este drawer no se abre.
 */
export function CartDrawer({ business }: CartDrawerProps) {
  const { isCartOpen, closeCart } = useCartUI();
  const isDesktop = useIsDesktop();
  const [animationState, setAnimationState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');

  // Algo pidió abrir el carrito (p. ej. "Ver pedido" tras una recomendación)
  // pero ya está a la vista en la columna lateral.
  useEffect(() => {
    if (isDesktop && isCartOpen) closeCart();
  }, [isDesktop, isCartOpen, closeCart]);

  useEffect(() => {
    if (isDesktop) return;
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
      setAnimationState('opening');
      const timer = setTimeout(() => setAnimationState('open'), 50);
      return () => clearTimeout(timer);
    } else {
      // animationState intentionally omitted from deps: including it causes infinite re-renders
      // since we set it inside this same effect
      if (animationState === 'open' || animationState === 'opening') {
        setAnimationState('closing');
        const timer = setTimeout(() => {
          setAnimationState('closed');
          document.body.style.overflow = '';
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCartOpen, isDesktop]);

  const handleClose = useCallback(() => {
    setAnimationState('closing');
    setTimeout(() => {
      setAnimationState('closed');
      document.body.style.overflow = '';
      closeCart();
    }, 300);
  }, [closeCart]);

  const isClosing = animationState === 'closing';

  if (isDesktop || (animationState === 'closed' && !isCartOpen)) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-[rgba(21,20,15,0.5)] z-50 backdrop-blur-sm ${!isClosing ? 'animate-[fade-in_0.2s_ease-out]' : ''}`}
        style={isClosing ? { opacity: 0, transition: 'opacity 0.25s ease-out' } : undefined}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[51] bg-[var(--surface)] rounded-t-[18px] max-h-[92dvh] flex flex-col shadow-[0_14px_40px_rgba(20,20,15,0.14)] ${!isClosing ? 'animate-[drawer-up_0.28s_cubic-bezier(0.32,0.72,0,1)]' : ''}`}
        style={isClosing ? { transform: 'translateY(100%)', transition: 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)' } : undefined}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
      >
        {/* Handle */}
        <div className="w-9 h-1 rounded-full bg-[var(--line-2)] mx-auto mt-[10px] shrink-0" />

        <CartPanel business={business} active={animationState === 'open'} onClose={handleClose} />
      </div>
    </>
  );
}

/**
 * Carrito siempre visible en la columna derecha (escritorio). En móvil no
 * monta el panel: ahí el carrito es el drawer.
 */
export function CartSidebar({ business }: CartDrawerProps) {
  const isDesktop = useIsDesktop();

  return (
    <aside
      aria-label="Tu pedido"
      className="hidden lg:flex flex-none w-85 py-6 min-h-0"
    >
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-(--surface) border border-(--line) rounded-[18px] shadow-[0_4px_14px_rgba(20,20,15,0.06)]">
        {isDesktop && <CartPanel business={business} active alwaysVisible />}
      </div>
    </aside>
  );
}
