/**
 * Success Page - Diseño moderno con branding
 */

import { getCatalog } from "@/lib/api";
import { getTheme, generateThemeCSS } from "@/lib/theme";

interface SuccessPageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ order?: string; phone?: string }>;
}

export default async function SuccessPage({ params, searchParams }: SuccessPageProps) {
  const { token } = await params;
  const { order: orderNumber, phone: businessPhone } = await searchParams;

  let businessName = "El negocio";
  let accentColor = "#FF6B35";
  
  try {
    const catalog = await getCatalog(token);
    businessName = catalog.business.name;
    accentColor = catalog.business.accentColor;
  } catch {
    // Si falla, usar defaults
  }

  const whatsappUrl = businessPhone 
    ? `https://wa.me/${businessPhone.replace(/\D/g, '')}`
    : null;

  return (
    <>
      <style>{`:root { ${generateThemeCSS(getTheme('RESTAURANT'))} }`}</style>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* Icono de éxito */}
          <div 
            className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-5xl shadow-lg"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <span style={{ color: accentColor }}>✓</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Pedido recibido!
          </h1>

          <p className="text-gray-600 mb-6">
            {businessName} ha recibido tu pedido. Te contactaremos pronto por WhatsApp.
          </p>

          {/* Número de orden */}
          {orderNumber && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Número de pedido</p>
              <p className="text-4xl font-mono font-bold text-gray-900 tracking-wider">
                #{orderNumber}
              </p>
            </div>
          )}

          {/* Info de contacto */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              💡 Guarda este número de pedido para cualquier consulta
            </p>
          </div>

          {/* Botón WhatsApp */}
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 rounded-2xl text-white font-bold text-lg shadow-xl hover:opacity-90 transition-opacity"
              style={{ backgroundColor: accentColor }}
            >
              Continuar en WhatsApp →
            </a>
          ) : (
            <p className="text-sm text-gray-500">
              Te contactaremos pronto por WhatsApp.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
