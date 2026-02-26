'use client';

import { useCart } from './cart-context';
import { CartItemControls } from './cart-item-controls';

interface CartSectionClientProps {
  token: string;
}

export function CartSectionClient({ token }: CartSectionClientProps) {
  const { cart, isLoading } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // No mostrar loading si tenemos items (pueden ser del localStorage)
  if (isLoading && cart.items.length === 0) {
    return (
      <section id="cart" className="py-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
          🛒
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Tu carrito está vacío
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Agrega productos para comenzar
        </p>
      </section>
    );
  }

  const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  if (cart.items.length === 0) {
    return (
      <section id="cart" className="py-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
          🛒
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Tu carrito está vacío
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Agrega productos para comenzar
        </p>
      </section>
    );
  }

  return (
    <section id="cart" className="py-8">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span>🛒</span>
        Tu pedido
        <span className="text-sm font-normal text-gray-500">
          ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </span>
      </h2>

      {/* Lista de items */}
      <div className="space-y-3 mb-6">
        {cart.items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm"
          >
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 text-sm truncate">
                {item.name}
              </h3>
              <p className="text-xs text-gray-500">
                {formatPrice(item.price)} c/u
              </p>
            </div>

            {/* Controles */}
            <CartItemControls
              token={token}
              productId={item.productId}
              name={item.name}
              price={item.price}
              quantity={item.quantity}
            />

            {/* Total */}
            <div className="text-right min-w-[80px]">
              <p className="font-bold text-gray-900 text-sm">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-500">Total</span>
          <span className="text-xl font-bold text-gray-900">
            {formatPrice(total)}
          </span>
        </div>
        <p className="text-xs text-gray-400 text-center">
          El checkout ahora está en el drawer del carrito flotante
        </p>
      </div>
    </section>
  );
}
