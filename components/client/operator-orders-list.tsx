'use client';

import { useEffect } from 'react';
import { OPERATOR_ORDERS_REFRESH_MS, useOperatorSession } from './operator-session-context';
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
 * sesión. Se refresca mientras está montado.
 */
export function OperatorOrdersList({ className = '' }: OperatorOrdersListProps) {
  const { orders, refreshOrders } = useOperatorSession();

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refreshOrders();
    }, OPERATOR_ORDERS_REFRESH_MS);
    return () => clearInterval(timer);
  }, [refreshOrders]);

  return (
    <section className={className} aria-labelledby="operator-orders-title">
      <div id="operator-orders-title" className="text-xs font-semibold text-[var(--ink-3)] mb-[6px]">
        Mis pedidos de este turno
      </div>
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
              <li
                key={order.id}
                className="flex items-center justify-between gap-2 px-3 py-2 text-[13px] border-b border-[var(--line)] last:border-b-0"
              >
                <span className="text-[var(--ink)] truncate">
                  #{order.orderNumber}
                  {order.tableLabel ? ` · ${order.tableLabel}` : ''}
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="text-[var(--ink-3)]">{formatPrice(order.total)}</span>
                  <span className={`font-medium ${status.className}`}>{status.label}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
