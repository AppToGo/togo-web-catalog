'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { X, Loader2, AlertCircle, CheckCircle, UserCheck } from 'lucide-react';
import { useCart } from './cart-context';
import { useOperatorSession } from './operator-session-context';
import { CartItemRow } from './cart-item-row';
import { OperatorOrdersList } from './operator-orders-list';
import { createOperatorOrderAction } from '@/lib/operator-actions';
import type { BusinessInfo } from '@/src/types/catalog.types';
import { formatPrice } from '@/lib/utils';

interface OperatorCartPanelProps {
  business: BusinessInfo;
  onClose?: () => void;
}

/**
 * Carrito del modo operador: el mesero elige la mesa y envía el pedido, que
 * nace confirmado y a su nombre. Sin teléfono ni WhatsApp: tras enviar, el
 * carrito queda vacío para la siguiente mesa.
 */
export function OperatorCartPanel({ business, onClose }: OperatorCartPanelProps) {
  const { cart, updateItem, updateItemNotes, clearCart, itemCount, syncCart, isSyncing } = useCart();
  const {
    token,
    info,
    selectedTableId,
    selectTable,
    lastOrder,
    dismissLastOrder,
    onOrderCreated,
    invalidate,
  } = useOperatorSession();

  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Una clave por intento: si la respuesta se pierde y el mesero reintenta
  // el mismo carrito, el backend devuelve el pedido ya creado.
  const idempotencyKeyRef = useRef<{ fingerprint: string; key: string } | null>(null);

  // La clave solo cubre reintentos del MISMO pedido: si cambia la mesa, el
  // carrito o las notas, es otro pedido y necesita otra clave (si no, el
  // backend devolvería el anterior como si fuera este). Se compara por
  // CONTENIDO, no por identidad del array: `syncCart()` antes de enviar
  // puede devolver un array nuevo con lo mismo y rotar la clave justo
  // cuando más se necesita (el reintento tras una respuesta perdida).
  const orderFingerprint = useMemo(() => {
    const items = cart.items.map((item) => [
      item.productId,
      item.variantId ?? '',
      item.quantity,
      item.price,
      item.notes ?? '',
    ]);
    items.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    return JSON.stringify({ items, table: selectedTableId, notes: notes.trim() });
  }, [cart.items, selectedTableId, notes]);

  const tables = info?.tables ?? [];
  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = useCallback(async () => {
    if (!token || cart.items.length === 0) return;
    if (!selectedTableId) {
      setError('Elige la mesa del pedido');
      return;
    }

    setIsProcessing(true);
    setError(null);
    await syncCart();
    if (idempotencyKeyRef.current?.fingerprint !== orderFingerprint) {
      idempotencyKeyRef.current = {
        fingerprint: orderFingerprint,
        key: crypto.randomUUID(),
      };
    }

    const result = await createOperatorOrderAction(business.slug, token, {
      items: cart.items,
      tableId: selectedTableId,
      notes: notes.trim(),
      idempotencyKey: idempotencyKeyRef.current.key,
    });
    setIsProcessing(false);

    if (!result.success) {
      if (result.errorCode === 'INVALID_SESSION') invalidate(result.error);
      else setError(result.error);
      return;
    }

    idempotencyKeyRef.current = null;
    setNotes('');
    clearCart();
    onOrderCreated(result.data);
  }, [token, cart.items, selectedTableId, notes, orderFingerprint, business.slug, syncCart, clearCart, onOrderCreated, invalidate]);

  const submitLabel = selectedTable
    ? `Enviar a cocina · ${selectedTable.name}`
    : 'Elige una mesa';

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
            onClick={onClose}
            aria-label="Cerrar carrito"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {info && (
        <div className="px-4 py-[6px] bg-[var(--accent-soft)] text-[var(--accent)] text-xs flex items-center gap-[6px] shrink-0">
          <UserCheck size={12} />
          <span>Tomado por {info.operatorName} · no requiere datos del cliente</span>
        </div>
      )}

      {error && (
        <div className="px-4 py-[10px] border-b border-[var(--line)] shrink-0 text-[13px] flex items-start gap-2 bg-red-50 text-red-700">
          <AlertCircle size={16} className="shrink-0 mt-[1px]" />
          <p className="m-0">{error}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0">
        {lastOrder && cart.items.length === 0 ? (
          <div className="px-4 pt-4">
            <div className="flex gap-2 p-3 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <CheckCircle size={20} className="shrink-0" />
              <div className="text-[13px]">
                <div className="font-semibold">
                  Pedido #{lastOrder.orderNumber} enviado
                  {lastOrder.tableLabel ? ` · ${lastOrder.tableLabel}` : ''}
                </div>
                <div>Ya aparece en el tablero del local.</div>
              </div>
            </div>
            <p className="text-[13px] text-[var(--ink-2)] mt-3 mb-0">
              El carrito quedó vacío, listo para la siguiente mesa.
            </p>
            <OperatorOrdersList className="mt-4" />
            <button
              className="w-full mt-4 mb-4 py-3 rounded-xl border-[1.5px] border-[var(--line-2)] text-[14px] font-semibold text-[var(--ink)] hover:bg-[var(--bg)] transition-colors"
              onClick={() => {
                dismissLastOrder();
                onClose?.();
              }}
            >
              Seguir tomando pedidos
            </button>
          </div>
        ) : cart.items.length === 0 ? (
          <div className="text-center py-12 px-4 text-[var(--ink-3)]">
            <div className="text-[40px] mb-3">🛒</div>
            <div className="text-[14px]">Agrega productos para tomar el pedido</div>
          </div>
        ) : (
          <>
            {/* Mesa */}
            <div className="px-4 pt-3 pb-1">
              <div className="text-xs font-semibold text-[var(--ink-3)] mb-[6px]">Mesa</div>
              {!info ? (
                <p className="text-[13px] text-[var(--ink-3)] m-0">
                  Cargando las mesas de la sede...
                </p>
              ) : info.dineInEnabled && tables.length > 0 ? (
                <>
                  <div className="grid grid-cols-4 gap-[6px]" aria-label="Mesa del pedido">
                    {tables.map((table) => {
                      const isSelected = table.id === selectedTableId;
                      return (
                        <button
                          key={table.id}
                          aria-pressed={isSelected}
                          onClick={() => {
                            selectTable(table.id);
                            setError(null);
                          }}
                          className={`min-h-11 px-1 rounded-lg border-[1.5px] text-[13px] truncate transition-colors ${
                            isSelected
                              ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold'
                              : table.hasOpenOrder
                                ? 'border-[var(--line)] bg-[var(--bg)] text-[var(--ink-3)] hover:border-[var(--accent)]'
                                : 'border-[var(--line-2)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--accent)]'
                          }`}
                        >
                          {table.name}
                          {table.hasOpenOrder && <span className="sr-only"> · con pedido abierto</span>}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-[var(--ink-3)] mt-[6px] mb-0">
                    En gris: mesa con un pedido abierto
                  </p>
                </>
              ) : (
                <p className="text-[13px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2 m-0">
                  Esta sede no tiene mesas habilitadas para operadores. Actívalas en el admin.
                </p>
              )}
            </div>

            <div className="pt-2">
              {cart.items.map((item) => (
                <CartItemRow
                  key={item.variantId ? `${item.productId}:${item.variantId}` : item.productId}
                  item={item}
                  disabled={isProcessing}
                  onChangeQuantity={updateItem}
                  onSaveNotes={updateItemNotes}
                />
              ))}
            </div>

            {/* Notas */}
            <div className="px-4 py-3">
              <label htmlFor="operator-order-notes" className="text-xs font-semibold text-[var(--ink-3)] block mb-[6px]">
                Notas para cocina
              </label>
              <textarea
                id="operator-order-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Churrasco término medio"
                rows={2}
                maxLength={500}
                disabled={isProcessing}
                className="w-full px-3 py-[9px] bg-[var(--surface)] border-[1.5px] border-[var(--line)] rounded-lg text-[13px] text-[var(--ink)] resize-none outline-none transition-[border-color] leading-[1.5] placeholder:text-[var(--ink-3)] focus:border-[var(--accent)] disabled:opacity-50"
              />
            </div>
          </>
        )}
      </div>

      {cart.items.length > 0 && (
        <div className="shrink-0 border-t border-[var(--line)] px-4 py-3 bg-[var(--surface)]">
          <div
            className="flex justify-between items-center mb-[10px] text-[16px] font-bold text-[var(--ink)] tracking-[-0.02em]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <button
            className="w-full py-[14px] rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] text-[15px] font-bold tracking-[-0.01em] flex items-center justify-center gap-2 transition-opacity shadow-[0_4px_14px_rgba(20,20,15,0.08)] hover:opacity-90 active:opacity-80 disabled:opacity-45 disabled:cursor-not-allowed"
            style={{ fontFamily: 'var(--font-display)' }}
            onClick={handleSubmit}
            disabled={isProcessing || isSyncing || !info?.dineInEnabled}
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Enviando...
              </>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      )}
    </>
  );
}
