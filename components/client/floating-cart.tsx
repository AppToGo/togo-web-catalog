'use client';

function ChevronRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

import { useCart } from './cart-context';
import { useCartUI } from './cart-ui-context';
import { formatPrice } from '@/lib/utils';

interface FloatingCartProps {
  accentColor?: string;
}

export function FloatingCart({ accentColor }: FloatingCartProps) {
  const { cart, itemCount, isHydrated } = useCart();
  const { openCart } = useCartUI();

  if (!isHydrated || itemCount === 0) return null;

  const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 bg-[linear-gradient(to_top,var(--bg)_70%,transparent)] pointer-events-none">
      <div
        className="flex items-center gap-[10px] rounded-[18px] px-4 py-3 shadow-[0_14px_40px_rgba(20,20,15,0.14)] cursor-pointer pointer-events-auto transition-[opacity,transform] animate-[drawer-up_0.22s_ease-out] hover:opacity-[0.93] active:scale-[0.98]"
        style={{ background: accentColor || 'var(--accent)', color: 'var(--accent-ink)' }}
        onClick={openCart}
        role="button"
        tabIndex={0}
        aria-label="Ver carrito"
        onKeyDown={(e) => e.key === 'Enter' && openCart()}
      >
        <div
          className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-[13px] font-bold shrink-0"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {itemCount}
        </div>
        <span className="flex-1 text-[14px] font-medium opacity-90">Ver pedido</span>
        <span
          className="text-[16px] font-bold tracking-[-0.03em]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {formatPrice(total)}
        </span>
        <div className="flex items-center gap-1 bg-white/15 px-3 py-[6px] rounded-full text-[13px] font-semibold whitespace-nowrap">
          Continuar <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
}
