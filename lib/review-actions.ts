/**
 * Server Action: encuesta de satisfacción y calificación de los productos de
 * un pedido entregado.
 */

'use server';

import { NotFoundError, RateLimitError, submitProductReviews } from './api';
import { isValidSlug } from './utils';
import type { SurveyAnswers } from '@/src/types/catalog.types';

export interface SubmitReviewsResult {
  success: boolean;
  error?: string;
}

const MAX_COMMENT = 500;

const isStars = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 5;

/** Deja solo respuestas válidas; sin la pregunta general no hay encuesta. */
function cleanSurvey(survey: SurveyAnswers | undefined): SurveyAnswers | undefined {
  if (!survey || !isStars(survey.overall)) return undefined;
  const optional = (value: number | null | undefined) => (isStars(value) ? value : undefined);
  return {
    overall: survey.overall,
    time: optional(survey.time),
    condition: optional(survey.condition),
    place: optional(survey.place),
    service: optional(survey.service),
    bot: optional(survey.bot),
    recommend: optional(survey.recommend),
    comment: survey.comment?.trim().slice(0, MAX_COMMENT) || undefined,
  };
}

export async function submitReviewsAction(
  businessSlug: string,
  token: string,
  items: Array<{ productId: string; rating: number; comment?: string }>,
  survey?: SurveyAnswers,
): Promise<SubmitReviewsResult> {
  if (!isValidSlug(businessSlug) || !token) {
    return { success: false, error: 'El enlace no es válido' };
  }
  const rated = items
    .filter((item) => isStars(item.rating))
    .map((item) => ({
      productId: item.productId,
      rating: item.rating,
      comment: item.comment?.trim().slice(0, MAX_COMMENT) || undefined,
    }));
  const answers = cleanSurvey(survey);
  if (rated.length === 0 && !answers) {
    return { success: false, error: 'Califica tu pedido o al menos un producto' };
  }

  try {
    await submitProductReviews(businessSlug, token, rated, answers);
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
