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
  getOperatorOrderDetail,
  getOperatorSession,
  getOperatorSessionOrders,
  InvalidTokenError,
  RateLimitError,
  revokeOperatorSession,
  updateOperatorOrderItems,
  verifyOperatorPassword,
} from './api';
import type {
  CartItem,
  CreatedOperatorOrder,
  OperatorOrderDetail,
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
  if (error instanceof RateLimitError) {
    return { success: false, error: 'Demasiadas solicitudes. Espera unos segundos e intenta de nuevo.' };
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

export async function getOperatorOrderDetailAction(
  businessSlug: string,
  token: string,
  orderId: string,
): Promise<OperatorActionResult<OperatorOrderDetail>> {
  try {
    return { success: true, data: await getOperatorOrderDetail(businessSlug, token, orderId) };
  } catch (error) {
    return toFailure(error, 'No se pudo cargar el pedido');
  }
}

export async function updateOperatorOrderItemsAction(
  businessSlug: string,
  token: string,
  orderId: string,
  data: {
    items: CartItem[];
  },
): Promise<OperatorActionResult<CreatedOperatorOrder>> {
  try {
    const order = await updateOperatorOrderItems(businessSlug, token, orderId, {
      items: data.items.map(({ productId, variantId, quantity, notes }) => ({
        productId,
        variantId,
        quantity,
        notes: notes || undefined,
      })),
    });
    return { success: true, data: order };
  } catch (error) {
    return toFailure(error, 'No se pudo actualizar el pedido');
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

/** "Salir": cierra la sesión en el backend. Si falla, el catálogo sale igual. */
export async function revokeOperatorSessionAction(
  businessSlug: string,
  token: string,
): Promise<OperatorActionResult<null>> {
  try {
    await revokeOperatorSession(businessSlug, token);
    return { success: true, data: null };
  } catch (error) {
    return toFailure(error, 'No se pudo cerrar la sesión');
  }
}

export type VerifyPasswordErrorCode =
  | 'INVALID_SESSION'
  | 'INVALID_PASSWORD'
  | 'NO_PASSWORD_SET'
  | 'TOO_MANY_ATTEMPTS';

/**
 * El mesero confirma su contraseña al ingresar. La clave incorrecta llega
 * como 200 con `verified: false` (nunca 401): el token sigue vivo y la
 * sesión no se invalida. Un 401 sí es token muerto. Si la clave es
 * correcta la API devuelve un token nuevo: el del link deja de servir.
 */
export async function verifyOperatorPasswordAction(
  businessSlug: string,
  token: string,
  password: string,
): Promise<
  | { success: true; token: string }
  | { success: false; error: string; errorCode: VerifyPasswordErrorCode }
> {
  try {
    const result = await verifyOperatorPassword(businessSlug, token, password);
    if (result.verified) {
      if (result.token) return { success: true, token: result.token };
      return {
        success: false,
        error: 'No se pudo verificar la contraseña. Intenta de nuevo.',
        errorCode: 'INVALID_PASSWORD',
      };
    }
    if (result.reason === 'TOO_MANY_ATTEMPTS') {
      return {
        success: false,
        error:
          'Demasiados intentos con clave incorrecta: la sesión se cerró. Pide un link nuevo en el admin.',
        errorCode: 'TOO_MANY_ATTEMPTS',
      };
    }
    if (result.reason === 'NO_PASSWORD_SET') {
      return {
        success: false,
        error:
          'No tienes contraseña asignada. Pídele al dueño que te asigne una para tomar pedidos.',
        errorCode: 'NO_PASSWORD_SET',
      };
    }
    const left = result.attemptsLeft;
    return {
      success: false,
      error:
        left === 1
          ? 'Contraseña incorrecta. Te queda 1 intento antes de que se cierre la sesión.'
          : left
            ? `Contraseña incorrecta. Te quedan ${left} intentos.`
            : 'Contraseña incorrecta. Intenta de nuevo.',
      errorCode: 'INVALID_PASSWORD',
    };
  } catch (error) {
    if (error instanceof InvalidTokenError) {
      return {
        success: false,
        error:
          'Tu sesión de operador venció o fue cerrada. Pide un link nuevo en el admin.',
        errorCode: 'INVALID_SESSION',
      };
    }
    if (error instanceof RateLimitError) {
      return {
        success: false,
        error: 'Demasiados intentos. Espera unos segundos e intenta de nuevo.',
        errorCode: 'INVALID_PASSWORD',
      };
    }
    return {
      success: false,
      error: 'No se pudo verificar la contraseña. Intenta de nuevo.',
      errorCode: 'INVALID_PASSWORD',
    };
  }
}
