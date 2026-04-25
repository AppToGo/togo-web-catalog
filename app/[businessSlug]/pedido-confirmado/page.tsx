import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, MessageCircle, ArrowLeft } from 'lucide-react';
import { fetchCatalog, NotFoundError } from '@/lib/api';
import { isValidSlug } from '@/lib/utils';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ order?: string; wa?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { businessSlug } = await params;
  return {
    title: 'Pedido confirmado',
    robots: { index: false },
  };
}

export default async function OrderConfirmationPage({ params, searchParams }: PageProps) {
  const { businessSlug } = await params;
  const { order: orderNumber, wa: waUrl } = await searchParams;

  if (!isValidSlug(businessSlug)) notFound();

  let businessName = businessSlug;
  let primaryColor: string | undefined;
  let accentColor: string | undefined;

  try {
    const catalog = await fetchCatalog(businessSlug, {});
    businessName = catalog.business.name;
    primaryColor = catalog.business.primaryColor;
    accentColor = catalog.business.accentColor;
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    // Non-critical — page still renders with slug as fallback
  }

  const decodedWaUrl = waUrl ? decodeURIComponent(waUrl) : null;

  return (
    <main
      className="min-h-dvh flex flex-col items-center justify-center px-5 py-12 bg-[var(--bg)]"
      style={{
        ...(primaryColor ? { '--primary': primaryColor } as React.CSSProperties : {}),
        ...(accentColor ? { '--accent': accentColor } as React.CSSProperties : {}),
      }}
    >
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-[var(--accent-soft,#f0fdf4)] flex items-center justify-center">
          <CheckCircle size={40} className="text-[var(--accent)]" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-2">
          <h1
            className="text-[26px] font-bold text-[var(--ink)] tracking-[-0.03em] leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            ¡Tu pedido fue registrado!
          </h1>

          {orderNumber && (
            <div className="inline-flex items-center gap-1.5 self-center bg-[var(--accent-soft,#f0fdf4)] text-[var(--accent)] px-4 py-1.5 rounded-full text-[15px] font-bold tracking-[-0.01em]">
              #{orderNumber}
            </div>
          )}
        </div>

        {/* Body */}
        <p className="text-[15px] text-[var(--ink-2)] leading-relaxed">
          {orderNumber
            ? `Andá a WhatsApp y mencioná el número #${orderNumber} para coordinar los detalles de tu pedido.`
            : 'Andá a WhatsApp y coordiná los detalles de tu pedido con el negocio.'}
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-3 w-full">
          {decodedWaUrl && (
            <a
              href={decodedWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-[14px] rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] text-[15px] font-bold tracking-[-0.01em] flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-80 shadow-[0_4px_14px_rgba(20,20,15,0.1)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <MessageCircle size={18} />
              Abrir WhatsApp
            </a>
          )}

          <Link
            href={`/${businessSlug}`}
            className="w-full py-[13px] rounded-xl border border-[var(--line)] text-[var(--ink-2)] text-[15px] font-semibold flex items-center justify-center gap-2 transition-colors hover:bg-[var(--surface)] active:bg-[var(--line)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <ArrowLeft size={16} />
            Volver al catálogo
          </Link>
        </div>

        {/* Business name */}
        <p className="text-xs text-[var(--ink-3)] mt-2">{businessName}</p>
      </div>
    </main>
  );
}
