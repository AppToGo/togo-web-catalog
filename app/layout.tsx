/**
 * Root Layout
 * 
 * Configuración base del catálogo ToGo.
 * 
 * OPTIMIZACIONES:
 * - Preconnect a dominios críticos
 * - DNS prefetch para APIs
 * - Viewport optimizado para mobile
 * - Metadata base completa
 */

import type { Metadata, Viewport } from 'next';
import './globals.css';

// ═══════════════════════════════════════════════════════════
// METADATA BASE
// ═══════════════════════════════════════════════════════════

export const metadata: Metadata = {
  title: {
    default: 'ToGo - Catálogo Online',
    template: '%s | ToGo',
  },
  description: 'Haz tu pedido online fácilmente. Encuentra los mejores productos y recíbelos en la puerta de tu casa.',
  keywords: ['catálogo online', 'pedidos', 'tienda virtual', 'ecommerce', 'ToGo'],
  authors: [{ name: 'ToGo' }],
  creator: 'ToGo',
  publisher: 'ToGo',
  
  // Manifest y icons
  manifest: '/manifest.json',
  
  // OpenGraph base
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'ToGo',
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Verification
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

// ═══════════════════════════════════════════════════════════
// VIEWPORT (Mobile Optimized)
// ═══════════════════════════════════════════════════════════

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1917' },
  ],
};

// ═══════════════════════════════════════════════════════════
// LAYOUT
// ═══════════════════════════════════════════════════════════

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* Preconnect a dominios críticos */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL || ''} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL || ''} />
        
        {/* Preconnect a CDNs comunes de imágenes */}
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
