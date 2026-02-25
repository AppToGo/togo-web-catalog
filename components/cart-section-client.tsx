'use client';

import { CartSection } from './cart-section';
import { useCart } from './cart-provider';

interface CartSectionClientProps {
  token: string;
}

export function CartSectionClient({ token }: CartSectionClientProps) {
  const { cart, isLoading } = useCart();
  
  if (isLoading) {
    return (
      <section className="mt-8">
        <div className="animate-pulse">
          <div className="h-12 bg-[var(--color-muted)] rounded-lg"></div>
        </div>
      </section>
    );
  }
  
  return <CartSection cart={cart} token={token} />;
}
