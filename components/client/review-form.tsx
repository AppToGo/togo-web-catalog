'use client';

/**
 * Formulario para calificar los productos de un pedido entregado: estrellas
 * por producto y un comentario opcional. Precarga lo que el cliente ya
 * calificó (puede corregirlo mientras el enlace esté vigente).
 */

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { CheckCircle } from 'lucide-react';
import { submitReviewsAction } from '@/lib/review-actions';
import { getInitials } from '@/components/ui/initials-avatar';
import type { ReviewableOrder } from '@/src/types/catalog.types';

const STAR_LABELS = ['Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
const COMMENT_MAX = 500;

interface ReviewFormProps {
  businessSlug: string;
  token: string;
  order: ReviewableOrder;
}

export function ReviewForm({ businessSlug, token, order }: ReviewFormProps) {
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

  const ratedCount = Object.keys(ratings).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitReviewsAction(
        businessSlug,
        token,
        Object.entries(ratings).map(([productId, rating]) => ({
          productId,
          rating,
          comment: comments[productId],
        })),
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
          ¡Gracias por calificar!
        </h2>
        <p className="m-0 text-[15px] text-(--ink-2)">
          {order.businessName} ya puede ver tu opinión.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  <div className="w-12 h-12 rounded-lg shrink-0 relative overflow-hidden">
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

              <div
                role="radiogroup"
                aria-label={`Calificación de ${item.name}`}
                className="flex items-center gap-1"
              >
                {STAR_LABELS.map((label, index) => {
                  const value = index + 1;
                  const active = value <= rating;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={rating === value}
                      aria-label={`${value} ${value === 1 ? 'estrella' : 'estrellas'}: ${label}`}
                      onClick={() =>
                        setRatings((prev) => ({ ...prev, [item.productId]: value }))
                      }
                      className={`w-10 h-10 flex items-center justify-center text-[28px] leading-none transition-transform active:scale-90 ${
                        active ? 'text-(--accent)' : 'text-(--line)'
                      }`}
                    >
                      ★
                    </button>
                  );
                })}
                {rating > 0 && (
                  <span className="ml-2 text-sm font-medium text-(--ink-2)">
                    {STAR_LABELS[rating - 1]}
                  </span>
                )}
              </div>

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
                  className="w-full px-3 py-2.5 rounded-xl border border-(--line) bg-(--bg) text-[15px] text-(--ink) placeholder:text-(--ink-3) resize-none focus:outline-none focus:border-(--accent)"
                />
              )}
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="alert" className="m-0 text-sm text-red-600 text-center">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={ratedCount === 0 || isPending}
        className="w-full py-[14px] rounded-xl bg-(--accent) text-(--accent-ink) text-[15px] font-bold tracking-[-0.01em] transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {isPending ? 'Enviando…' : 'Enviar calificación'}
      </button>
    </form>
  );
}
