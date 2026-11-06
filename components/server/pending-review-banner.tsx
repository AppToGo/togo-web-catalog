/**
 * Banner "Califica tu pedido": cliente que llegó con token de WhatsApp y
 * tiene un pedido entregado sin calificar (flag PRODUCT_REVIEWS).
 */

import Link from "next/link";

interface PendingReviewBannerProps {
  businessSlug: string;
  pendingReview?: { token: string; orderNumber: string };
}

export function PendingReviewBanner({
  businessSlug,
  pendingReview,
}: PendingReviewBannerProps) {
  if (!pendingReview) return null;
  return (
    <div className="px-4 pt-3 lg:px-6">
      <Link
        href={`/${businessSlug}/calificar/${encodeURIComponent(pendingReview.token)}`}
        className="flex items-center gap-3 px-4 py-3 rounded-[14px] bg-(--accent-soft) text-(--ink) hover:opacity-90 transition-opacity"
      >
        <span aria-hidden="true" className="text-[22px] text-(--accent)">
          ★
        </span>
        <span className="flex-1 min-w-0 text-[14px] leading-snug">
          <span className="font-semibold">¿Qué tal estuvo tu pedido #{pendingReview.orderNumber}?</span>{" "}
          Califícalo en un minuto.
        </span>
        <span className="text-[13px] font-bold text-(--accent)">Calificar</span>
      </Link>
    </div>
  );
}
