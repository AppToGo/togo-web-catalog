/**
 * OpenGraph Image - Generación Dinámica
 * 
 * Se genera en el edge runtime para cada catálogo.
 * Usa @vercel/og (incluido en Next.js) para generar imágenes
 * desde JSX sin necesidad de un servidor de imágenes.
 * 
 * PERFORMANCE:
 * - Generado una vez y cacheado (ISR)
 * - Formato PNG optimizado
 * - 1200x630 (tamaño estándar OG)
 */

import { ImageResponse } from 'next/og';
import { getCatalog } from '@/lib/api';

// Route segment config
export const runtime = 'edge';
export const alt = 'Catálogo ToGo';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// ISR para la imagen también
export const revalidate = 3600;

interface Props {
  params: Promise<{ token: string }>;
}

export default async function OpenGraphImage({ params }: Props) {
  const { token } = await params;

  try {
    const catalog = await getCatalog(token);
    const { business, products } = catalog;
    
    // Colores del negocio o defaults
    const primaryColor = business.primaryColor || '#ea580c';
    const accentColor = business.accentColor || '#f97316';
    
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
            padding: '60px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Header con logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {business.logo ? (
              <img
                src={business.logo}
                width="80"
                height="80"
                style={{
                  borderRadius: '16px',
                  objectFit: 'cover',
                  background: 'white',
                }}
              />
            ) : (
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 16,
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 40,
                }}
              >
                🏪
              </div>
            )}
            <div>
              <h1
                style={{
                  fontSize: 56,
                  fontWeight: 800,
                  color: 'white',
                  margin: 0,
                  lineHeight: 1.1,
                }}
              >
                {business.name}
              </h1>
              <p
                style={{
                  fontSize: 24,
                  color: 'rgba(255,255,255,0.9)',
                  margin: '8px 0 0 0',
                }}
              >
                {business.industry || 'Catálogo Online'}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              gap: '48px',
              marginTop: '48px',
              padding: '32px 40px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '24px',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 48,
                  fontWeight: 800,
                  color: 'white',
                  margin: 0,
                }}
              >
                {products.length}+
              </p>
              <p
                style={{
                  fontSize: 20,
                  color: 'rgba(255,255,255,0.8)',
                  margin: '4px 0 0 0',
                }}
              >
                Productos disponibles
              </p>
            </div>
            <div
              style={{
                width: 2,
                background: 'rgba(255,255,255,0.3)',
              }}
            />
            <div>
              <p
                style={{
                  fontSize: 48,
                  fontWeight: 800,
                  color: 'white',
                  margin: 0,
                }}
              >
                🛒
              </p>
              <p
                style={{
                  fontSize: 20,
                  color: 'rgba(255,255,255,0.8)',
                  margin: '4px 0 0 0',
                }}
              >
                Pedidos online
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <p
              style={{
                fontSize: 20,
                color: 'rgba(255,255,255,0.8)',
                margin: 0,
              }}
            >
              {business.phone && `📞 ${business.phone}`}
            </p>
            <p
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: 'white',
                margin: 0,
                padding: '12px 24px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 12,
              }}
            >
              togo.shop
            </p>
          </div>
        </div>
      ),
      {
        ...size,
        // Optimizaciones
        emoji: 'fluent',
        fonts: undefined, // Usa fuentes del sistema (más rápido)
      }
    );
  } catch {
    // Fallback si hay error
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
          }}
        >
          <h1 style={{ fontSize: 72, color: 'white', fontWeight: 800 }}>
            🛒 ToGo
          </h1>
          <p style={{ fontSize: 32, color: 'rgba(255,255,255,0.9)' }}>
            Catálogo Online
          </p>
        </div>
      ),
      { ...size }
    );
  }
}
