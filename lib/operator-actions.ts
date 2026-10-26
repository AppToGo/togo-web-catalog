/**
 * Server Actions del modo operador del catálogo.
 *
 * Un mesero abre el catálogo con un link `?op=...` generado desde el admin
 * (sesión por turno). Cada llamada reenvía ese token en el header
 * `X-Operator-Session`; el backend lo valida y revalida los permisos del
 * operador en cada pedido.
 */

'use server';

import {
  createOperatorOrder,
  getOperatorSession,
  getOperatorSessionOrders,
  InvalidTokenError,
} from './api';
import type {
  CartItem,
  CreatedOperatorOrder,
  OperatorSessionInfo,
  OperatorSessionOrder,
} from '@/src/types/catalog.types';

type OperatorActionResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      /** La sesión venció, fue revocada o el operador perdió permisos */
      errorCode?: 'INVALID_SESSION';
    };

function toFailure(error: unknown, fallback: string): OperatorActionResult<never> {
  if (error instanceof InvalidTokenError) {
    return {
      success: false,
      error: 'Tu sesión de operador venció o fue cerrada. Pide un link nuevo en el admin.',
      errorCode: 'INVALID_SESSION',
    };
  }
  return { success: false, error: error instanceof Error ? error.message : fallback };
}

export async function getOperatorSessionAction(
  businessSlug: string,
  token: string,
): Promise<OperatorActionResult<OperatorSessionInfo>> {
  try {
    return { success: true, data: await getOperatorSession(businessSlug, token) };
  } catch (error) {
    return toFailure(error, 'No se pudo validar la sesión de operador');
  }
}

export async function getOperatorOrdersAction(
  businessSlug: string,
  token: string,
): Promise<OperatorActionResult<OperatorSessionOrder[]>> {
  try {
    return { success: true, data: await getOperatorSessionOrders(businessSlug, token) };
  } catch (error) {
    return toFailure(error, 'No se pudieron cargar tus pedidos');
  }
}

export async function createOperatorOrderAction(
  businessSlug: string,
  token: string,
  data: {
    items: CartItem[];
    tableId: string;
    notes?: string;
    idempotencyKey: string;
  },
): Promise<OperatorActionResult<CreatedOperatorOrder>> {
  try {
    const order = await createOperatorOrder(businessSlug, token, {
      ...data,
      items: data.items.map(({ productId, variantId, quantity, notes }) => ({
        productId,
        variantId,
        quantity,
        notes: notes || undefined,
      })),
      notes: data.notes || undefined,
    });
    return { success: true, data: order };
  } catch (error) {
    return toFailure(error, 'No se pudo enviar el pedido');
  }
}
