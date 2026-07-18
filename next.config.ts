import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ═══════════════════════════════════════════════════════
  // RENDERING
  // ═══════════════════════════════════════════════════════

  // Compression gzip/brotli
  compress: true,

  // ═══════════════════════════════════════════════════════
  // IMÁGENES
  // ═══════════════════════════════════════════════════════

  images: {
    // Formatos modernos para mejor compresión
    formats: ["image/avif", "image/webp"],

    // Allowed remote patterns: production public bucket + local MinIO in dev
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.togoapp.co",
      },
      ...(process.env.NODE_ENV !== "production"
        ? [
            {
              protocol: "http" as const,
              hostname: "localhost",
            },
          ]
        : []),
    ],

    // Tamaños de imagen para srcset
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Límite de tamaño (evita imágenes enormes)
    minimumCacheTTL: 60 * 60 * 24, // 1 día
  },

  // ═══════════════════════════════════════════════════════
  // HEADERS DE SEGURIDAD Y PERFORMANCE
  // ═══════════════════════════════════════════════════════

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // DNS Prefetch
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          // Security
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Referrer Policy
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              `img-src 'self' https: data: blob:${process.env.NODE_ENV !== 'production' ? ' http:' : ''}`,
              "font-src 'self'",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          // Cache para assets estáticos
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // HTML pages - cache corto para ISR
        source: "/:businessSlug*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },

  // ═══════════════════════════════════════════════════════
  // REDIRECTS
  // ═══════════════════════════════════════════════════════

  async redirects() {
    return [
      // Redirect legacy URLs
      {
        source: "/catalogo/:token*",
        destination: "/:token*",
        permanent: true,
      },
      {
        source: "/catalog/:token*",
        destination: "/:token*",
        permanent: true,
      },
    ];
  },

  // ═══════════════════════════════════════════════════════
  // EXPERIMENTAL FEATURES
  // ═══════════════════════════════════════════════════════

  experimental: {
    // Optimizar imports de paquetes grandes
    optimizePackageImports: ["lucide-react"],
    // Allow Server Actions from dev tunnel (x-forwarded-host mismatch with origin)
    serverActions: {
      allowedOrigins: [
        "catalogo.togoapp.co",
        "localhost:3001",
        "*.use2.devtunnels.ms",
        "*.devtunnels.ms",
      ],
    },
  },

  // ═══════════════════════════════════════════════════════
  // TYPESCRIPT
  // ═══════════════════════════════════════════════════════

  typescript: {
    // Ignorar errores en build (CI debería verificar)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
