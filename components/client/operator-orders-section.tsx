'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronLeft, Plus } from 'lucide-react';
import { OPERATOR_ORDERS_REFRESH_MS, useOperatorSession } from './operator-session-context';
import { useCartUI } from './cart-ui-context';
import { OperatorBar } from './operator-bar';
import { getOperatorOrderDetailAction } from '@/lib/operator-actions';
import type { OperatorOrderDetail, OperatorSessionOrder } from '@/src/types/catalog.types';
import { formatPrice } from '@/lib/utils';
import { isClosedOrder as isClosed, isUnpaidOrder as isUnpaid } from '@/lib/operator-orders';

interface StatusMeta {
  /** Estado del pedido en singular (tarjeta y cuenta) */
  label: string;
  /** Chip del filtro, en plural */
  filter: string;
  /** Colores de la píldora: fondo y texto con contraste suficiente */
  pill: string;
}

/** Orden del flujo: así salen los filtros. */
const STATUS_META: Record<string, StatusMeta> = {
  // Colores fijos, no los de la marca: en un negocio rojo, "Confirmado"
  // con el color de la marca parecía un error.
  CONFIRMED: { label: 'Confirmado', filter: 'Confirmados', pill: 'bg-[#eef0ff] text-[#3b3f9e]' },
  IN_PROGRESS: { label: 'En cocina', filter: 'En cocina', pill: 'bg-[#fdf0d5] text-[#7a4504]' },
  READY: { label: 'Listo', filter: 'Listos', pill: 'bg-[#e3edfd] text-[#1e4fae]' },
  ON_THE_WAY: { label: 'En camino', filter: 'En camino', pill: 'bg-[#e3edfd] text-[#1e4fae]' },
  PAYMENT_PENDING: { label: 'Por pagar', filter: 'Por pagar', pill: 'bg-[#fff4e5] text-[#8a3c04]' },
  PAID: { label: 'Pagado', filter: 'Pagados', pill: 'bg-[#e8f3ed] text-[#0f6b3d]' },
  COMPLETED: { label: 'Entregado', filter: 'Entregados', pill: 'bg-[var(--line)] text-[var(--ink-2)]' },
  CANCELLED: { label: 'Cancelado', filter: 'Cancelados', pill: 'bg-[#fde8e8] text-[#a11a1a]' },
  ABANDONED: { label: 'Abandonado', filter: 'Abandonados', pill: 'bg-[var(--line)] text-[var(--ink-2)]' },
};

const statusMeta = (status: string): StatusMeta =>
  STATUS_META[status] ?? {
    label: status,
    filter: status,
    pill: 'bg-[var(--line)] text-[var(--ink-2)]',
  };

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });

const ALL = 'ALL';

/**
 * "Mis pedidos" del modo operador: los pedidos del día del mesero en la
 * sede, con lo que falta cobrar, filtros por estado y la cuenta de cada uno
 * (para cobrarla, compararla ante un reclamo o sumarle productos). Va como
 * capa encima del catálogo, que sigue montado debajo. Se refresca mientras
 * está a la vista y en vivo por socket.
 */
