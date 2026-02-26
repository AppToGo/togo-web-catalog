'use client';

import { useState } from 'react';
import { useCart } from './cart-context';
import { ShoppingCart, Store } from 'lucide-react';
import type { Business } from '@/lib/types';

interface CatalogHeaderProps {
  business: Business;
  onCartClick: () => void;
}

export function CatalogHeader({ business, onCartClick }: CatalogHeaderProps) {
  const { itemCount } = useCart();
  const [imageError, setImageError] = useState(false);
  
  // Generar gradiente basado en el color primario
  const gradientStyle = {
    background: `linear-gradient(135deg, ${business.primaryColor} 0%, ${business.primaryColor}dd 100%)`,
  };

  return (
    <>
      {/* Header Principal */}
      <header className="sticky top-0 z-40 w-full" style={gradientStyle}>
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo y Nombre */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-white/30">
                {business.logo && !imageError ? (
                  <img
                    src={business.logo}
                    alt={business.name}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <Store className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">
                  {business.name}
                </h1>
                <p className="text-xs text-white/80">
                  {business.description}
                </p>
              </div>
            </div>

            {/* Botón Carrito */}
            <button
              onClick={onCartClick}
              className="relative p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all active:scale-95"
            >
              <ShoppingCart className="w-6 h-6 text-white" />
              {itemCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: business.accentColor }}
                >
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Banner de Portada */}
      {business.banner && (
        <div className="w-full h-48 md:h-64 relative overflow-hidden">
          <img
            src={business.banner}
            alt={`${business.name} banner`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}
    </>
  );
}
