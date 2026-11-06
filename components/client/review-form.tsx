'use client';

/**
 * Encuesta de satisfacción de un pedido entregado: preguntas generales del
 * pedido (todas de 1 a 5 estrellas), estrellas por producto y un comentario
 * general. Precarga lo que el cliente ya respondió (puede corregirlo mientras
 * el enlace esté vigente).
 */

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { CheckCircle } from 'lucide-react';
import { submitReviewsAction } from '@/lib/review-actions';
import { getInitials } from '@/components/ui/initials-avatar';
import type { ReviewableOrder, SurveyAnswers } from '@/src/types/catalog.types';

const STAR_LABELS = ['Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
const RECOMMEND_LABELS = ['Nada probable', 'Poco probable', 'Tal vez', 'Probable', 'Muy probable'];
const COMMENT_MAX = 500;

type SurveyQuestion =
  | 'overall'
  | 'time'
  | 'condition'
  | 'place'
  | 'service'
  | 'bot'
  | 'recommend';

interface Question {
  key: SurveyQuestion;
  label: string;
  labels: string[];
}

/** Pregunta de tiempo de cada tipo de pedido. */
const TIME_LABEL: Record<NonNullable<ReviewableOrder['deliveryType']>, string> = {
  DELIVERY: '¿Llegó a tiempo?',
  PICKUP: '¿Estaba listo a tiempo?',
  DINE_IN: '¿Qué tal el tiempo de espera?',
  COUNTER: '¿Qué tal el tiempo de espera?',
};

/**
 * Preguntas según el tipo de pedido: cómo llegó solo en domicilio y cómo
 * estuvo el lugar solo en mesa. La API descarta las de otro tipo.
 */
function questionsFor(deliveryType: ReviewableOrder['deliveryType']): Question[] {
  const question = (key: SurveyQuestion, label: string, labels = STAR_LABELS): Question => ({
    key,
    label,
    labels,
  });
  return [
    question('overall', '¿Cómo estuvo tu pedido en general?'),
    question('time', deliveryType ? TIME_LABEL[deliveryType] : '¿Qué tal el tiempo de espera?'),
    ...(deliveryType === 'DELIVERY' ? [question('condition', '¿Cómo llegó tu pedido?')] : []),
    ...(deliveryType === 'DINE_IN'
      ? [question('place', '¿Cómo estuvo el lugar? (ambiente y limpieza)')]
      : []),
    question('service', '¿Cómo te atendimos?'),
    question('bot', '¿Qué tal nuestro asistente de WhatsApp?'),
    question('recommend', '¿Qué tan probable es que nos recomiendes?', RECOMMEND_LABELS),
  ];
}

interface StarRatingProps {
  value: number;
  labels: string[];
  ariaLabel: string;
  onChange: (value: number) => void;
}

function StarRating({ value, labels, ariaLabel, onChange }: StarRatingProps) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex items-center gap-1">
      {labels.map((label, index) => {
        const stars = index + 1;
        return (
          <button
            key={stars}
            type="button"
            role="radio"
            aria-checked={value === stars}
            aria-label={`${stars} ${stars === 1 ? 'estrella' : 'estrellas'}: ${label}`}
            onClick={() => onChange(stars)}
            className={`w-10 h-10 flex items-center justify-center text-[28px] leading-none transition-transform active:scale-90 ${
              stars <= value ? 'text-(--accent)' : 'text-(--line)'
            }`}
          >
            ★
          </button>
        );
      })}
      {value > 0 && (
        <span className="ml-2 text-sm font-medium text-(--ink-2)">{labels[value - 1]}</span>
      )}
    </div>
  );
}

const sectionTitleClass =
  'm-0 text-[17px] font-bold text-(--ink) tracking-[-0.02em]';
const textareaClass =
  'w-full px-3 py-2.5 rounded-xl border border-(--line) bg-(--bg) text-[15px] text-(--ink) placeholder:text-(--ink-3) resize-none focus:outline-none focus:border-(--accent)';

interface ReviewFormProps {
  businessSlug: string;
  token: string;
  order: ReviewableOrder;
}

