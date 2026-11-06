/**
 * Server Action: calificar los productos de un pedido entregado.
 */

'use server';

import { NotFoundError, RateLimitError, submitProductReviews } from './api';
import { isValidSlug } from './utils';

export interface SubmitReviewsResult {
  success: boolean;
  error?: string;
}

const MAX_COMMENT = 500;

export async function submitReviewsAction(
  businessSlug: string,
  token: string,
  items: Array<{ productId: string; rating: number; comment?: string }>,
): Promise<SubmitReviewsResult> {
  if (!isValidSlug(businessSlug) || !token) {
    return { success: false, error: 'El enlace no es válido' };
  }
  const rated = items
    .filter((item) => Number.isInteger(item.rating) && item.rating >= 1 && item.rating <= 5)
    .map((item) => ({
      productId: item.productId,
      rating: item.rating,
      comment: item.comment?.trim().slice(0, MAX_COMMENT) || undefined,
    }));
  if (rated.length === 0) {
    return { success: false, error: 'Elige las estrellas de al menos un producto' };
  }

  try {
    await submitProductReviews(businessSlug, token, rated);
    return { success: true };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: 'El enlace ya venció o no es válido' };
    }
    if (error instanceof RateLimitError) {
      return { success: false, error: 'Demasiados intentos. Prueba en un minuto' };
    }
    return { success: false, error: 'No pudimos guardar tu calificación. Intenta de nuevo' };
  }
}
