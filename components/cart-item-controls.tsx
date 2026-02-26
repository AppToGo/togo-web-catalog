'use client';

import { useState } from 'react';
import { useCart } from './cart-context';

interface CartItemControlsProps {
  token: string;
  productId: string;
  name?: string;
  price?: number;
  quantity: number;
}

export function CartItemControls({ productId, name, price, quantity }: CartItemControlsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { updateItem, removeItem } = useCart();

  const handleUpdate = async (delta: number) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    await updateItem(productId, delta);
    setIsUpdating(false);
  };

  const handleRemove = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    await removeItem(productId);
    setIsUpdating(false);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleUpdate(-1)}
        disabled={isUpdating}
        className="w-7 h-7 rounded-full border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-muted)] transition-colors disabled:opacity-50"
      >
        −
      </button>

      <span className="w-6 text-center font-medium text-[var(--color-foreground)]">
        {quantity}
      </span>

      <button
        onClick={() => handleUpdate(1)}
        disabled={isUpdating}
        className="w-7 h-7 rounded-full border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-muted)] transition-colors disabled:opacity-50"
      >
        +
      </button>

      <button
        onClick={handleRemove}
        disabled={isUpdating}
        className="text-xs text-red-500 hover:text-red-600 ml-2 disabled:opacity-50"
      >
        Eliminar
      </button>
    </div>
  );
}
