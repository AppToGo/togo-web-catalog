/**
 * CatalogHeader - Server Component
 * 
 * Optimizaciones:
 * - Next.js Image para logo y banner (optimización automática)
 * - CSS variables para colores dinámicos
 * - Link prefetch para navegación instantánea
 * - Server-side rendering (zero JS)
 * 
 * Updated for normalized catalog (BusinessProduct + GlobalProduct)
 */

import Image from 'next/image';
import Link from 'next/link';
import type { BusinessInfo } from '@/src/types/catalog.types';
import { Store } from 'lucide-react';
import { CartButton } from '@/components/client/cart-button';

interface CatalogHeaderProps {
  business: BusinessInfo;
  businessSlug: string;
}

export function CatalogHeader({ business, businessSlug }: CatalogHeaderProps) {
  const gradientStyle = {
    background: `linear-gradient(135deg, ${business.primaryColor} 0%, ${business.primaryColor}dd 100%)`,
  };

  return (
    <>
      {/* Header Principal */}
      <header 
        className="sticky top-0 z-40 w-full"
        style={gradientStyle}
      >
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo y Nombre */}
            <Link 
              href={`/catalog/${businessSlug}`}
              className="flex items-center gap-3 group"
              prefetch={true}
            >
              <div className="relative w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-white/30 group-hover:scale-105 transition-transform">
                {business.logo ? (
                  <Image
                    src={business.logo}
                    alt={business.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                    priority
                  />
                ) : (
                  <Store className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">
                  {business.name}
                </h1>
                {business.description && (
                  <p className="text-xs text-white/80 line-clamp-1 max-w-[200px] sm:max-w-xs">
                    {business.description}
                  </p>
                )}
              </div>
            </Link>

            {/* Botón Carrito (Client Component) */}
            <CartButton accentColor={business.accentColor} />
          </div>
        </div>
      </header>

      {/* Banner de Portada */}
      {business.banner && (
        <div className="w-full h-48 md:h-64 relative overflow-hidden">
          <Image
            src={business.banner}
            alt={`${business.name} banner`}
            fill
            className="object-cover"
            sizes="100vw"
            priority
            quality={85}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}
    </>
  );
}
