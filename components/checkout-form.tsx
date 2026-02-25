/**
 * Checkout Form
 * Client Component mínimo para manejar el submit y redirección
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOrderAction } from "@/lib/actions";

interface CheckoutFormProps {
  token: string;
  total: number;
}

export function CheckoutForm({ token, total }: CheckoutFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    try {
      await createOrderAction(formData);
      // El redirect se maneja en el Server Action, pero si falla:
    } catch (err: unknown) {
      // Si es un error de redirección de Next.js, ignorarlo
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("NEXT_REDIRECT")) {
        return;
      }
      setError(errorMessage || "Error al crear el pedido");
      setIsLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <input type="hidden" name="token" value={token} />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
          Dirección de entrega
        </label>
        <input
          type="text"
          name="address"
          placeholder="Ej: Calle 123 # 45-67"
          required
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
          Notas adicionales
        </label>
        <textarea
          name="notes"
          rows={2}
          placeholder="Ej: Llamar al llegar"
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
        />
      </div>

      <div className="pt-2">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[var(--color-muted-foreground)]">
            Total a pagar
          </span>
          <span className="text-xl font-bold text-[var(--color-foreground)]">
            {formatPrice(total)}
          </span>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-semibold rounded-[var(--radius)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isLoading ? "Procesando..." : "Confirmar pedido"}
        </button>
      </div>

      <p className="text-xs text-center text-[var(--color-muted-foreground)]">
        Recibirás confirmación por WhatsApp
      </p>
    </form>
  );
}
