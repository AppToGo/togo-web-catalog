/**
 * Success Page
 * Server Component - página de confirmación de orden
 */

import { getTheme, generateThemeCSS } from '@/lib/theme';

interface SuccessPageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ order?: string; phone?: string }>;
}

export default async function SuccessPage({ params, searchParams }: SuccessPageProps) {
  const { token } = await params;
  const { order: orderNumber, phone: businessPhone } = await searchParams;

  const theme = getTheme('RESTAURANT');

  // Construir URL de WhatsApp si hay teléfono
  const whatsappUrl = businessPhone 
    ? `https://wa.me/${businessPhone.replace(/\D/g, '')}`
    : null;

  return (
    <>
      <style>{`:root { ${generateThemeCSS(theme)} }`}</style>

      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* Icono */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center text-4xl">
            ✅
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
            ¡Pedido recibido!
          </h1>

          <p className="text-[var(--color-muted-foreground)] mb-6">
            Tu pedido ha sido guardado. Continúa en WhatsApp para confirmar los detalles.
          </p>

          {/* Número de orden */}
          {orderNumber && (
            <div className="bg-[var(--color-card)] rounded-[var(--radius)] border border-[var(--color-border)] p-6 mb-6">
              <p className="text-sm text-[var(--color-muted-foreground)] mb-1">
                Número de pedido
              </p>
              <p className="text-3xl font-mono font-bold text-[var(--color-foreground)] tracking-wider">
                {orderNumber}
              </p>
            </div>
          )}

          {/* Acciones */}
          <div className="space-y-3">
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-[#25D366] text-white font-semibold rounded-[var(--radius)] hover:opacity-90 transition-opacity"
              >
                Continuar en WhatsApp →
              </a>
            ) : (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Te contactaremos pronto por WhatsApp.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
