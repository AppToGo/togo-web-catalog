"use client";

import {
  X,
  Minus,
  Plus,
  ShoppingBag,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useCart } from "./cart-context";
import { useState, useEffect } from "react";
import type { Business } from "@/lib/types";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  business: Business;
}

interface OrderStatus {
  hasOrder: boolean;
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    itemCount: number;
    notes?: string;
  };
  orderStatus?: string;
}

export function CartDrawer({
  isOpen,
  onClose,
  token,
  business,
}: CartDrawerProps) {
  const { cart, updateItem, itemCount, isSyncing, syncCart } = useCart();
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [showAlert, setShowAlert] = useState<{
    type: "error" | "success" | "warning";
    message: string;
  } | null>(null);

  // Verificar estado de la orden al abrir el drawer
  useEffect(() => {
    if (isOpen) {
      checkExistingOrder();
    }
  }, [isOpen, token]);

  // Cargar notas si existe orden
  useEffect(() => {
    if (orderStatus?.order?.notes) {
      setNotes(orderStatus.order.notes);
    }
  }, [orderStatus]);

  const checkExistingOrder = async () => {
    try {
      const response = await fetch(`/api/cart/check-order?token=${token}`);
      if (response.ok) {
        const data = await response.json();
        setOrderStatus(data);
      }
    } catch (error) {
      console.error("Error checking order:", error);
    }
  };

  if (!isOpen) return null;

  const total = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  /**
   * Crea o actualiza la orden según el estado actual
   */
  const handleSubmitOrder = async () => {
    if (cart.items.length === 0) return;

    setIsProcessing(true);
    setShowAlert(null);

    // Sincronizar carrito con el servidor antes de enviar la orden
    // Esto asegura que los items eliminados se reflejen en Redis
    await syncCart();

    try {
      // Caso 1: Ya existe una orden NO DRAFT → No se puede modificar
      if (
        orderStatus?.hasOrder &&
        orderStatus.order &&
        orderStatus.order.status !== "DRAFT"
      ) {
        setShowAlert({
          type: "error",
          message: `Esta orden ya fue ${getOrderStatusText(orderStatus.order.status)} y no se puede modificar.`,
        });
        setIsProcessing(false);
        return;
      }

      // Caso 2: Existe orden DRAFT → Actualizar (PATCH)
      if (orderStatus?.hasOrder && orderStatus.order?.status === "DRAFT") {
        const response = await fetch("/api/cart/update-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            orderId: orderStatus.order.id,
            notes: notes.trim() || undefined,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Error al actualizar la orden");
        }

        const data = await response.json();

        // Notificar al backend para enviar mensaje WhatsApp
        // Solo si viene del flujo de WhatsApp (tiene businessPhone)
        if (data.businessPhone) {
          try {
            await fetch("/api/cart/notify-modified", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token,
                orderId: orderStatus.order.id,
              }),
            });
          } catch (notifyError) {
            console.error("Error notificando modificación:", notifyError);
            // No fallamos si la notificación no se envía
          }
        }

        setShowAlert({
          type: "success",
          message: `¡Orden #${data.orderNumber} actualizada exitosamente!`,
        });

        // Actualizar estado local
        await checkExistingOrder();
        setIsProcessing(false);
        return;
      }

      // Caso 3: No existe orden → Crear nueva (POST)
      const response = await fetch("/api/cart/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al crear la orden");
      }

      const data = await response.json();
      setShowAlert({
        type: "success",
        message: `¡Orden #${data.orderNumber} creada exitosamente!`,
      });

      // Actualizar estado local
      await checkExistingOrder();
    } catch (error: unknown) {
      console.error("Error procesando orden:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error al procesar la orden";
      setShowAlert({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getOrderStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      CONFIRMED: "confirmada",
      PAID: "pagada",
      PREPARING: "en preparación",
      SHIPPED: "enviada",
      DELIVERED: "entregada",
      CANCELLED: "cancelada",
    };
    return statusMap[status] || status.toLowerCase();
  };

  const getSubmitButtonText = () => {
    if (isSyncing) return "Sincronizando...";
    if (isProcessing) return "Procesando...";

    if (orderStatus?.hasOrder) {
      if (orderStatus.order?.status !== "DRAFT") {
        return "Orden no modificable";
      }
      return "Actualizar orden";
    }

    return "Crear orden";
  };

  const isSubmitDisabled = () => {
    return (
      isProcessing ||
      isSyncing ||
      cart.items.length === 0 ||
      (orderStatus?.hasOrder && orderStatus.order?.status !== "DRAFT")
    );
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fadeIn"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-50 z-50 shadow-2xl animate-slideIn flex flex-col">
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 text-white"
          style={{ backgroundColor: business.primaryColor }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Tu pedido</h2>
              <p className="text-sm text-white/80">{itemCount} items</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alertas */}
        {showAlert && (
          <div
            className={`px-4 py-3 ${
              showAlert.type === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : showAlert.type === "warning"
                  ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                  : "bg-green-50 border-green-200 text-green-700"
            } border-b`}
          >
            <div className="flex items-start gap-2">
              {showAlert.type === "error" && (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              {showAlert.type === "success" && (
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{showAlert.message}</p>
            </div>
          </div>
        )}

        {/* Estado de orden existente */}
        {orderStatus?.hasOrder && (
          <div
            className={`px-4 py-2 text-xs font-medium ${
              orderStatus.order?.status === "DRAFT"
                ? "bg-blue-50 text-blue-700"
                : "bg-yellow-50 text-yellow-700"
            }`}
          >
            {orderStatus.order?.status === "DRAFT"
              ? `📝 Tienes una orden #${orderStatus.order.orderNumber} en borrador que puedes modificar`
              : `⚠️ Orden #${orderStatus.order?.orderNumber} ${getOrderStatusText(orderStatus.order!.status)}`}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Tu carrito está vacío</p>
              <button
                onClick={onClose}
                className="mt-4 text-sm font-medium hover:underline"
                style={{ color: business.primaryColor }}
              >
                Seguir comprando
              </button>
            </div>
          ) : (
            <>
              {cart.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {formatPrice(item.price)} c/u
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
                    <button
                      onClick={() => updateItem(item.productId, -1)}
                      disabled={
                        orderStatus?.hasOrder &&
                        orderStatus.order?.status !== "DRAFT"
                      }
                      className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                    >
                      <Minus className="w-3 h-3 text-gray-600" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateItem(item.productId, 1)}
                      disabled={
                        orderStatus?.hasOrder &&
                        orderStatus.order?.status !== "DRAFT"
                      }
                      className="w-7 h-7 rounded-full text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
                      style={{ backgroundColor: business.accentColor }}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <p className="font-bold text-gray-900 text-sm">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Notas */}
              <div className="bg-white rounded-xl p-4 shadow-sm mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas para el pedido
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Sin cebolla, salsa aparte, llamar al llegar..."
                  rows={3}
                  disabled={
                    orderStatus?.hasOrder &&
                    orderStatus.order?.status !== "DRAFT"
                  }
                  className="w-full p-3 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-gray-200 resize-none text-sm text-gray-900 placeholder:text-gray-400 disabled:opacity-50"
                />
              </div>

              {/* Resumen */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Resumen</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Envío</span>
                    <span className="text-green-600 font-medium">
                      A coordinar
                    </span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-xl text-gray-900">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-white space-y-3">
            <p className="text-xs text-gray-500 text-center">
              {orderStatus?.hasOrder
                ? "Tu pedido está registrado en el sistema"
                : "El pago se coordina directamente con el negocio"}
            </p>

            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitDisabled()}
              className="w-full py-4 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-2 shadow-lg hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: business.accentColor }}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                getSubmitButtonText()
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {orderStatus?.hasOrder && orderStatus.order?.status === "DRAFT"
                ? "Seguir editando"
                : "Seguir comprando"}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
