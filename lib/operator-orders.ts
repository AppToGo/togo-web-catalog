import type { OperatorSessionOrder } from '@/src/types/catalog.types';

/** Pedido cerrado sin entregar: cancelado o abandonado. */
export const isClosedOrder = (status: string) => status === 'CANCELLED' || status === 'ABANDONED';

/** Cuenta por cobrar: ni pagado ni cerrado por cancelación o abandono. */
export const isUnpaidOrder = (order: OperatorSessionOrder) =>
  order.paymentStatus !== 'PAID' && !isClosedOrder(order.status);