export function ReviewForm({ businessSlug, token, order }: ReviewFormProps) {
  const questions = questionsFor(order.deliveryType);
  const [answers, setAnswers] = useState<Partial<Record<SurveyQuestion, number>>>(() => {
    const saved = order.survey;
    if (!saved) return {};
    return Object.fromEntries(
      questions
        .map((q) => [q.key, saved[q.key]] as const)
        .filter(([, value]) => value != null),
    );
  });
  const [generalComment, setGeneralComment] = useState(order.survey?.comment ?? '');
  const [ratings, setRatings] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      order.items
        .filter((item) => item.rating != null)
        .map((item) => [item.productId, item.rating as number]),
    ),
  );
  const [comments, setComments] = useState<Record<string, string>>(() =>
    Object.fromEntries(order.items.map((item) => [item.productId, item.comment ?? ''])),
  );
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  // El negocio puede apagar la encuesta; los productos llegan vacíos si
  // apagó la calificación de productos.
  const surveyOn = order.options?.survey !== false;
  const hasOverall = answers.overall != null;
  const canSubmit = hasOverall || Object.keys(ratings).length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const survey: SurveyAnswers | undefined = hasOverall
      ? {
          overall: answers.overall as number,
          time: answers.time,
          condition: answers.condition,
          place: answers.place,
          service: answers.service,
          bot: answers.bot,
          recommend: answers.recommend,
          comment: generalComment,
        }
      : undefined;
    startTransition(async () => {
      const result = await submitReviewsAction(
        businessSlug,
        token,
        Object.entries(ratings).map(([productId, rating]) => ({
          productId,
          rating,
          comment: comments[productId],
        })),
        survey,
      );
      if (result.success) setSent(true);
      else setError(result.error ?? 'No pudimos guardar tu calificación');
    });
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 text-center py-6" role="status">
        <div className="w-16 h-16 rounded-full bg-(--accent-soft) flex items-center justify-center">
          <CheckCircle size={32} className="text-(--accent)" strokeWidth={1.5} />
        </div>
        <h2
          className="m-0 text-[20px] font-bold text-(--ink) tracking-[-0.03em]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          ¡Gracias por responder!
        </h2>
        <p className="m-0 text-[15px] text-(--ink-2)">
          {order.businessName} ya puede ver tu opinión.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {surveyOn && (
        <section className="flex flex-col gap-3">
          <h2 className={sectionTitleClass} style={{ fontFamily: 'var(--font-display)' }}>
            Tu pedido
          </h2>
          <ul className="m-0 p-0 list-none flex flex-col gap-3">
            {questions.map((question) => (
              <li
                key={question.key}
                className="flex flex-col gap-2 p-4 rounded-[18px] border border-(--line) bg-(--surface)"
              >
                <span className="text-[15px] font-semibold text-(--ink) tracking-[-0.01em]">
                  {question.label}
                </span>
                <StarRating
                  value={answers[question.key] ?? 0}
                  labels={question.labels}
                  ariaLabel={question.label}
                  onChange={(value) =>
                    setAnswers((prev) => ({ ...prev, [question.key]: value }))
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {order.items.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className={sectionTitleClass} style={{ fontFamily: 'var(--font-display)' }}>
            Lo que pediste
          </h2>
          <ul className="m-0 p-0 list-none flex flex-col gap-3">
            {order.items.map((item) => {
              const rating = ratings[item.productId] ?? 0;
              return (
                <li
                  key={item.productId}
                  className="flex flex-col gap-3 p-4 rounded-[18px] border border-(--line) bg-(--surface)"
                >
                  <div className="flex items-center gap-3">
                    {item.image ? (
                      <div className="w-12 aspect-[4/5] rounded-lg shrink-0 relative overflow-hidden">
                        <Image src={item.image} alt="" fill className="object-cover" sizes="48px" />
                      </div>
                    ) : (
                      <div
                        aria-hidden="true"
                        className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center bg-(--accent-soft) text-(--accent) font-bold"
                      >
                        {getInitials(item.name)}
                      </div>
                    )}
                    <span
                      className="text-[15px] font-semibold text-(--ink) tracking-[-0.01em]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {item.name}
                    </span>
                  </div>

                  <StarRating
                    value={rating}
                    labels={STAR_LABELS}
                    ariaLabel={`Calificación de ${item.name}`}
                    onChange={(value) =>
                      setRatings((prev) => ({ ...prev, [item.productId]: value }))
                    }
                  />

                  {rating > 0 && (
                    <textarea
                      value={comments[item.productId] ?? ''}
                      onChange={(e) =>
                        setComments((prev) => ({ ...prev, [item.productId]: e.target.value }))
                      }
                      maxLength={COMMENT_MAX}
                      rows={2}
                      placeholder="Cuéntanos más (opcional)"
                      aria-label={`Comentario sobre ${item.name}`}
                      className={textareaClass}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {surveyOn && (
        <section className="flex flex-col gap-3">
          <h2 className={sectionTitleClass} style={{ fontFamily: 'var(--font-display)' }}>
            ¿Algo más que quieras contarnos?
          </h2>
          <textarea
            value={generalComment}
            onChange={(e) => setGeneralComment(e.target.value)}
            maxLength={COMMENT_MAX}
            rows={3}
            placeholder={
              hasOverall
                ? 'Tu comentario sobre el pedido (opcional)'
                : 'Primero califica tu pedido en general'
            }
            disabled={!hasOverall}
            aria-label="Comentario general del pedido"
            className={`${textareaClass} disabled:opacity-50`}
          />
        </section>
      )}

      {error && (
        <p role="alert" className="m-0 text-sm text-red-600 text-center">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || isPending}
        className="w-full py-[14px] rounded-xl bg-(--accent) text-(--accent-ink) text-[15px] font-bold tracking-[-0.01em] transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {isPending ? 'Enviando…' : 'Enviar encuesta'}
      </button>
    </form>
  );
}
