import type { OperatorSessionOrder } from '@/src/types/catalog.types';

/** Pedido cerrado sin entregar: cancelado o abandonado. */
export const isClosedOrder = (status: string) => status === 'CANCELLED' || status === 'ABANDONED';

/**
 * Estados de pago que todavía deben plata. Lista explícita y no "todo lo
 * que no sea PAID": si la API aún no manda el campo (catálogo desplegado
 * antes), un `undefined` no debe contar como deuda; REFUNDED tampoco.
 */
const UNPAID_PAYMENT_STATUSES = ['PENDING', 'FAILED'];

/** Cuenta por cobrar: pago pendiente o fallido, y el pedido no se cerró. */
export const isUnpaidOrder = (order: OperatorSessionOrder) =>
  UNPAID_PAYMENT_STATUSES.includes(order.paymentStatus ?? '') &&
  !isClosedOrder(order.status);
