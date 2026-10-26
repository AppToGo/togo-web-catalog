'use client';

import { useCallback, useEffect, useState } from 'react';
import { OPERATOR_ORDERS_REFRESH_MS, useOperatorSession } from './operator-session-context';
import { getOperatorOrderDetailAction } from '@/lib/operator-actions';
import type { OperatorOrderDetail } from '@/src/types/catalog.types';
import { formatPrice } from '@/lib/utils';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  CONFIRMED: { label: 'Confirmado', className: 'text-[var(--accent)]' },
  PAYMENT_PENDING: { label: 'Por pagar', className: 'text-amber-700' },
  PAID: { label: 'Pagado', className: 'text-[var(--accent)]' },
  IN_PROGRESS: { label: 'En cocina', className: 'text-amber-700' },
  READY: { label: 'Listo', className: 'text-[var(--ink-2)]' },
  ON_THE_WAY: { label: 'En camino', className: 'text-[var(--ink-2)]' },
  COMPLETED: { label: 'Entregado', className: 'text-[var(--ink-3)]' },
  CANCELLED: { label: 'Cancelado', className: 'text-red-700' },
};

interface OperatorOrdersListProps {
  className?: string;
}

/**
 * "Mis pedidos de este turno": los pedidos que el operador tomó con esta
 * sesión. Tocar uno abre la cuenta (detalle con líneas y total) para
 * cobrarla o compararla ante un reclamo, y desde ahí se puede volver a
 * cargar al carrito para seguir agregando. Se refresca mientras está
 * montado y en vivo por socket.
 */
export function OperatorOrdersList({ className = '' }: OperatorOrdersListProps) {
  const {
    businessSlug,
    token,
    orders,
    refreshOrders,
    orderVersion,
    requestCartLoad,
  } = useOperatorSession();
  const [stale, setStale] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<OperatorOrderDetail | null>(null);
  const [viewingError, setViewingError] = useState<string | null>(null);
  const [loadedNotice, setLoadedNotice] = useState<string | null>(null);

  const runRefresh = useCallback(async () => {
    const ok = await refreshOrders();
    setStale(!ok);
  }, [refreshOrders]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') runRefresh();
    }, OPERATOR_ORDERS_REFRESH_MS);
    return () => clearInterval(timer);
  }, [runRefresh]);

  const loadDetail = useCallback(
    async (orderId: string) => {
      if (!token) return;
      setViewingError(null);
      const result = await getOperatorOrderDetailAction(businessSlug, token, orderId);
      if (result.success) {
        setViewingId(orderId);
        setViewing(result.data);
      } else {
        setViewingError(result.error);
      }
    },
    [businessSlug, token],
  );

  // La cuenta abierta se recarga sola (estado, pago o más productos).
  useEffect(() => {
    if (viewingId) loadDetail(viewingId);
  }, [orderVersion, viewingId, loadDetail]);

  const handleAddMore = useCallback(() => {
    if (!viewing) return;
    requestCartLoad({
      orderId: viewing.id,
      tableId: viewing.tableId,
      items: viewing.items
        .filter((item) => item.productVariantId)
        .map((item) => ({
          variantId: item.productVariantId ?? undefined,
          productId: item.productVariantId ?? item.productId,
          name: item.productName,
          price: item.unitPrice,
          quantity: item.quantity,
          notes: item.notes ?? undefined,
        })),
    });
    setLoadedNotice(`Pedido ${viewing.orderNumber} cargado al carrito`);
  }, [viewing, requestCartLoad]);

  if (viewing && viewingId) {
    const status = STATUS_LABELS[viewing.status] ?? {
      label: viewing.status,
      className: 'text-[var(--ink-2)]',
    };
    return (
      <section className={className} aria-labelledby="operator-order-detail-title">
        <div className="flex items-center justify-between mb-[6px]">
          <div id="operator-order-detail-title" className="text-xs font-semibold text-[var(--ink-3)]">
            Cuenta · Pedido #{viewing.orderNumber}
            {viewing.tableLabel ? ` · ${viewing.tableLabel}` : ''}
          </div>
          <span className={`text-[12px] font-medium ${status.className}`}>{status.label}</span>
        </div>
        {viewing.paymentStatus !== 'PAID' && (
          <p className="text-[12px] text-amber-700 m-0 mb-[6px]">Pendiente de pago</p>
        )}
        <ul className="m-0 mb-[6px] p-0 list-none border border-[var(--line)] rounded-lg overflow-hidden">
          {viewing.items.map((item, index) => (
            <li
              key={`${item.productVariantId ?? item.productId}-${index}`}
              className="flex items-center justify-between gap-2 px-3 py-2 text-[13px] border-b border-[var(--line)] last:border-b-0"
            >
              <span className="text-[var(--ink)] truncate">
                {item.quantity} × {item.productName}
              </span>
              <span className="text-[var(--ink-3)] shrink-0">{formatPrice(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between px-3 py-2 text-[13px] font-semibold text-[var(--ink)]">
          <span>Total</span>
          <span>{formatPrice(viewing.total)}</span>
        </div>
        {viewingError && <p className="text-[12px] text-red-700 m-0 mb-[6px]">{viewingError}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setViewingId(null);
              setViewing(null);
              setViewingError(null);
            }}
            className="flex-1 rounded-lg border border-[var(--line)] px-3 py-2 text-[13px] font-medium text-[var(--ink-2)]"
          >
            Volver
          </button>
          <button
            onClick={handleAddMore}
            className="flex-1 rounded-lg bg-[var(--accent)] px-3 py-2 text-[13px] font-semibold text-white"
          >
            Sumar productos
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={className} aria-labelledby="operator-orders-title">
      <div id="operator-orders-title" className="text-xs font-semibold text-[var(--ink-3)] mb-[6px]">
        Mis pedidos de este turno
      </div>
      {stale && (
        <p className="text-[12px] text-amber-700 m-0 mb-[6px]">
          No se pudo actualizar la lista.{' '}
          <button onClick={runRefresh} className="underline underline-offset-2 font-medium">
            Reintentar
          </button>
        </p>
      )}
      {loadedNotice && (
        <p className="text-[12px] text-[var(--accent)] m-0 mb-[6px] font-medium">{loadedNotice}</p>
      )}
      {orders.length === 0 ? (
        <p className="text-[13px] text-[var(--ink-3)] m-0">Todavía no tomaste pedidos.</p>
      ) : (
        <ul className="m-0 p-0 list-none border border-[var(--line)] rounded-lg overflow-hidden">
          {orders.map((order) => {
            const status = STATUS_LABELS[order.status] ?? {
              label: order.status,
              className: 'text-[var(--ink-2)]',
            };
            return (
              <li key={order.id} className="border-b border-[var(--line)] last:border-b-0">
                <button
                  onClick={() => {
                    setLoadedNotice(null);
                    loadDetail(order.id);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-[13px] text-left"
                >
                  <span className="text-[var(--ink)] truncate">
                    #{order.orderNumber}
                    {order.tableLabel ? ` · ${order.tableLabel}` : ''}
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-[var(--ink-3)]">{formatPrice(order.total)}</span>
                    <span className={`font-medium ${status.className}`}>{status.label}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
