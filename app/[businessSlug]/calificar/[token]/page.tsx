import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchCatalog, getReviewableOrder, NotFoundError } from '@/lib/api';
import { isValidSlug } from '@/lib/utils';
import { catalogThemeStyle } from '@/components/server/catalog-view';
import { ReviewForm } from '@/components/client/review-form';
import type { ReviewableOrder } from '@/src/types/catalog.types';

interface PageProps {
  params: Promise<{ businessSlug: string; token: string }>;
}

export const metadata: Metadata = {
  title: 'Encuesta de satisfacción',
  robots: { index: false },
};

/**
 * Encuesta de satisfacción de un pedido entregado (flag PRODUCT_REVIEWS). Se llega con el
 * enlace firmado que el bot agrega al aviso de "pedido entregado".
 */
export default async function ReviewPage({ params }: PageProps) {
  const { businessSlug, token } = await params;
  if (!isValidSlug(businessSlug)) notFound();

  const [catalog, order] = await Promise.all([
    fetchCatalog(businessSlug).catch((err) => {
      if (err instanceof NotFoundError) notFound();
      return null;
    }),
    getReviewableOrder(businessSlug, token).catch((err): ReviewableOrder | null => {
      if (err instanceof NotFoundError) return null;
      throw err;
    }),
  ]);

  return (
    <main
      data-catalog-theme
      style={catalog ? catalogThemeStyle(catalog.business) : undefined}
      className="min-h-dvh flex flex-col items-center px-5 py-10 bg-(--bg)"
    >
      <div className="w-full max-w-md flex flex-col gap-6">
        {order ? (
          <>
            <header className="flex flex-col gap-1.5 text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.04em] text-(--ink-3)">
                {order.businessName} · Pedido #{order.orderNumber}
              </span>
              <h1
                className="m-0 text-[26px] font-bold text-(--ink) tracking-[-0.03em] leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                ¿Qué tal estuvo tu pedido?
              </h1>
              <p className="m-0 text-[15px] text-(--ink-2) leading-relaxed">
                Te toma menos de un minuto. Tu opinión ayuda a {order.businessName} a mejorar y a
                otros clientes a elegir.
              </p>
            </header>
            <ReviewForm businessSlug={businessSlug} token={token} order={order} />
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center pt-10">
            <div className="text-[48px]" aria-hidden="true">
              ⏳
            </div>
            <h1
              className="m-0 text-[22px] font-bold text-(--ink) tracking-[-0.03em]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Este enlace ya no está disponible
            </h1>
            <p className="m-0 text-[15px] text-(--ink-2) leading-relaxed">
              Los enlaces para calificar duran 30 días desde la entrega del pedido.
            </p>
          </div>
        )}

        <Link
          href={`/${businessSlug}`}
          className="self-center text-sm font-semibold text-(--accent) hover:underline"
        >
          Ver el catálogo
        </Link>
      </div>
    </main>
  );
}
