/**
 * Checkout Form - Con branding del negocio
 */

"use client";

import { useState } from "react";

import { createOrderAction } from "@/lib/actions";
import { useCart } from "./cart-context";
import { ShoppingBag, MessageSquare, CreditCard } from "lucide-react";
import type { Business } from "@/lib/types";

interface CheckoutFormProps {
  token: string;
  business: Business;
}

export function CheckoutForm({ token, business }: CheckoutFormProps) {
  // Router se usa en el server action redirect
  const { cart, itemCount } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("token", token);
    formData.append("notes", notes);

    try {
      await createOrderAction(formData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("NEXT_REDIRECT")) {
        return;
      }
      setError(errorMessage || "Error al crear el pedido");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Resumen de items */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <ShoppingBag className="w-5 h-5" style={{ color: business.primaryColor }} />
          <h2 className="font-bold text-gray-900">Tu pedido ({itemCount} items)</h2>
        </div>
        
        <div className="space-y-3 mb-4">
          {cart.items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {item.quantity}x {item.name}
              </span>
              <span className="font-medium text-gray-900">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
          <span className="text-gray-600">Total</span>
          <span className="text-2xl font-bold text-gray-900">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Notas */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5" style={{ color: business.primaryColor }} />
          <h2 className="font-bold text-gray-900">Notas adicionales</h2>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej: Sin cebolla, salsa aparte, llamar al llegar..."
          rows={3}
          className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gray-200 resize-none text-gray-900 placeholder:text-gray-400"
        />
      </div>

      {/* Método de pago - solo informativo por ahora */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5" style={{ color: business.primaryColor }} />
          <h2 className="font-bold text-gray-900">Método de pago</h2>
        </div>
        <p className="text-sm text-gray-600">
          El método de pago lo confirmarás por WhatsApp con {business.name}
        </p>
      </div>

      {/* Botón submit */}
      <button
        type="submit"
        disabled={isLoading || itemCount === 0}
        className="w-full py-4 rounded-2xl font-bold text-white text-lg shadow-xl hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
        style={{ backgroundColor: business.accentColor }}
      >
        {isLoading ? "Procesando..." : `Confirmar pedido • ${formatPrice(total)}`}
      </button>

      <p className="text-xs text-center text-gray-500">
        Te contactaremos por WhatsApp al {business.phone} para confirmar los detalles
      </p>
    </form>
  );
}
