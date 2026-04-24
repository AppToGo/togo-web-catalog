'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Minus, Plus, Loader2, AlertCircle, CheckCircle, Phone } from 'lucide-react';
import { useCart } from './cart-context';
import { useCartUI } from './cart-ui-context';
import { CartItemNotes } from './cart-item-notes';
import { createOrderAction, createOrderPublicAction, updateOrderAction, checkOrderAction } from '@/lib/cart-actions';
import { PhoneCaptureModal } from './phone-capture-modal';
import type { BusinessInfo } from '@/src/types/catalog.types';
import { formatPrice } from '@/lib/utils';

function buildWaMeUrl(phone: string | undefined, businessName: string, orderNumber?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  const text = orderNumber
    ? `Hola, acabo de hacer el pedido #${orderNumber} en ${businessName} y quiero completarlo`
    : `Hola, acabo de hacer un pedido en ${businessName} y quiero completarlo`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

interface CartDrawerProps {
  business: BusinessInfo;
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

export function CartDrawer({ business }: CartDrawerProps) {
  const { cart, updateItem, updateItemNotes, itemCount, isSyncing, syncCart, customer, isIdentified, sessionId, branchId } = useCart();
  const { isCartOpen, closeCart } = useCartUI();

  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const pendingSubmitRef = useRef(false);
  // Holds the latest handleSubmitOrder to avoid stale closures in the isIdentified effect
  const handleSubmitOrderRef = useRef<() => Promise<void>>(async () => {});
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [showAlert, setShowAlert] = useState<{ type: 'error' | 'success' | 'warning'; message: string } | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [animationState, setAnimationState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');

  const checkExistingOrder = useCallback(async () => {
    if (!sessionId) return;
    try {
      const data = await checkOrderAction(business.slug, { sessionId });
      setOrderStatus(data);
      if (data.order?.notes) setNotes(data.order.notes);
    } catch (error) {
      console.error('Error checking order:', error);
    }
  }, [business.slug, sessionId]);

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
      setAnimationState('opening');
      const timer = setTimeout(() => {
        setAnimationState('open');
        checkExistingOrder();
      }, 50);
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
  }, [isCartOpen, checkExistingOrder]);

  const handleClose = useCallback(() => {
    setAnimationState('closing');
    setTimeout(() => {
      setAnimationState('closed');
      document.body.style.overflow = '';
      closeCart();
    }, 300);
  }, [closeCart]);

  const getOrderStatusText = (status: string): string => {
    const map: Record<string, string> = {
      CONFIRMED: 'confirmada', PAID: 'pagada', PREPARING: 'en preparación',
      SHIPPED: 'enviada', DELIVERED: 'entregada', CANCELLED: 'cancelada',
    };
    return map[status] || status.toLowerCase();
  };

  const handleSubmitOrder = useCallback(async () => {
    if (cart.items.length === 0) return;
    if (!isIdentified) { setShowPhoneModal(true); return; }
    // Guard: non-whatsapp flow requires a valid phone
    if (customer.origin !== 'whatsapp' && !customer.phone) {
      setShowPhoneModal(true);
      return;
    }

    setIsProcessing(true);
    setShowAlert(null);
    await syncCart();

    try {
      if (orderStatus?.hasOrder && orderStatus.order?.status !== 'DRAFT') {
        setShowAlert({ type: 'error', message: `Esta orden ya fue ${getOrderStatusText(orderStatus.order!.status)}.` });
        setIsProcessing(false);
        return;
      }
      if (orderStatus?.hasOrder && orderStatus.order?.status === 'DRAFT') {
        const result = await updateOrderAction(business.slug, orderStatus.order.id, { notes: notes.trim(), sessionId });
        if (!result.success) throw new Error(result.error || 'Error al actualizar');
        setShowAlert({ type: 'success', message: `¡Orden #${result.order?.orderNumber} actualizada!` });
        await checkExistingOrder();
        setIsProcessing(false);
        return;
      }
      // WhatsApp users → web-catalog endpoint (session token auth)
      // All other origins (direct, qr, instagram, facebook) → public endpoint (phone auth)
      const result = customer.origin === 'whatsapp'
        ? await createOrderAction(business.slug, {
            items: cart.items, notes: notes.trim(), source: customer.origin, sessionId,
          })
        : await createOrderPublicAction(business.slug, {
            // Backend requires branchId in each item (public catalog endpoint validation)
            items: cart.items.map(item => ({ ...item, branchId: branchId! })),
            notes: notes.trim(),
            sessionId,
            phoneNumber: customer.phone!,
          });
      if (!result.success) throw new Error(result.error || 'Error al crear orden');

      if (customer.origin === 'whatsapp') {
        await checkExistingOrder();
        setShowAlert({ type: 'success', message: `¡Pedido registrado! Te escribimos por WhatsApp para coordinar los detalles.` });
      } else {
        await checkExistingOrder();
        const waUrl = result.order?.waMeUrl ?? buildWaMeUrl(business.phone, business.name, result.order?.orderNumber);
        if (waUrl) {
          window.open(waUrl, '_blank', 'noopener,noreferrer');
          return;
        }
        setShowAlert({ type: 'success', message: `¡Orden #${result.order?.orderNumber} registrada!` });
      }
    } catch (error) {
      setShowAlert({ type: 'error', message: error instanceof Error ? error.message : 'Error al procesar' });
    } finally {
      setIsProcessing(false);
    }
  }, [cart.items, customer, notes, orderStatus, sessionId, syncCart, checkExistingOrder, business]);

  // Keep ref current so the isIdentified effect always calls the latest version
  handleSubmitOrderRef.current = handleSubmitOrder;

  const handlePhoneSubmit = () => {
    pendingSubmitRef.current = true;
    setShowPhoneModal(false);
  };

  // Trigger submit once the customer becomes identified after the phone modal closes
  useEffect(() => {
    if (isIdentified && pendingSubmitRef.current) {
      pendingSubmitRef.current = false;
      handleSubmitOrderRef.current();
    }
  }, [isIdentified]);

  const getSubmitButtonText = () => {
    if (isSyncing) return 'Sincronizando...';
    if (isProcessing) return 'Procesando...';
    if (!isIdentified) return 'Continuar';
    if (orderStatus?.hasOrder && orderStatus.order?.status !== 'DRAFT') return 'Orden no modificable';
    if (orderStatus?.hasOrder) return 'Actualizar orden';
    return 'Enviar pedido';
  };

  const isSubmitDisabled = () => (
    isProcessing || isSyncing || cart.items.length === 0 ||
    (orderStatus?.hasOrder && orderStatus.order?.status !== 'DRAFT')
  );

  const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isClosing = animationState === 'closing';
  const isLocked = !!(orderStatus?.hasOrder && orderStatus.order?.status !== 'DRAFT');

  if (animationState === 'closed' && !isCartOpen) return null;

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

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-[14px] pb-3 border-b border-[var(--line)] shrink-0">
          <div>
            <div
              className="text-[17px] font-bold text-[var(--ink)] tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Tu pedido
            </div>
            <div className="text-xs text-[var(--ink-3)] mt-[1px]">{itemCount} items</div>
          </div>
          <button
            className="w-8 h-8 rounded-full bg-[var(--bg)] border border-[var(--line)] flex items-center justify-center text-[var(--ink-2)] transition-colors hover:bg-[var(--line)] shrink-0"
            onClick={handleClose}
            aria-label="Cerrar carrito"
          >
            <X size={16} />
          </button>
        </div>

        {/* Customer phone badge */}
        {isIdentified && customer.phone && (
          <div className="px-4 py-[6px] bg-[var(--accent-soft)] text-[var(--accent)] text-xs flex items-center gap-[6px] shrink-0">
            <Phone size={12} />
            <span>Pedido vinculado a: {customer.phone}</span>
          </div>
        )}

        {/* Alert */}
        {showAlert && (
          <div
            className={`px-4 py-[10px] border-b border-[var(--line)] shrink-0 text-[13px] flex items-start gap-2 ${
              showAlert.type === 'error' ? 'bg-red-50 text-red-700' :
              showAlert.type === 'success' ? 'bg-[var(--accent-soft)] text-[var(--accent)]' :
              'bg-amber-50 text-amber-700'
            }`}
          >
            {showAlert.type === 'error' && <AlertCircle size={16} className="shrink-0 mt-[1px]" />}
            {showAlert.type === 'success' && <CheckCircle size={16} className="shrink-0 mt-[1px]" />}
            <p className="m-0">{showAlert.message}</p>
          </div>
        )}

        {/* Order status */}
        {orderStatus?.hasOrder && (
          <div
            className={`px-4 py-[6px] text-xs font-semibold shrink-0 ${
              orderStatus.order?.status === 'DRAFT' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {orderStatus.order?.status === 'DRAFT'
              ? `Orden #${orderStatus.order.orderNumber} en borrador`
              : `Orden #${orderStatus.order?.orderNumber} ${getOrderStatusText(orderStatus.order!.status)}`}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto pt-2 min-h-0">
          {cart.items.length === 0 ? (
            <div className="text-center py-12 px-4 text-[var(--ink-3)]">
              <div className="text-[40px] mb-3">🛒</div>
              <div className="text-[14px]">Tu carrito está vacío</div>
            </div>
          ) : (
            <>
              {cart.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-[10px] px-4 py-[10px] border-b border-[var(--line)] last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[14px] font-semibold text-[var(--ink)] truncate tracking-[-0.01em]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {item.name}
                    </div>
                    <CartItemNotes
                      productId={item.productId}
                      notes={item.notes}
                      disabled={isLocked}
                      onSave={updateItemNotes}
                    />
                    <div className="flex items-center gap-[6px] mt-0.5">
                      <span className="text-xs text-[var(--ink-3)]">{formatPrice(item.price)} c/u</span>
                    </div>
                  </div>

                  {/* Stepper */}
                  <div className="flex items-center gap-0.5 bg-[var(--bg)] border-[1.5px] border-[var(--line)] rounded-[20px] p-0.5 shrink-0">
                    <button
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-[background] text-[var(--ink-2)] hover:bg-[var(--line)] disabled:opacity-40"
                      onClick={() => updateItem(item.productId, -1)}
                      disabled={isLocked}
                      aria-label="Quitar uno"
                    >
                      <Minus size={11} />
                    </button>
                    <span
                      className="min-w-6 text-center text-[13px] font-bold text-[var(--ink)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {item.quantity}
                    </span>
                    <button
                      className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--accent)] text-[var(--accent-ink)] hover:opacity-[0.88] transition-opacity disabled:opacity-40"
                      onClick={() => updateItem(item.productId, 1)}
                      disabled={isLocked}
                      aria-label="Agregar uno"
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  <div
                    className="text-[14px] font-bold text-[var(--ink)] tracking-[-0.03em] min-w-[70px] text-right"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}

              {/* Notes */}
              <div className="px-4 py-3">
                <label className="text-xs font-semibold text-[var(--ink-3)] block mb-[6px]">
                  Notas para el pedido
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Sin cebolla, salsa aparte..."
                  rows={2}
                  disabled={isLocked}
                  className="w-full px-3 py-[9px] bg-[var(--surface)] border-[1.5px] border-[var(--line)] rounded-lg text-[13px] text-[var(--ink)] resize-none outline-none transition-[border-color] leading-[1.5] placeholder:text-[var(--ink-3)] focus:border-[var(--accent)] disabled:opacity-50"
                />
              </div>

              {/* Summary */}
              <div className="px-4 py-3 border-t border-[var(--line)] mt-1">
                <div className="flex justify-between items-center py-1 text-[13px] text-[var(--ink-2)]">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between items-center py-1 text-[13px] text-[var(--ink-2)]">
                  <span>Envío</span>
                  <span className="text-[var(--accent)] font-medium">A coordinar</span>
                </div>
                <div
                  className="flex justify-between items-center pt-[10px] mt-1 border-t border-[var(--line)] text-[16px] font-bold text-[var(--ink)] tracking-[-0.02em]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="shrink-0 border-t border-[var(--line)] px-4 py-3 bg-[var(--surface)]">
            {!isIdentified && (
              <p className="text-xs text-[var(--ink-3)] text-center mb-2">
                Te pediremos tu teléfono para confirmar el pedido
              </p>
            )}
            <button
              className="w-full py-[14px] rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] text-[15px] font-bold tracking-[-0.01em] flex items-center justify-center gap-2 transition-opacity shadow-[0_4px_14px_rgba(20,20,15,0.08)] hover:opacity-90 active:opacity-80 disabled:opacity-45 disabled:cursor-not-allowed"
              style={{ fontFamily: 'var(--font-display)' }}
              onClick={handleSubmitOrder}
              disabled={isSubmitDisabled()}
            >
              {isProcessing ? (
                <><Loader2 size={18} className="animate-spin" />Procesando...</>
              ) : (
                getSubmitButtonText()
              )}
            </button>
          </div>
        )}
      </div>

      <PhoneCaptureModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSubmit={handlePhoneSubmit}
      />
    </>
  );
}
