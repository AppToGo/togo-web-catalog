/**
 * CartDrawer - Client Component
 * 
 * Drawer lateral del carrito con checkout.
 * Usa Server Actions para operaciones de orden.
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  X, Minus, Plus, ShoppingBag, Loader2, 
  AlertCircle, CheckCircle 
} from 'lucide-react';
import { useCart } from './cart-context';
import { useCartUI } from './cart-ui-context';
import { createOrderAction, updateOrderAction, checkOrderAction } from '@/lib/cart-actions';
import type { Business } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

interface CartDrawerProps {
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
}

export function CartDrawer({ token, business }: CartDrawerProps) {
  const { cart, updateItem, itemCount, isSyncing, syncCart } = useCart();
  const { isCartOpen, closeCart } = useCartUI();
  
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [showAlert, setShowAlert] = useState<{
    type: 'error' | 'success' | 'warning';
    message: string;
  } | null>(null);

  // Verificar orden existente al abrir
  useEffect(() => {
    if (isCartOpen) {
      checkExistingOrder();
    }
  }, [isCartOpen]);

  const checkExistingOrder = async () => {
    try {
      const data = await checkOrderAction(token);
      setOrderStatus(data);
      if (data.order?.notes) setNotes(data.order.notes);
    } catch (error) {
      console.error('Error checking order:', error);
    }
  };

  if (!isCartOpen) return null;

  const total = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleSubmitOrder = async () => {
    if (cart.items.length === 0) return;

    setIsProcessing(true);
    setShowAlert(null);
    await syncCart();

    try {
      // Orden no modificable
      if (orderStatus?.hasOrder && orderStatus.order?.status !== 'DRAFT') {
        setShowAlert({
          type: 'error',
          message: `Esta orden ya fue ${getOrderStatusText(orderStatus.order!.status)}.`,
        });
        setIsProcessing(false);
        return;
      }

      // Actualizar orden existente
      if (orderStatus?.hasOrder && orderStatus.order?.status === 'DRAFT') {
        const result = await updateOrderAction(
          token,
          orderStatus.order.id,
          notes.trim() || undefined
        );

        if (!result.success) {
          throw new Error(result.error || 'Error al actualizar');
        }

        setShowAlert({
          type: 'success',
          message: `¡Orden #${result.order?.orderNumber} actualizada!`,
        });
        await checkExistingOrder();
        setIsProcessing(false);
        return;
      }

      // Crear nueva orden
      const result = await createOrderAction(
        token,
        notes.trim() || undefined
      );

      if (!result.success) {
        throw new Error(result.error || 'Error al crear orden');
      }

      setShowAlert({
        type: 'success',
        message: `¡Orden #${result.order?.orderNumber} creada exitosamente!`,
      });
      await checkExistingOrder();
    } catch (error) {
      setShowAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error al procesar',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getOrderStatusText = (status: string): string => {
    const map: Record<string, string> = {
      CONFIRMED: 'confirmada',
      PAID: 'pagada',
      PREPARING: 'en preparación',
      SHIPPED: 'enviada',
      DELIVERED: 'entregada',
      CANCELLED: 'cancellada',
    };
    return map[status] || status.toLowerCase();
  };

  const getSubmitButtonText = () => {
    if (isSyncing) return 'Sincronizando...';
    if (isProcessing) return 'Procesando...';
    if (orderStatus?.hasOrder && orderStatus.order?.status !== 'DRAFT') {
      return 'Orden no modificable';
    }
    if (orderStatus?.hasOrder) return 'Actualizar orden';
    return 'Crear orden';
  };

  const isSubmitDisabled = () => (
    isProcessing || isSyncing || cart.items.length === 0 ||
    (orderStatus?.hasOrder && orderStatus.order?.status !== 'DRAFT')
  );

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-50 z-50 shadow-2xl animate-in slide-in-from-right flex flex-col">
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
            onClick={closeCart}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alertas */}
        {showAlert && (
          <div className={`px-4 py-3 border-b ${
            showAlert.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
            showAlert.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
            'bg-yellow-50 text-yellow-700 border-yellow-200'
          }`}>
            <div className="flex items-start gap-2">
              {showAlert.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              {showAlert.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              <p className="text-sm">{showAlert.message}</p>
            </div>
          </div>
        )}

        {/* Estado de orden */}
        {orderStatus?.hasOrder && (
          <div className={`px-4 py-2 text-xs font-medium ${
            orderStatus.order?.status === 'DRAFT' 
              ? 'bg-blue-50 text-blue-700' 
              : 'bg-yellow-50 text-yellow-700'
          }`}>
            {orderStatus.order?.status === 'DRAFT'
              ? `📝 Orden #${orderStatus.order.orderNumber} en borrador`
              : `⚠️ Orden #${orderStatus.order?.orderNumber} ${getOrderStatusText(orderStatus.order!.status)}`}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Tu carrito está vacío</p>
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
                      disabled={orderStatus?.hasOrder && orderStatus.order?.status !== 'DRAFT'}
                      className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:bg-gray-50 shadow-sm disabled:opacity-50"
                    >
                      <Minus className="w-3 h-3 text-gray-600" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateItem(item.productId, 1)}
                      disabled={orderStatus?.hasOrder && orderStatus.order?.status !== 'DRAFT'}
                      className="w-7 h-7 rounded-full text-white flex items-center justify-center hover:opacity-90 disabled:opacity-50"
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
                  placeholder="Ej: Sin cebolla, salsa aparte..."
                  rows={3}
                  disabled={orderStatus?.hasOrder && orderStatus.order?.status !== 'DRAFT'}
                  className="w-full p-3 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-gray-200 resize-none text-sm disabled:opacity-50"
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
                    <span className="text-green-600 font-medium">A coordinar</span>
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
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitDisabled()}
              className="w-full py-4 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-2 shadow-lg hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
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
          </div>
        )}
      </div>
    </>
  );
}
