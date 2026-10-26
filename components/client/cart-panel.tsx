'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, AlertCircle, CheckCircle, Phone, Utensils } from 'lucide-react';
import { useCart } from './cart-context';
import { CartItemRow } from './cart-item-row';
import { OperatorCartPanel } from './operator-cart-panel';
import { useOperatorSession } from './operator-session-context';
import { createOrderAction, createOrderPublicAction, updateOrderAction, updateOrderByTokenAction, checkOrderAction, getOrderByTokenAction } from '@/lib/cart-actions';
import { PhoneCaptureModal } from './phone-capture-modal';
import type { BusinessInfo } from '@/src/types/catalog.types';
import { formatPrice } from '@/lib/utils';

// Sin número de pedido a propósito: el consecutivo del negocio se asigna al
// confirmar, así que acá el backend todavía devuelve el id legado alfanumérico
// (#A1B2C3) y citarlo solo confunde — el cliente vería después otro número
// distinto, el real. El bot identifica al cliente por su teléfono y le ofrece
// su pedido en curso, que es más fiable que pedirle que copie un código.
function buildWaMeUrl(phone: string | undefined, businessName: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  const text = `Hola, acabo de hacer un pedido en ${businessName} y quiero completarlo`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function buildWaMeUrlSimple(phone: string | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

interface CartPanelProps {
  business: BusinessInfo;
  /** Al pasar a true consulta si el cliente ya tiene un pedido (al abrir el
   *  drawer en móvil; al montar la columna en escritorio). */
  active: boolean;
  /** Panel siempre visible (columna de escritorio): como no se abre y cierra,
   *  vuelve a consultar el pedido al volver a la pestaña y al cambiar el
   *  carrito, para no quedarse con un estado viejo (p. ej. el operador ya
   *  confirmó el pedido mientras el cliente seguía en WhatsApp Web). */
  alwaysVisible?: boolean;
  /** Cierra el contenedor (drawer). Sin él no hay botón de cerrar. */
  onClose?: () => void;
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

/**
 * Contenido del carrito: ítems, notas, resumen y envío del pedido. Lo usan
 * el drawer (móvil) y la columna lateral (escritorio).
 */
/** Espera tras el último cambio del carrito antes de reconsultar el pedido. */
const ORDER_RECHECK_DEBOUNCE_MS = 1500;
/** Mínimo entre reconsultas de fondo (focus y visibilitychange llegan juntos). */
const ORDER_RECHECK_MIN_INTERVAL_MS = 1000;

export function CartPanel(props: CartPanelProps) {
  const { isOperatorMode } = useOperatorSession();
  // Modo operador: otro flujo (mesa, sin teléfono ni WhatsApp). Va en un
  // componente aparte para no mezclar sus hooks con los del cliente.
  if (isOperatorMode) {
    return <OperatorCartPanel business={props.business} onClose={props.onClose} />;
  }
  return <CustomerCartPanel {...props} />;
}

function CustomerCartPanel({ business, active, alwaysVisible = false, onClose }: CartPanelProps) {
  const router = useRouter();
  const { cart, updateItem, updateItemNotes, clearCart, itemCount, isSyncing, syncCart, customer, isIdentified, sessionId, branchId, branchPhone, whatsappToken } = useCart();

  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const pendingSubmitRef = useRef(false);
  // Holds the latest handleSubmitOrder to avoid stale closures in the isIdentified effect
  const handleSubmitOrderRef = useRef<() => Promise<void>>(async () => {});
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  // Sin esto, tocar "Actualizar" antes de que resuelva checkExistingOrder()
  // (llamada de red disparada al abrir el drawer) veía orderStatus === null,
  // trataba el pedido DRAFT existente como inexistente, y creaba uno nuevo
  // en vez de actualizarlo — perdiendo dirección/método de pago ya
  // guardados en el pedido original.
  const [isCheckingOrder, setIsCheckingOrder] = useState(false);
  const [showAlert, setShowAlert] = useState<{ type: 'error' | 'success' | 'warning'; message: string } | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  // `silent`: reconsulta de fondo de la columna de escritorio. No bloquea el
  // botón de envío ni pisa la nota que el cliente puede estar escribiendo.
  const checkExistingOrder = useCallback(async ({ silent = false } = {}) => {
    if (!sessionId) return;
    if (!silent) setIsCheckingOrder(true);
    try {
      // Caminos separados a propósito (no un solo orderKey compartido):
      // checkOrderAction pega al endpoint anónimo (/catalog/:businessSlug/order),
      // cuyo backend valida formato de slug — un token real de WhatsApp
      // (trae mayúsculas) lo rechazaría, dejando hasOrder siempre en false
      // para clientes de WhatsApp.
      const data = whatsappToken
        ? await getOrderByTokenAction(whatsappToken)
        : await checkOrderAction(business.slug, { sessionId, branchId });
      setOrderStatus(data);
      if (!silent && data.order?.notes) setNotes(data.order.notes);
    } catch (error) {
      console.error('Error checking order:', error);
    } finally {
      if (!silent) setIsCheckingOrder(false);
    }
  }, [business.slug, sessionId, whatsappToken, branchId]);

  // Volver a la pestaña dispara `visibilitychange` y `focus` juntos: una
  // sola reconsulta por vuelta.
  const lastRecheckRef = useRef(0);
  const recheckSilently = useCallback(() => {
    const now = Date.now();
    if (now - lastRecheckRef.current < ORDER_RECHECK_MIN_INTERVAL_MS) return;
    lastRecheckRef.current = now;
    checkExistingOrder({ silent: true });
  }, [checkExistingOrder]);

  useEffect(() => {
    if (active) checkExistingOrder();
  }, [active, checkExistingOrder]);

  // Columna de escritorio: reconsulta al volver a la pestaña.
  useEffect(() => {
    if (!alwaysVisible) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') recheckSilently();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [alwaysVisible, recheckSilently]);

  // Columna de escritorio: reconsulta cuando el carrito deja de cambiar. El
  // primer render no cuenta: ya lo cubre el efecto de `active`.
  const isFirstItemCountRef = useRef(true);
  useEffect(() => {
    if (!alwaysVisible) return;
    if (isFirstItemCountRef.current) {
      isFirstItemCountRef.current = false;
      return;
    }
    const timer = setTimeout(recheckSilently, ORDER_RECHECK_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [alwaysVisible, itemCount, recheckSilently]);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const getOrderStatusText = (status: string): string => {
    const map: Record<string, string> = {
      CONFIRMED: 'confirmada', PAID: 'pagada', PREPARING: 'en preparación',
      SHIPPED: 'enviada', DELIVERED: 'entregada', CANCELLED: 'cancelada',
    };
    return map[status] || status.toLowerCase();
  };

  // Cart storage is determined by branchId, not origin:
  //   branchId present → PublicCartService (togo:cart:public:slug:branchId:sessionId)
  //   whatsappToken present → CartSessionService (togo:cart:token)
  // A valid cart must have one or the other — reaching neither is a
  // misconfiguration. Compartido entre el flujo de creación y el de
  // actualización de una orden DRAFT (antes duplicado en ambos).
  const requireResolvedSede = useCallback((): boolean => {
    if (whatsappToken || branchId) return true;
    setShowAlert({ type: 'error', message: 'No se pudo determinar la sede. Por favor recarga la página.' });
    setIsProcessing(false);
    return false;
  }, [whatsappToken, branchId]);

  // Fase 2 (docs/architecture/pedidos-en-mesa.md): un pedido con mesa no
  // necesita teléfono — el comensal está sentado en el local. El backend
  // atribuye el pedido al cliente técnico del negocio cuando no hay
  // teléfono. Sin mesa, el teléfono sigue siendo obligatorio (comportamiento
  // previo, sin cambios).
  const isTableOrder = !!customer.tableNumber;

  // Qué pedido existente puede editar el cliente desde acá:
  // - DRAFT: siempre.
  // - CONFIRMED por el flujo con token: el backend (GET /web-catalog/:token/order)
  //   solo lo devuelve con hasOrder=true si el bloqueo de edición está vigente
  //   (el bot lo tomó cuando el cliente pidió modificar su pedido confirmado),
  //   y PATCH lo acepta en ese caso. El endpoint anónimo sí devuelve pedidos ya
  //   confirmados que no se pueden tocar, por eso ahí solo vale DRAFT.
  const existingStatus = orderStatus?.hasOrder ? orderStatus.order?.status : undefined;
  const isConfirmedEdit = !!whatsappToken && existingStatus === 'CONFIRMED';
  const canEditExisting = existingStatus === 'DRAFT' || isConfirmedEdit;
  const isLocked = !!existingStatus && !canEditExisting;

  const handleSubmitOrder = useCallback(async () => {
    if (cart.items.length === 0 || isCheckingOrder) return;
    if (!isTableOrder) {
      if (!isIdentified) { setShowPhoneModal(true); return; }
      // All flows that use the public endpoint require a phone number
      if (!customer.phone) {
        setShowPhoneModal(true);
        return;
      }
    }

    setIsProcessing(true);
    setShowAlert(null);
    await syncCart();

    try {
      if (isLocked) {
        setShowAlert({ type: 'error', message: `Esta orden ya fue ${getOrderStatusText(existingStatus!)}.` });
        setIsProcessing(false);
        return;
      }
      if (orderStatus?.order && canEditExisting) {
        if (!requireResolvedSede()) return;
        // A diferencia de la creación (que manda cart.items explícito en el
        // body), estos dos endpoints de actualización NO reciben items —
        // cada uno relee el carrito guardado server-side del storage que le
        // corresponde (ver comentario arriba). Por eso acá hay que ramificar
        // por whatsappToken (de dónde salió initialCart), no por branchId:
        // una página de sede siempre resuelve branchId aunque el cliente
        // haya llegado por un link de WhatsApp con su carrito en el storage
        // por token — ramificar por branchId mandaba a esos clientes al
        // endpoint de sesión, que encontraba el carrito de sesión vacío.
        const result = whatsappToken
          ? await updateOrderByTokenAction(whatsappToken, orderStatus.order.id, { notes: notes.trim() })
          : await updateOrderAction(business.slug, orderStatus.order.id, { notes: notes.trim(), sessionId, branchId: branchId! });
        if (!result.success) throw new Error(result.error || 'Error al actualizar');

        const phoneForWaMe = branchPhone ?? business.phone;
        const waUrl = whatsappToken
          ? buildWaMeUrlSimple(phoneForWaMe)
          : buildWaMeUrl(phoneForWaMe, business.name);

        if (customer.origin !== 'whatsapp' && waUrl) {
          window.open(waUrl, '_blank', 'noopener,noreferrer');
        }

        await checkExistingOrder();
        clearCart();

        const params = new URLSearchParams();
        if (waUrl) params.set('wa', encodeURIComponent(waUrl));
        if (whatsappToken) params.set('t', '1');

        handleClose();
        router.push(`/${business.slug}/pedido-confirmado?${params}`);
        return;
      }
      if (!requireResolvedSede()) return;
      const result = branchId
        ? await createOrderPublicAction(business.slug, {
            items: cart.items.map(item => ({ ...item, branchId })),
            notes: notes.trim(),
            sessionId,
            // Sin teléfono en un pedido de mesa: el backend usa el cliente
            // técnico del negocio (Fase 2).
            phoneNumber: customer.phone || undefined,
            // customer.origin refleja de dónde vino el cliente originalmente
            // (se fija al montar y no cambia), a diferencia de whatsappToken
            // que puede degradarse a undefined a mitad de sesión si el token
            // venció — sin esto, un cliente de WhatsApp con token vencido
            // perdería el mensaje de checkout por WhatsApp aunque el pedido
            // se cree bien por el camino público.
            fromWhatsApp: customer.origin === 'whatsapp',
            fromDirectory: customer.origin === 'directory',
            tableCode: customer.tableNumber,
          })
        : await createOrderAction(whatsappToken!, {
            items: cart.items, notes: notes.trim(), source: customer.origin, sessionId,
          });
      if (!result.success) throw new Error(result.error || 'Error al crear orden');

      // Priority: order.branchPhone (branch's own WhatsApp) → context branchPhone → business.phone
      const phoneForWaMe = result.order?.branchPhone ?? branchPhone ?? business.phone;
      const waUrl = whatsappToken
        ? buildWaMeUrlSimple(phoneForWaMe)
        : buildWaMeUrl(phoneForWaMe, business.name);

      if (customer.origin !== 'whatsapp' && waUrl) {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }

      await checkExistingOrder();
      clearCart();

      const params = new URLSearchParams();
      if (waUrl) params.set('wa', encodeURIComponent(waUrl));
      if (whatsappToken) params.set('t', '1');

      handleClose();
      router.push(`/${business.slug}/pedido-confirmado?${params}`);
    } catch (error) {
      setShowAlert({ type: 'error', message: error instanceof Error ? error.message : 'Error al procesar' });
    } finally {
      setIsProcessing(false);
    }
  }, [cart.items, customer, isTableOrder, notes, orderStatus, isLocked, canEditExisting, isCheckingOrder, sessionId, whatsappToken, branchId, requireResolvedSede, syncCart, checkExistingOrder, clearCart, handleClose, business, branchPhone, router]);

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
    if (isCheckingOrder) return 'Verificando pedido...';
    if (!isIdentified && !isTableOrder) return 'Continuar';
    if (isLocked) return 'Orden no modificable';
    if (isConfirmedEdit) return 'Guardar cambios';
    if (orderStatus?.hasOrder) return 'Actualizar orden';
    return 'Enviar pedido';
  };

  const isSubmitDisabled = () => (
    isProcessing || isSyncing || isCheckingOrder || cart.items.length === 0 ||
    isLocked
  );

  const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
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
        {onClose && (
          <button
            className="w-8 h-8 rounded-full bg-[var(--bg)] border border-[var(--line)] flex items-center justify-center text-[var(--ink-2)] transition-colors hover:bg-[var(--line)] shrink-0"
            onClick={handleClose}
            aria-label="Cerrar carrito"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Mesa badge (Fase 2) */}
      {isTableOrder && (
        <div className="px-4 py-[6px] bg-[var(--accent-soft)] text-[var(--accent)] text-xs flex items-center gap-[6px] shrink-0">
          <Utensils size={12} />
          <span>Pedido en mesa: {customer.tableNumber}</span>
        </div>
      )}

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
            canEditExisting ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {/* En DRAFT no se muestra número: el consecutivo del negocio se
              asigna al confirmar, así que ahí `orderNumber` todavía es el id
              legado alfanumérico. Una vez confirmada sí es el número real. */}
          {orderStatus.order?.status === 'DRAFT'
            ? 'Tienes un pedido en borrador'
            : isConfirmedEdit
            ? `Estás editando tu pedido #${orderStatus.order?.orderNumber}`
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
              <CartItemRow
                key={item.variantId ? `${item.productId}:${item.variantId}` : item.productId}
                item={item}
                disabled={isLocked}
                onChangeQuantity={updateItem}
                onSaveNotes={updateItemNotes}
              />
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
                maxLength={500}
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
          {!isIdentified && !isTableOrder && (
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

      <PhoneCaptureModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSubmit={handlePhoneSubmit}
      />
    </>
  );
}