export function OperatorOrdersSection() {
  const {
    status,
    info,
    businessSlug,
    token,
    orders,
    refreshOrders,
    orderVersion,
    requestCartLoad,
    view,
    setView,
  } = useOperatorSession();
  const { openCart } = useCartUI();
  const [filter, setFilter] = useState<string>(ALL);
  const [stale, setStale] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<OperatorOrderDetail | null>(null);
  const [viewingError, setViewingError] = useState<string | null>(null);

  const isOpen = view === 'orders' && status === 'active' && !!info;

  const runRefresh = useCallback(async () => {
    const ok = await refreshOrders();
    setStale(!ok);
  }, [refreshOrders]);

  // Al abrir trae lo último; mientras está a la vista, cada 30 s.
  useEffect(() => {
    if (!isOpen) return;
    runRefresh();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') runRefresh();
    }, OPERATOR_ORDERS_REFRESH_MS);
    return () => clearInterval(timer);
  }, [isOpen, runRefresh]);

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

  const closeDetail = useCallback(() => {
    setViewingId(null);
    setViewing(null);
    setViewingError(null);
  }, []);

  // Al salir de la sección vuelve a la lista: la próxima vez abre limpia.
  useEffect(() => {
    if (!isOpen) closeDetail();
  }, [isOpen, closeDetail]);

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
    // Al catálogo con el carrito a la vista: ahí se suman los productos.
    setView('catalog');
    openCart();
  }, [viewing, requestCartLoad, setView, openCart]);

  const summary = useMemo(() => {
    const unpaid = orders.filter(isUnpaid);
    return {
      unpaidTotal: unpaid.reduce((sum, order) => sum + order.total, 0),
      unpaidCount: unpaid.length,
      openCount: orders.filter((o) => o.status !== 'COMPLETED' && !isClosed(o.status)).length,
    };
  }, [orders]);

  // Solo los estados que tienen pedidos, en el orden del flujo; los que la
  // lista no conoce van al final con su nombre crudo.
  const filters = useMemo(() => {
    const counts = new Map<string, number>();
    for (const order of orders) counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
    const known = Object.keys(STATUS_META).filter((key) => counts.has(key));
    const unknown = [...counts.keys()].filter((key) => !(key in STATUS_META));
    return [
      { key: ALL, label: 'Todos', count: orders.length },
      ...[...known, ...unknown].map((key) => ({
        key,
        label: statusMeta(key).filter,
        count: counts.get(key) ?? 0,
      })),
    ];
  }, [orders]);

  // Si el estado elegido se quedó sin pedidos (un refresco lo movió), Todos.
  const activeFilter = filters.some((f) => f.key === filter) ? filter : ALL;
  const visible =
    activeFilter === ALL ? orders : orders.filter((order) => order.status === activeFilter);

  if (!isOpen) return null;

  return (
    // Encima del encabezado del negocio (sticky, z-40) y debajo del carrito
    // (drawer, z-50); la barra inferior va un nivel más arriba.
    <div className="fixed inset-0 z-[41] flex flex-col bg-[var(--bg)]">
      <OperatorBar />
      <div className="flex-1 min-h-0 overflow-y-auto pb-20 lg:pb-8">
        <div className="px-4 pt-4 lg:max-w-2xl lg:mx-auto lg:px-6 lg:pt-6">
          {viewing && viewingId ? (
            <OrderDetail
              order={viewing}
              error={viewingError}
              onBack={closeDetail}
              onAddMore={handleAddMore}
            />
          ) : (
            <section aria-labelledby="operator-orders-title" className="flex flex-col gap-[14px]">
              <div>
                <h1
                  id="operator-orders-title"
                  className="m-0 text-[24px] font-bold tracking-[-0.02em] text-[var(--ink)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Mis pedidos
                </h1>
                <p className="m-0 text-[13px] text-[var(--ink-2)]">
                  Hoy en {info.branch.name} · se actualiza solo
                </p>
              </div>

              <div className="grid grid-cols-2 gap-[10px]">
                <div className="flex flex-col gap-[2px] rounded-[14px] bg-[#fff4e5] px-[14px] py-3">
                  <span className="text-[12px] font-semibold text-[#8a3c04]">Por cobrar</span>
                  <span className="text-[20px] font-bold text-[var(--ink)]">
                    {formatPrice(summary.unpaidTotal)}
                  </span>
                  <span className="text-[12px] text-[#8a3c04]">
                    {summary.unpaidCount === 1
                      ? '1 pedido sin pagar'
                      : `${summary.unpaidCount} pedidos sin pagar`}
                  </span>
                </div>
                <div className="flex flex-col gap-[2px] rounded-[14px] border border-[var(--line)] bg-[var(--surface)] px-[14px] py-3">
                  <span className="text-[12px] font-semibold text-[var(--ink-2)]">Tomados hoy</span>
                  <span className="text-[20px] font-bold text-[var(--ink)]">{orders.length}</span>
                  <span className="text-[12px] text-[var(--ink-2)]">
                    {summary.openCount === 1
                      ? '1 sigue abierto'
                      : `${summary.openCount} siguen abiertos`}
                  </span>
                </div>
              </div>

              {stale && (
                <p role="alert" className="m-0 flex items-center gap-2 text-[13px] text-[#8a3c04]">
                  <AlertCircle size={16} className="shrink-0" aria-hidden="true" />
                  No se pudo actualizar la lista.
                  <button onClick={runRefresh} className="underline underline-offset-2 font-medium">
                    Reintentar
                  </button>
                </p>
              )}

              {orders.length > 0 && (
                <div
                  role="group"
                  aria-label="Filtrar por estado"
                  className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-[2px] lg:mx-0 lg:flex-wrap lg:px-0"
                >
                  {filters.map((f) => {
                    const on = f.key === activeFilter;
                    return (
                      <button
                        key={f.key}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setFilter(f.key)}
                        className={`shrink-0 inline-flex items-center gap-[6px] min-h-10 px-[14px] rounded-full border text-[13px] ${
                          on
                            ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)] font-semibold'
                            : 'border-[var(--line-2)] bg-[var(--surface)] text-[var(--ink)] font-medium'
                        }`}
                      >
                        {f.label}
                        <span
                          className={`min-w-5 h-5 px-[6px] inline-flex items-center justify-center rounded-full text-[12px] font-bold ${
                            on ? 'bg-white/20 text-[var(--surface)]' : 'bg-[var(--line)] text-[var(--ink-2)]'
                          }`}
                        >
                          {f.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {viewingError && (
                <p role="alert" className="m-0 text-[13px] text-[#a11a1a]">
                  {viewingError}
                </p>
              )}

              {orders.length === 0 ? (
                <EmptyState
                  title="Todavía no tomaste pedidos hoy"
                  hint="Los que tomes en «Tomar pedido» aparecen aquí."
                />
              ) : visible.length === 0 ? (
                <EmptyState
                  title="No hay pedidos en este estado"
                  hint="Prueba con «Todos» o toma un pedido nuevo."
                />
              ) : (
                <ul className="m-0 flex list-none flex-col gap-[10px] p-0">
                  {visible.map((order) => (
                    <li key={order.id}>
                      <OrderCard order={order} onOpen={() => loadDetail(order.id)} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, onOpen }: { order: OperatorSessionOrder; onOpen: () => void }) {
  const meta = statusMeta(order.status);
  // Sin el campo (API anterior) se omite en vez de mostrar "undefined productos".
  const units =
    order.itemCount === undefined
      ? null
      : order.itemCount === 1
        ? '1 producto'
        : `${order.itemCount} productos`;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-[14px] text-left shadow-[var(--shadow-sm)] hover:border-[var(--line-2)]"
    >
      <span className="flex w-full items-center gap-2">
        <span className="text-[16px] font-bold text-[var(--ink)]">
          {order.tableLabel ?? 'Sin mesa'}
        </span>
        <span className="text-[13px] text-[var(--ink-2)]">#{order.orderNumber}</span>
        <span className="flex-1" />
        <span className={`shrink-0 rounded-full px-[10px] py-1 text-[12px] font-semibold ${meta.pill}`}>
          {meta.label}
        </span>
      </span>
      <span className="flex w-full items-center gap-2 text-[13px] text-[var(--ink-2)]">
        <span>
          {formatTime(order.createdAt)}
          {units && ` · ${units}`}
        </span>
        <span className="flex-1" />
        {isUnpaid(order) && (
          <span className="text-[12px] font-semibold text-[#8a3c04]">Sin pagar</span>
        )}
        <span className="text-[15px] font-bold text-[var(--ink)]">{formatPrice(order.total)}</span>
      </span>
    </button>
  );
}

function OrderDetail({
  order,
  error,
  onBack,
  onAddMore,
}: {
  order: OperatorOrderDetail;
  error: string | null;
  onBack: () => void;
  onAddMore: () => void;
}) {
  const meta = statusMeta(order.status);
  // Misma regla que la API (operatorEditMode): pagado o cerrado no se amplía.
  const closed = isClosed(order.status);
  const paid = order.status === 'PAID' || order.paymentStatus === 'PAID';
  const canAddMore = !closed && !paid;

  return (
    <section aria-labelledby="operator-order-detail-title" className="flex flex-col gap-[14px]">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver a Mis pedidos"
          className="-ml-3 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[var(--ink)]"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <h1
            id="operator-order-detail-title"
            className="m-0 truncate text-[16px] font-bold text-[var(--ink)]"
          >
            {order.tableLabel ? `${order.tableLabel} · ` : ''}Pedido #{order.orderNumber}
          </h1>
        </div>
        <span className={`shrink-0 rounded-full px-[10px] py-1 text-[12px] font-semibold ${meta.pill}`}>
          {meta.label}
        </span>
      </div>

      {!paid && !closed && (
        <div
          role="status"
          className="flex items-center gap-[10px] rounded-[14px] bg-[#fff4e5] px-[14px] py-3 text-[13px] text-[#8a3c04]"
        >
          <AlertCircle size={18} className="shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold">Pendiente de pago.</strong> Aún puedes sumar productos.
          </span>
        </div>
      )}

      <ul className="m-0 list-none overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--surface)] p-0">
        {order.items.map((item, index) => (
          <li
            key={`${item.productVariantId ?? item.productId}-${index}`}
            className="flex items-start gap-3 border-b border-[var(--line)] px-4 py-[14px]"
          >
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-[var(--line)] text-[13px] font-bold text-[var(--ink)]">
              {item.quantity}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
              <span className="text-[15px] font-semibold text-[var(--ink)]">{item.productName}</span>
              {item.notes && <span className="text-[13px] text-[var(--ink-2)]">{item.notes}</span>}
            </span>
            <span className="shrink-0 text-[14px] font-semibold text-[var(--ink)]">
              {formatPrice(item.unitPrice * item.quantity)}
            </span>
          </li>
        ))}
        <li className="flex items-center justify-between bg-[var(--bg)] px-4 py-[14px]">
          <span className="text-[15px] font-semibold text-[var(--ink)]">Total</span>
          <span className="text-[20px] font-bold text-[var(--ink)]">{formatPrice(order.total)}</span>
        </li>
      </ul>

      {error && (
        <p role="alert" className="m-0 text-[13px] text-[#a11a1a]">
          {error}
        </p>
      )}

      <div className="flex gap-[10px]">
        <button
          type="button"
          onClick={onBack}
          className="min-h-12 flex-1 rounded-[14px] border border-[var(--line-2)] bg-[var(--surface)] text-[15px] font-semibold text-[var(--ink)]"
        >
          Volver
        </button>
        {canAddMore && (
          <button
            type="button"
            onClick={onAddMore}
            className="inline-flex min-h-12 flex-[1.4] items-center justify-center gap-2 rounded-[14px] bg-[var(--accent)] text-[15px] font-semibold text-[var(--accent-ink)]"
          >
            <Plus size={18} aria-hidden="true" />
            Sumar productos
          </button>
        )}
      </div>
      {!canAddMore && (
        <p className="m-0 text-[13px] text-[var(--ink-2)]">
          {closed
            ? 'Este pedido está cerrado: para sumar productos toma una orden nueva.'
            : 'Este pedido ya está pagado: para sumar productos toma una orden nueva.'}
        </p>
      )}
    </section>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-[6px] px-4 py-8 text-center text-[var(--ink-2)]">
      <span className="text-[15px] font-semibold text-[var(--ink)]">{title}</span>
      <span className="text-[13px]">{hint}</span>
    </div>
  );
}
